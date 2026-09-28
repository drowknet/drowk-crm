import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  applyMigrations, PostgresHumanContinuityRepository, PostgresInteractionRepository,
  PostgresRelationshipRepository, PostgresRepositories,
} from "../dist/index.js";
import { disposableDatabase } from "./disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("DCRM-04F Relationship memory goldens", async t => {
  const { pool } = await disposableDatabase(t);
  await applyMigrations(pool);
  const relations = new PostgresRelationshipRepository(pool);
  const people = new PostgresHumanContinuityRepository(pool);
  const interactions = new PostgresInteractionRepository(pool);
  const sources = new PostgresRepositories(pool);
  const tenantA = randomUUID(), tenantB = randomUUID();
  const now = "2026-09-28T12:34:56.000Z";
  await pool.query(`INSERT INTO tenants (id,slug,name) VALUES
    ($1,$2,'Synthetic A'),($3,$4,'Synthetic B')`,
  [tenantA, `test-${tenantA}`, tenantB, `test-${tenantB}`]);

  async function account(tenantId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO accounts (id,tenant_id,name) VALUES ($1,$2,'Synthetic account')`,
      [id, tenantId]);
    return id;
  }
  async function facility(tenantId, accountId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO facilities (id,tenant_id,account_id,name)
      VALUES ($1,$2,$3,'Synthetic facility')`, [id, tenantId, accountId]);
    return id;
  }
  async function safePerson(tenantId) {
    const person = await people.createPerson(tenantId,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    const matchId = randomUUID();
    await pool.query(`INSERT INTO entity_match_decisions
      (id,tenant_id,run_id,correlation_id,subject_key,resolution_scope,status,
       selected_entity_id,candidate_count,fingerprint,policy_version)
      VALUES ($1,$2,$3,$4,'synthetic','PERSON','MATCHED_SAFE',$5,1,'test','test-v1')`,
    [matchId, tenantId, randomUUID(), randomUUID(), person.id]);
    const identity = await people.createIdentity(tenantId, {
      id: randomUUID(), personId: person.id, kind: "EMAIL", namespace: "synthetic:mail",
      normalizedValue: `${randomUUID()}@example.invalid`, temporalState: "CURRENT",
      effectiveFrom: null, effectiveTo: null, matchDecisionId: matchId,
      recordedAt: now, supersedesId: null,
    });
    return { person, identity };
  }
  const participant = (resolved, extra = {}) => ({
    id: randomUUID(), role: "FROM", personId: resolved.person.id,
    identityId: resolved.identity.id, sourceParticipantNamespace: "synthetic:mailbox",
    sourceParticipantRef: "sender@example.invalid", recordedAt: now,
    supersedesId: null, ...extra,
  });
  async function policy(tenantId, activityId, action, disposition = "ALLOW",
    evidenceComplete = true) {
    const id = randomUUID();
    await pool.query(`INSERT INTO policy_decisions
      (id,tenant_id,run_id,correlation_id,subject_id,action,disposition,
       evidence_complete,policy_version,recorded_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'synthetic-v1',$9)`,
    [id, tenantId, randomUUID(), randomUUID(), activityId, action,
      disposition, evidenceComplete, now]);
    return id;
  }
  async function acceptedActivity(tenantId, resolved, extra = {}) {
    const conversation = await interactions.createConversation(tenantId, {
      id: randomUUID(), channel: "EMAIL", accountId: extra.accountId ?? null,
      facilityId: extra.facilityId ?? null, sourceNamespace: "SYNTHETIC:mailbox",
      sourceConversationRef: randomUUID(), recordedAt: now, supersedesId: null,
    });
    const observationId = randomUUID();
    const observation = await sources.appendObservation(tenantId, {
      id: observationId, runId: randomUUID(), correlationId: randomUUID(),
      sourceSystem: "SYNTHETIC", sourceNativeId: randomUUID(), sourceRevision: null,
      observedAt: null, effectiveAt: null, retrievedAt: now, ingestedAt: now,
      recordedAt: now, sourceWatermark: null, adapterVersion: "test-v1",
      fingerprint: `sha256:${randomUUID()}`, rawArtifactRef: null,
      sourceMetadata: { sourceNamespace: "SYNTHETIC:mailbox" },
    });
    assert.equal(observation.status, "inserted");
    const evidenceId = randomUUID();
    await pool.query(`INSERT INTO evidence
      (id,tenant_id,run_id,correlation_id,observation_id,subject_entity_type,
       claim,value_json,trust_state,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'INTERACTION','synthetic.claim','{}'::jsonb,'CLAIMED',$6)`,
    [evidenceId, tenantId, randomUUID(), randomUUID(), observationId, now]);
    const decisionId = await policy(tenantId, observationId, "ACCEPT_INTERACTION");
    const input = {
      id: randomUUID(), conversationId: conversation.id, kind: "MESSAGE",
      direction: extra.direction ?? "INBOUND", sourceObservationId: observationId,
      evidenceIds: [evidenceId], occurredAt: extra.occurredAt ?? null,
      recordedAt: now, promotionPolicyDecisionId: decisionId, supersedesId: null,
    };
    const originalParticipant = participant(resolved);
    const accepted = await interactions.promoteAcceptedActivity(tenantId,
      input, [originalParticipant]);
    assert.equal(accepted.status, "inserted");
    return { activity: accepted.activity, conversation, participant: accepted.participants[0] };
  }
  const relationship = personId => ({ id: randomUUID(), personId, recordedAt: now });
  const assertion = (relationshipId, activity, kind = "ACTIVITY",
    promotionPolicyDecisionId = null, extra = {}) => ({
    id: randomUUID(), relationshipId, activityId: activity.id, kind,
    occurredAt: activity.occurredAt, recordedAt: now,
    promotionPolicyDecisionId, ...extra,
  });

  await t.test("goldens 1-4: tenant-Person root claim is unique and creates no human records", async () => {
    const a = await safePerson(tenantA);
    const b = await safePerson(tenantB);
    const before = (await pool.query(`SELECT
      (SELECT count(*)::int FROM persons WHERE tenant_id=$1) AS persons,
      (SELECT count(*)::int FROM person_identities WHERE tenant_id=$1) AS identities,
      (SELECT count(*)::int FROM employments WHERE tenant_id=$1) AS employments`,
    [tenantA])).rows[0];
    const first = await relations.claimRelationship(tenantA, relationship(a.person.id));
    assert.equal(first.status, "inserted");
    const replay = await relations.claimRelationship(tenantA, relationship(a.person.id));
    assert.equal(replay.status, "already_exists");
    assert.deepEqual(replay.relationship, first.relationship);
    assert.deepEqual(await relations.getRelationshipByPerson(tenantA, a.person.id), first.relationship);
    assert.deepEqual(await relations.getRelationship(tenantA, first.relationship.id), first.relationship);
    assert.equal("accountId" in first.relationship, false);
    assert.equal("facilityId" in first.relationship, false);
    await assert.rejects(relations.claimRelationship(tenantA,
      relationship(randomUUID())), { code: "23503" });
    await assert.rejects(relations.claimRelationship(tenantB,
      relationship(a.person.id)), { code: "23503" });
    assert.equal((await relations.claimRelationship(tenantB,
      relationship(b.person.id))).status, "inserted");
    await assert.rejects(pool.query(`INSERT INTO relationships
      (id,tenant_id,person_id,recorded_at) VALUES ($1,$2,$3,$4)`,
    [randomUUID(), tenantA, a.person.id, now]), { code: "23505" });
    await assert.rejects(pool.query(`UPDATE relationships SET person_id=$1 WHERE id=$2`,
      [b.person.id, first.relationship.id]), { code: "P0001" });
    assert.deepEqual((await pool.query(`SELECT
      (SELECT count(*)::int FROM persons WHERE tenant_id=$1) AS persons,
      (SELECT count(*)::int FROM person_identities WHERE tenant_id=$1) AS identities,
      (SELECT count(*)::int FROM employments WHERE tenant_id=$1) AS employments`,
    [tenantA])).rows[0], before);
  });

  await t.test("goldens 5-10, 19-20: current participant, correction and replay history", async () => {
    const a = await safePerson(tenantA), b = await safePerson(tenantA);
    const relationA = (await relations.claimRelationship(tenantA,
      relationship(a.person.id))).relationship;
    const relationB = (await relations.claimRelationship(tenantA,
      relationship(b.person.id))).relationship;
    const source = await acceptedActivity(tenantA, a, { direction: "OUTBOUND" });
    const firstInput = assertion(relationA.id, source.activity);
    const first = await relations.promoteInteraction(tenantA, firstInput);
    assert.equal(first.status, "inserted");
    assert.equal(first.interaction.authorityParticipantId, source.participant.id);
    assert.equal(first.interaction.authorityIdentityId, a.identity.id);
    assert.equal(await relations.latestKnownInteraction(tenantA, relationA.id, "RECIPROCAL"), null);
    assert.equal((await relations.promoteInteraction(tenantA,
      { ...firstInput, id: randomUUID(), recordedAt: "2026-09-29T00:00:00.000Z" })).status,
    "already_exists");
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relationB.id, source.activity)),
    { code: "RELATIONSHIP_PARTICIPANT_NOT_CURRENT" });
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relationA.id, { ...source.activity, id: randomUUID() })),
    { code: "ACTIVITY_MISSING" });
    const reciprocalPolicy = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL");
    const corrected = await interactions.appendParticipant(tenantA, source.activity.id, {
      ...source.participant, id: randomUUID(), personId: b.person.id,
      identityId: b.identity.id, supersedesId: source.participant.id,
    });
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relationA.id, source.activity, "RECIPROCAL", reciprocalPolicy)),
    { code: "RELATIONSHIP_PARTICIPANT_NOT_CURRENT" });
    const newB = await relations.promoteInteraction(tenantA,
      assertion(relationB.id, source.activity));
    assert.equal(newB.status, "inserted");
    assert.equal(newB.interaction.authorityParticipantId, corrected.id);
    assert.deepEqual(await relations.getInteraction(tenantA, first.interaction.id), first.interaction);
    assert.equal((await relations.listInteractionHistory(tenantA, relationA.id)).length, 1);
    assert.equal((await relations.promoteInteraction(tenantA,
      { ...firstInput, id: randomUUID() })).status, "already_exists");
    const meaningfulPolicy = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL");
    const meaningfulB = await relations.promoteInteraction(tenantA,
      assertion(relationB.id, source.activity, "MEANINGFUL", meaningfulPolicy));
    assert.equal(meaningfulB.status, "inserted");
    const conflictingPolicy = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL");
    const conflict = await relations.promoteInteraction(tenantA,
      assertion(relationB.id, source.activity, "MEANINGFUL", conflictingPolicy));
    assert.equal(conflict.status, "source_conflict");
    assert.equal(conflict.interaction.id, meaningfulB.interaction.id);
    await assert.rejects(pool.query(`INSERT INTO relationship_interactions
      (id,tenant_id,relationship_id,person_id,activity_id,kind,
       authority_participant_id,authority_identity_id,occurred_at,recorded_at,
       promotion_policy_decision_id)
      VALUES ($1,$2,$3,$4,$5,'RECIPROCAL',$6,$7,$8,$9,$10)`,
    [randomUUID(), tenantA, relationA.id, a.person.id, source.activity.id,
      source.participant.id, a.identity.id, source.activity.occurredAt, now,
      reciprocalPolicy]), { code: "P0001" });
    const retracted = await interactions.appendParticipant(tenantA, source.activity.id, {
      ...corrected, id: randomUUID(), personId: null, identityId: null,
      supersedesId: corrected.id,
    });
    assert.equal(retracted.personId, null);
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relationB.id, source.activity, "RECIPROCAL", reciprocalPolicy)),
    { code: "RELATIONSHIP_PARTICIPANT_NOT_CURRENT" });
    assert.deepEqual(await relations.getInteraction(tenantA, meaningfulB.interaction.id),
      meaningfulB.interaction);
  });

  await t.test("goldens 11-14: exact kind and Activity policy authority holds in repository and SQL", async () => {
    const a = await safePerson(tenantA);
    const relation = (await relations.claimRelationship(tenantA,
      relationship(a.person.id))).relationship;
    const source = await acceptedActivity(tenantA, a);
    const other = await acceptedActivity(tenantA, a);
    assert.equal((await relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity))).status, "inserted");
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity, "RECIPROCAL")),
    { code: "RELATIONSHIP_ASSERTION_POLICY_REQUIRED" });
    const wrongKind = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL");
    const wrongSubject = await policy(tenantA, other.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL");
    const review = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL", "REVIEW");
    const deny = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL", "DENY");
    const incomplete = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL", "ALLOW", false);
    for (const blocked of [wrongKind, wrongSubject, review, deny, incomplete]) {
      await assert.rejects(relations.promoteInteraction(tenantA,
        assertion(relation.id, source.activity, "RECIPROCAL", blocked)),
      { code: "RELATIONSHIP_POLICY_NOT_ALLOWED" });
    }
    const allowed = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL");
    assert.equal((await relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity, "RECIPROCAL", allowed))).status, "inserted");
    const meaningful = await policy(tenantA, source.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL");
    assert.equal((await relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity, "MEANINGFUL", meaningful))).status, "inserted");
    await assert.rejects(pool.query(`INSERT INTO relationship_interactions
      (id,tenant_id,relationship_id,person_id,activity_id,kind,
       authority_participant_id,authority_identity_id,occurred_at,recorded_at,
       promotion_policy_decision_id)
      VALUES ($1,$2,$3,$4,$5,'MEANINGFUL',$6,$7,$8,$9,$10)`,
    [randomUUID(), tenantA, relation.id, a.person.id, other.activity.id,
      other.participant.id, a.identity.id, other.activity.occurredAt, now,
      allowed]), { code: "23503" });
    await assert.rejects(pool.query(`INSERT INTO relationship_interactions
      (id,tenant_id,relationship_id,person_id,activity_id,kind,
       authority_participant_id,authority_identity_id,occurred_at,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'RECIPROCAL',$6,$7,$8,$9)`,
    [randomUUID(), tenantA, relation.id, a.person.id, other.activity.id,
      other.participant.id, a.identity.id, other.activity.occurredAt, now]),
    { code: "23514" });
    for (const [disposition, complete] of [
      ["REVIEW", true], ["DENY", true], ["ALLOW", false],
    ]) {
      const blockedPolicy = await policy(tenantA, other.activity.id,
        "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL", disposition, complete);
      await assert.rejects(pool.query(`INSERT INTO relationship_interactions
        (id,tenant_id,relationship_id,person_id,activity_id,kind,
         authority_participant_id,authority_identity_id,occurred_at,recorded_at,
         promotion_policy_decision_id)
        VALUES ($1,$2,$3,$4,$5,'RECIPROCAL',$6,$7,$8,$9,$10)`,
      [randomUUID(), tenantA, relation.id, a.person.id, other.activity.id,
        other.participant.id, a.identity.id, other.activity.occurredAt, now,
        blockedPolicy]), { code: "23503" });
    }
    await assert.rejects(pool.query(`INSERT INTO relationship_interactions
      (id,tenant_id,relationship_id,person_id,activity_id,kind,
       authority_participant_id,authority_identity_id,occurred_at,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'ACTIVITY',$6,$7,$8,$9)`,
    [randomUUID(), tenantA, relation.id, a.person.id, other.activity.id,
      other.participant.id, a.identity.id, now, now]), { code: "P0001" });
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity, "ACTIVITY", null,
        { occurredAt: "2026-09-29T00:00:00.000Z" })),
    { code: "ACTIVITY_EVENT_TIME_MISMATCH" });
  });

  await t.test("goldens 15-18: null time stays in history; three latest clocks are independent", async () => {
    const a = await safePerson(tenantA);
    const relation = (await relations.claimRelationship(tenantA,
      relationship(a.person.id))).relationship;
    const unknown = await acceptedActivity(tenantA, a);
    const older = await acceptedActivity(tenantA, a,
      { occurredAt: "2026-09-26T10:00:00.000Z" });
    const newer = await acceptedActivity(tenantA, a,
      { occurredAt: "2026-09-27T10:00:00.000Z" });
    const tie = await acceptedActivity(tenantA, a,
      { occurredAt: "2026-09-27T10:00:00.000Z", direction: "OUTBOUND" });
    const unknownAssert = await relations.promoteInteraction(tenantA,
      assertion(relation.id, unknown.activity));
    assert.equal(unknownAssert.interaction.occurredAt, null);
    assert.equal(await relations.latestKnownInteraction(tenantA, relation.id, "ACTIVITY"), null);
    for (const item of [older, newer, tie]) {
      assert.equal((await relations.promoteInteraction(tenantA,
        assertion(relation.id, item.activity))).status, "inserted");
    }
    const reciprocalPolicy = await policy(tenantA, older.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL");
    const meaningfulPolicy = await policy(tenantA, newer.activity.id,
      "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL");
    const reciprocal = await relations.promoteInteraction(tenantA,
      assertion(relation.id, older.activity, "RECIPROCAL", reciprocalPolicy));
    const meaningful = await relations.promoteInteraction(tenantA,
      assertion(relation.id, newer.activity, "MEANINGFUL", meaningfulPolicy));
    const latestActivity = await relations.latestKnownInteraction(tenantA, relation.id, "ACTIVITY");
    const candidates = (await relations.listInteractionHistory(tenantA, relation.id))
      .filter(item => item.kind === "ACTIVITY"
        && item.occurredAt === newer.activity.occurredAt);
    assert.equal(latestActivity.id, candidates.map(item => item.id).sort().at(-1));
    assert.equal((await relations.latestKnownInteraction(tenantA, relation.id,
      "RECIPROCAL")).id, reciprocal.interaction.id);
    assert.equal((await relations.latestKnownInteraction(tenantA, relation.id,
      "MEANINGFUL")).id, meaningful.interaction.id);
    assert.equal((await relations.listInteractionHistory(tenantA, relation.id)).length, 6);
    assert.deepEqual(await relations.getInteraction(tenantA, unknownAssert.interaction.id),
      unknownAssert.interaction);
    await assert.rejects(pool.query(`UPDATE relationship_interactions SET occurred_at=$1
      WHERE id=$2`, [now, unknownAssert.interaction.id]), { code: "P0001" });
  });

  await t.test("goldens 18, 21-24: tenant and historical employer context stay separate", async () => {
    const a = await safePerson(tenantA);
    const oldAccount = await account(tenantA), newAccount = await account(tenantA);
    const oldFacility = await facility(tenantA, oldAccount);
    const relation = (await relations.claimRelationship(tenantA,
      relationship(a.person.id))).relationship;
    const source = await acceptedActivity(tenantA, a,
      { accountId: oldAccount, facilityId: oldFacility });
    const stored = await relations.promoteInteraction(tenantA,
      assertion(relation.id, source.activity));
    await people.createEmployment(tenantA, {
      id: randomUUID(), personId: a.person.id, accountId: newAccount,
      title: null, state: "CURRENT", startedOn: null, endedOn: null,
      recordedAt: "2026-09-29T00:00:00.000Z", supersedesId: null,
    });
    assert.deepEqual(await relations.getRelationship(tenantA, relation.id), relation);
    const context = (await pool.query(`SELECT c.account_id,c.facility_id FROM relationship_interactions ri
      JOIN activities a ON a.tenant_id=ri.tenant_id AND a.id=ri.activity_id
      JOIN conversations c ON c.tenant_id=a.tenant_id AND c.id=a.conversation_id
      WHERE ri.tenant_id=$1 AND ri.id=$2`, [tenantA, stored.interaction.id])).rows[0];
    assert.deepEqual(context, { account_id: oldAccount, facility_id: oldFacility });
    assert.equal("accountId" in relation, false);
    assert.equal("score" in relation, false);
    assert.equal("permission" in relation, false);
    assert.equal(await relations.getRelationship(tenantB, relation.id), null);
    assert.deepEqual(await relations.listInteractionHistory(tenantB, relation.id), []);
    const foreign = await acceptedActivity(tenantB, await safePerson(tenantB));
    await assert.rejects(relations.promoteInteraction(tenantA,
      assertion(relation.id, foreign.activity)), { code: "ACTIVITY_MISSING" });
    await assert.rejects(pool.query(`INSERT INTO relationship_interactions
      (id,tenant_id,relationship_id,person_id,activity_id,kind,
       authority_participant_id,authority_identity_id,occurred_at,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'ACTIVITY',$6,$7,$8,$9)`,
    [randomUUID(), tenantB, relation.id, foreign.participant.personId,
      foreign.activity.id, foreign.participant.id, foreign.participant.identityId,
      foreign.activity.occurredAt, now]), { code: "23503" });
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM commitments
      WHERE tenant_id=$1 AND source_activity_id=$2`,
    [tenantA, source.activity.id])).rows[0].n, 0);
  });
});
