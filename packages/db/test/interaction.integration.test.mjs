import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import {
  PostgresHumanContinuityRepository, PostgresInteractionRepository, PostgresRepositories,
} from "../dist/index.js";

const url = process.env.DROWK_TEST_DATABASE_URL;
if (!url) {
  test.skip("accepted interaction integration requires disposable PostgreSQL");
} else {
  const dbName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (process.env.DROWK_TEST_DISPOSABLE !== "1" || !/(_test|_ci)$/.test(dbName)) {
    throw new Error("Integration tests require DROWK_TEST_DISPOSABLE=1 and a *_test or *_ci database");
  }
  const pool = new pg.Pool({ connectionString: url });
  const repo = new PostgresInteractionRepository(pool);
  const sources = new PostgresRepositories(pool);
  const people = new PostgresHumanContinuityRepository(pool);
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const now = "2026-09-28T12:34:56.000Z";
  const conversation = (extra = {}) => ({
    id: randomUUID(), channel: "EMAIL", accountId: null, facilityId: null,
    sourceNamespace: "synthetic:mailbox-a", sourceConversationRef: "thread-1",
    recordedAt: now, supersedesId: null, ...extra,
  });
  const activity = (conversationId, sourceObservationId, evidenceIds,
    promotionPolicyDecisionId, extra = {}) => ({
    id: randomUUID(), conversationId, kind: "MESSAGE", direction: "INBOUND",
    sourceObservationId, evidenceIds, occurredAt: null, recordedAt: now,
    promotionPolicyDecisionId, supersedesId: null, ...extra,
  });
  const participant = (extra = {}) => ({
    id: randomUUID(), role: "FROM", personId: null, identityId: null,
    sourceParticipantNamespace: "synthetic:mailbox-a",
    sourceParticipantRef: "sender@example.invalid", recordedAt: now, ...extra,
  });
  async function createAccount(tenantId, name) {
    const id = randomUUID();
    await pool.query(`INSERT INTO accounts (id,tenant_id,name) VALUES ($1,$2,$3)`, [id, tenantId, name]);
    return id;
  }
  async function source(tenantId, nativeId = randomUUID(), revision = null,
    sourceNamespace = null) {
    const id = randomUUID();
    const result = await sources.appendObservation(tenantId, {
      id, runId: randomUUID(), correlationId: randomUUID(),
      sourceSystem: "SYNTHETIC", sourceNativeId: nativeId, sourceRevision: revision,
      observedAt: null, effectiveAt: null, retrievedAt: now, ingestedAt: now,
      recordedAt: now, sourceWatermark: null, adapterVersion: "test-v1",
      fingerprint: `sha256:${randomUUID()}`, rawArtifactRef: null,
      sourceMetadata: sourceNamespace ? { sourceNamespace } : {},
    });
    assert.equal(result.status, "inserted");
    return id;
  }
  async function evidence(tenantId, observationId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO evidence
      (id,tenant_id,run_id,correlation_id,observation_id,subject_entity_type,
       claim,value_json,trust_state,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'INTERACTION','synthetic.claim',$6::jsonb,'CLAIMED',$7)`,
    [id, tenantId, randomUUID(), randomUUID(), observationId,
      JSON.stringify({ synthetic: true }), now]);
    return id;
  }
  async function policy(tenantId, observationId, disposition = "ALLOW",
    evidenceComplete = true, action = "ACCEPT_INTERACTION") {
    const id = randomUUID();
    await pool.query(`INSERT INTO policy_decisions
      (id,tenant_id,run_id,correlation_id,subject_id,action,disposition,
       evidence_complete,policy_version,recorded_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'test-v1',$9)`,
    [id, tenantId, randomUUID(), randomUUID(), observationId, action,
      disposition, evidenceComplete, now]);
    return id;
  }
  async function context(tenantId = tenantA, conv = conversation()) {
    const c = await repo.createConversation(tenantId, conv);
    const o = await source(tenantId);
    const e = await evidence(tenantId, o);
    const d = await policy(tenantId, o);
    return { c, o, e, d };
  }

  before(async () => {
    await pool.query(`INSERT INTO tenants (id,slug,name) VALUES
      ($1,$2,'Synthetic A'),($3,$4,'Synthetic B')`,
    [tenantA, `test-${tenantA}`, tenantB, `test-${tenantB}`]);
  });
  after(async () => { await pool.end(); });

  test("goldens 1-2: namespace is required and raw thread IDs may coexist", async () => {
    const a = await repo.createConversation(tenantA, conversation());
    const b = await repo.createConversation(tenantA,
      conversation({ sourceNamespace: "synthetic:mailbox-b" }));
    assert.notEqual(a.id, b.id);
    assert.equal(a.sourceConversationRef, b.sourceConversationRef);
    assert.notEqual(a.sourceNamespace, b.sourceNamespace);
    assert.deepEqual(await repo.getConversation(tenantA, a.id), a);
    await assert.rejects(repo.createConversation(tenantA,
      conversation({ sourceNamespace: null })), { code: "23514" });
    await assert.rejects(repo.createConversation(tenantA,
      conversation({ sourceConversationRef: null })), { code: "23514" });
  });

  test("same raw message ID in distinct source namespaces may promote independently", async () => {
    const nativeId = randomUUID();
    const namespaceA = "SYNTHETIC:mailbox-a";
    const namespaceB = "SYNTHETIC:mailbox-b";
    const cA = await repo.createConversation(tenantA,
      conversation({ sourceNamespace: namespaceA }));
    const cB = await repo.createConversation(tenantA,
      conversation({ sourceNamespace: namespaceB }));
    const oA = await source(tenantA, nativeId, null, namespaceA);
    const oB = await source(tenantA, nativeId, null, namespaceB);
    const namespaces = (await pool.query(`SELECT source_namespace FROM source_observations
      WHERE tenant_id=$1 AND id=ANY($2::uuid[])`, [tenantA, [oA, oB]])).rows
      .map(row => row.source_namespace);
    assert.deepEqual(new Set(namespaces), new Set([namespaceA, namespaceB]));
    const eA = await evidence(tenantA, oA);
    const eB = await evidence(tenantA, oB);
    const dA = await policy(tenantA, oA);
    const dB = await policy(tenantA, oB);
    const a = await repo.promoteAcceptedActivity(tenantA,
      activity(cA.id, oA, [eA], dA), []);
    const b = await repo.promoteAcceptedActivity(tenantA,
      activity(cB.id, oB, [eB], dB), []);
    assert.equal(a.status, "inserted");
    assert.equal(b.status, "inserted");
    assert.notEqual(a.activity.id, b.activity.id);
  });

  test("goldens 3-6, 9: source, same-source evidence and exact ALLOW policy gate promotion", async () => {
    const { c, o, e, d } = await context();
    await assert.rejects(repo.promoteAcceptedActivity(tenantA,
      activity(c.id, randomUUID(), [e], d), []),
    { code: "SOURCE_OBSERVATION_MISSING" });
    await assert.rejects(repo.promoteAcceptedActivity(tenantA,
      activity(c.id, o, [], d), []),
    { code: "EVIDENCE_REQUIRED_OR_DUPLICATED" });
    const otherObservation = await source(tenantA);
    const otherEvidence = await evidence(tenantA, otherObservation);
    await assert.rejects(repo.promoteAcceptedActivity(tenantA,
      activity(c.id, o, [otherEvidence], d), []),
    { code: "ATTRIBUTABLE_EVIDENCE_MISSING" });
    const review = await policy(tenantA, o, "REVIEW");
    const deny = await policy(tenantA, o, "DENY");
    const incomplete = await policy(tenantA, o, "ALLOW", false);
    const wrongAction = await policy(tenantA, o, "ALLOW", true, "OTHER_ACTION");
    const wrongSubject = await policy(tenantA, otherObservation);
    for (const blocked of [review, deny, incomplete, wrongAction, wrongSubject]) {
      await assert.rejects(repo.promoteAcceptedActivity(tenantA,
        activity(c.id, o, [e], blocked), []),
      { code: "PROMOTION_POLICY_NOT_ALLOWED" });
    }
    const input = activity(c.id, o, [e], d);
    const result = await repo.promoteAcceptedActivity(tenantA, input, []);
    assert.equal(result.status, "inserted");
    assert.deepEqual(result.activity, { ...input, tenantId: tenantA });
    assert.equal(result.activity.occurredAt, null);
    assert.deepEqual(await repo.listEvidenceIdsForActivity(tenantA, input.id), [e]);
    assert.deepEqual(await repo.listActivitiesForConversation(tenantA, c.id), [result.activity]);
    const raw = await context();
    await assert.rejects(pool.query(`INSERT INTO activities
      (id,tenant_id,conversation_id,kind,direction,source_observation_id,
       source_namespace,source_native_id,recorded_at,promotion_policy_decision_id,
       accepted_payload_digest)
      VALUES ($1,$2,$3,'MESSAGE','UNKNOWN',$4,'SYNTHETIC',$5,$6,$7,$8)`,
    [randomUUID(), tenantA, raw.c.id, raw.o,
      (await pool.query(`SELECT source_native_id FROM source_observations WHERE id=$1`,
        [raw.o])).rows[0].source_native_id, now, raw.d, "a".repeat(64)]),
    { code: "P0001" });
    await assert.rejects(pool.query(`DELETE FROM activity_evidence
      WHERE tenant_id=$1 AND activity_id=$2`, [tenantA, input.id]), { code: "P0001" });
  });

  test("goldens 7-8: identical source replay is stable; changed payload/revision fails closed", async () => {
    const { c, o, e, d } = await context();
    const firstParticipant = participant();
    const first = activity(c.id, o, [e], d);
    const accepted = await repo.promoteAcceptedActivity(tenantA, first, [firstParticipant]);
    const replay = await repo.promoteAcceptedActivity(tenantA,
      { ...first, id: randomUUID(), recordedAt: "2026-09-29T00:00:00.000Z" },
      [{ ...firstParticipant, id: randomUUID(), recordedAt: "2026-09-29T00:00:00.000Z" }]);
    assert.equal(replay.status, "already_exists");
    assert.equal(replay.activity.id, accepted.activity.id);
    assert.deepEqual(replay.participants, accepted.participants);
    const changed = await repo.promoteAcceptedActivity(tenantA,
      { ...first, id: randomUUID(), direction: "OUTBOUND" }, [firstParticipant]);
    assert.equal(changed.status, "source_conflict");
    assert.equal(changed.activity.id, first.id);
    const sameNativeRevision = await source(tenantA, (await pool.query(
      `SELECT source_native_id FROM source_observations WHERE id=$1`, [o])).rows[0].source_native_id,
    "revision-2");
    const newEvidence = await evidence(tenantA, sameNativeRevision);
    const newPolicy = await policy(tenantA, sameNativeRevision);
    const revisionConflict = await repo.promoteAcceptedActivity(tenantA,
      activity(c.id, sameNativeRevision, [newEvidence], newPolicy), []);
    assert.equal(revisionConflict.status, "source_conflict");
    assert.equal(revisionConflict.activity.id, first.id);
    assert.deepEqual(await repo.listActivitiesForConversation(tenantA, c.id), [accepted.activity]);
  });

  test("goldens 10-11, 13: unresolved participant remains unresolved; linked Identity agrees", async () => {
    const { c, o, e, d } = await context();
    const unresolved = participant();
    const input = activity(c.id, o, [e], d);
    const accepted = await repo.promoteAcceptedActivity(tenantA, input, [unresolved]);
    assert.deepEqual(accepted.participants[0],
      { ...unresolved, tenantId: tenantA, activityId: input.id });
    const person = await people.createPerson(tenantA,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    const otherPerson = await people.createPerson(tenantA,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    const matchId = randomUUID();
    await pool.query(`INSERT INTO entity_match_decisions
      (id,tenant_id,run_id,correlation_id,subject_key,resolution_scope,status,
       selected_entity_id,candidate_count,fingerprint,policy_version)
      VALUES ($1,$2,$3,$4,'synthetic','PERSON','MATCHED_SAFE',$5,1,'test','test-v1')`,
    [matchId, tenantA, randomUUID(), randomUUID(), person.id]);
    const identity = await people.createIdentity(tenantA, {
      id: randomUUID(), personId: person.id, kind: "EMAIL", namespace: "synthetic:mail",
      normalizedValue: "resolved@example.invalid", temporalState: "CURRENT",
      effectiveFrom: null, effectiveTo: null, matchDecisionId: matchId,
      recordedAt: now, supersedesId: null,
    });
    const resolved = await repo.appendParticipant(tenantA, input.id,
      participant({ personId: person.id, identityId: identity.id }));
    assert.equal(resolved.personId, person.id);
    await assert.rejects(repo.appendParticipant(tenantA, input.id,
      participant({ personId: otherPerson.id, identityId: identity.id })), { code: "23503" });
    assert.equal((await repo.listParticipantsForActivity(tenantA, input.id)).length, 2);
    const replay = await repo.promoteAcceptedActivity(tenantA,
      { ...input, id: randomUUID() }, [{ ...unresolved, id: randomUUID() }]);
    assert.equal(replay.status, "already_exists");
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM persons
      WHERE tenant_id=$1`, [tenantA])).rows[0].n, 2);
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM person_identities
      WHERE tenant_id=$1`, [tenantA])).rows[0].n, 1);
  });

  test("golden 12: cross-tenant Conversation, Observation, Evidence, Person and Identity fail", async () => {
    const a = await context(tenantA);
    const b = await context(tenantB);
    assert.equal(await repo.getConversation(tenantB, a.c.id), null);
    assert.equal(await repo.getActivity(tenantB, randomUUID()), null);
    await assert.rejects(repo.promoteAcceptedActivity(tenantB,
      activity(a.c.id, b.o, [b.e], b.d), []), { code: "23503" });
    await assert.rejects(repo.promoteAcceptedActivity(tenantB,
      activity(b.c.id, a.o, [b.e], b.d), []), { code: "SOURCE_OBSERVATION_MISSING" });
    await assert.rejects(repo.promoteAcceptedActivity(tenantB,
      activity(b.c.id, b.o, [a.e], b.d), []), { code: "ATTRIBUTABLE_EVIDENCE_MISSING" });
    await assert.rejects(repo.promoteAcceptedActivity(tenantB,
      activity(b.c.id, b.o, [b.e], a.d), []), { code: "PROMOTION_POLICY_NOT_ALLOWED" });
    const pA = await people.createPerson(tenantA,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    const matchId = randomUUID();
    await pool.query(`INSERT INTO entity_match_decisions
      (id,tenant_id,run_id,correlation_id,subject_key,resolution_scope,status,
       selected_entity_id,candidate_count,fingerprint,policy_version)
      VALUES ($1,$2,$3,$4,'cross-tenant','PERSON','MATCHED_SAFE',$5,1,'test','test-v1')`,
    [matchId, tenantA, randomUUID(), randomUUID(), pA.id]);
    const identityA = await people.createIdentity(tenantA, {
      id: randomUUID(), personId: pA.id, kind: "EMAIL", namespace: "synthetic:mail",
      normalizedValue: "cross@example.invalid", temporalState: "CURRENT",
      effectiveFrom: null, effectiveTo: null, matchDecisionId: matchId,
      recordedAt: now, supersedesId: null,
    });
    const valid = activity(b.c.id, b.o, [b.e], b.d);
    await assert.rejects(repo.promoteAcceptedActivity(tenantB, valid,
      [participant({ personId: pA.id })]), { code: "23503" });
    await assert.rejects(repo.promoteAcceptedActivity(tenantB, valid,
      [participant({ identityId: identityA.id })]), { code: "23503" });
    assert.equal(await repo.getActivity(tenantB, valid.id), null);
  });

  test("goldens 14-15: OUTBOUND is only direction; job change keeps historical Account", async () => {
    const person = await people.createPerson(tenantA,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    const accountA = await createAccount(tenantA, "Synthetic old employer");
    const accountB = await createAccount(tenantA, "Synthetic new employer");
    const c = await repo.createConversation(tenantA,
      conversation({ accountId: accountA }));
    const o = await source(tenantA);
    const e = await evidence(tenantA, o);
    const d = await policy(tenantA, o);
    const accepted = await repo.promoteAcceptedActivity(tenantA,
      activity(c.id, o, [e], d, { direction: "OUTBOUND" }), []);
    assert.equal(accepted.activity.direction, "OUTBOUND");
    assert.equal("reciprocal" in accepted.activity, false);
    await people.createEmployment(tenantA, {
      id: randomUUID(), personId: person.id, accountId: accountA,
      title: null, state: "FORMER", startedOn: null, endedOn: null,
      recordedAt: now, supersedesId: null,
    });
    await people.createEmployment(tenantA, {
      id: randomUUID(), personId: person.id, accountId: accountB,
      title: null, state: "CURRENT", startedOn: null, endedOn: null,
      recordedAt: "2026-09-29T00:00:00.000Z", supersedesId: null,
    });
    assert.equal((await repo.getConversation(tenantA, c.id)).accountId, accountA);
    assert.equal((await repo.getActivity(tenantA, accepted.activity.id)).conversationId, c.id);
    await assert.rejects(pool.query(`UPDATE conversations SET account_id=$1 WHERE id=$2`,
      [accountB, c.id]), { code: "P0001" });
  });
}
