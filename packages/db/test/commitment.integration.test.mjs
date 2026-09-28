import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  applyMigrations, PostgresCommitmentRepository, PostgresHumanContinuityRepository,
  PostgresInteractionRepository, PostgresRepositories,
} from "../dist/index.js";
import { disposableDatabase } from "./disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("DCRM-04D commitment promotion, history and authority goldens", async t => {
  const { pool } = await disposableDatabase(t);
  await applyMigrations(pool);
  const repo = new PostgresCommitmentRepository(pool);
  const interactions = new PostgresInteractionRepository(pool);
  const people = new PostgresHumanContinuityRepository(pool);
  const sources = new PostgresRepositories(pool);
  const tenantA = randomUUID(), tenantB = randomUUID();
  const now = "2026-09-28T12:34:56.000Z";
  await pool.query(`INSERT INTO tenants (id,slug,name) VALUES
    ($1,$2,'Synthetic A'),($3,$4,'Synthetic B')`,
  [tenantA, `test-${tenantA}`, tenantB, `test-${tenantB}`]);

  async function account(tenantId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO accounts (id,tenant_id,name) VALUES ($1,$2,'Synthetic')`,
      [id, tenantId]);
    return id;
  }
  async function facility(tenantId, accountId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO facilities (id,tenant_id,account_id,name)
      VALUES ($1,$2,$3,'Synthetic site')`, [id, tenantId, accountId]);
    return id;
  }
  async function evidence(tenantId, observationId) {
    const id = randomUUID();
    await pool.query(`INSERT INTO evidence
      (id,tenant_id,run_id,correlation_id,observation_id,subject_entity_type,
       claim,value_json,trust_state,recorded_at)
      VALUES ($1,$2,$3,$4,$5,'INTERACTION','synthetic.claim','{}'::jsonb,'CLAIMED',$6)`,
    [id, tenantId, randomUUID(), randomUUID(), observationId, now]);
    return id;
  }
  async function policy(tenantId, subjectId, action, disposition = "ALLOW",
    evidenceComplete = true) {
    const id = randomUUID();
    await pool.query(`INSERT INTO policy_decisions
      (id,tenant_id,run_id,correlation_id,subject_id,action,disposition,
       evidence_complete,policy_version,recorded_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'synthetic-v1',$9)`,
    [id, tenantId, randomUUID(), randomUUID(), subjectId, action,
      disposition, evidenceComplete, now]);
    return id;
  }
  async function acceptedActivity(tenantId = tenantA, participants = []) {
    const c = await interactions.createConversation(tenantId, {
      id: randomUUID(), channel: "EMAIL", accountId: null, facilityId: null,
      sourceNamespace: "SYNTHETIC:mailbox", sourceConversationRef: randomUUID(),
      recordedAt: now, supersedesId: null,
    });
    const observationId = randomUUID();
    const source = await sources.appendObservation(tenantId, {
      id: observationId, runId: randomUUID(), correlationId: randomUUID(),
      sourceSystem: "SYNTHETIC", sourceNativeId: randomUUID(), sourceRevision: null,
      observedAt: null, effectiveAt: null, retrievedAt: now, ingestedAt: now,
      recordedAt: now, sourceWatermark: null, adapterVersion: "test-v1",
      fingerprint: `sha256:${randomUUID()}`, rawArtifactRef: null,
      sourceMetadata: { sourceNamespace: "SYNTHETIC:mailbox" },
    });
    assert.equal(source.status, "inserted");
    const evidenceId = await evidence(tenantId, observationId);
    const decisionId = await policy(tenantId, observationId, "ACCEPT_INTERACTION");
    const activity = await interactions.promoteAcceptedActivity(tenantId, {
      id: randomUUID(), conversationId: c.id, kind: "MESSAGE", direction: "INBOUND",
      sourceObservationId: observationId, evidenceIds: [evidenceId],
      occurredAt: null, recordedAt: now, promotionPolicyDecisionId: decisionId,
      supersedesId: null,
    }, participants);
    assert.equal(activity.status, "inserted");
    return { activity: activity.activity, observationId, evidenceId };
  }
  const commitment = (activityId, evidenceIds, decisionId, extra = {}) => ({
    id: randomUUID(), commitmentKey: `synthetic:${randomUUID()}`,
    kind: "REQUEST", state: "SUGGESTED", statement: "Send the specification",
    sourceActivityId: activityId, evidenceIds, accountId: null, facilityId: null,
    counterpartyPersonId: null, owedBy: "TENANT", dueDate: null,
    conditionText: null, recordedAt: now, promotionPolicyDecisionId: decisionId,
    supersedesId: null, ...extra,
  });

  await t.test("goldens 1-3, 7-11, 16-18: accepted memory, replay, conflict and supersession", async () => {
    const source = await acceptedActivity();
    const decision = await policy(tenantA, source.activity.id, "ACCEPT_COMMITMENT");
    const first = commitment(source.activity.id, [source.evidenceId], decision);
    const accepted = await repo.promoteCommitment(tenantA, first);
    assert.equal(accepted.status, "inserted");
    assert.deepEqual(accepted.commitment, { ...first, tenantId: tenantA });
    assert.equal(accepted.commitment.dueDate, null);
    assert.equal(accepted.commitment.conditionText, null);
    assert.equal(accepted.commitment.counterpartyPersonId, null);
    assert.deepEqual(await repo.getCommitment(tenantA, first.id), accepted.commitment);
    assert.deepEqual(await repo.listEvidenceIdsForCommitment(tenantA, first.id), [source.evidenceId]);
    const replay = await repo.promoteCommitment(tenantA, {
      ...first, id: randomUUID(), recordedAt: "2026-09-29T00:00:00.000Z",
    });
    assert.equal(replay.status, "already_exists");
    assert.equal(replay.commitment.id, first.id);
    const conflict = await repo.promoteCommitment(tenantA, { ...first, id: randomUUID(), state: "CONFIRMED" });
    assert.equal(conflict.status, "source_conflict");
    assert.equal(conflict.commitment.state, "SUGGESTED");
    const second = commitment(source.activity.id, [source.evidenceId], decision, {
      kind: "PROMISE", state: "CONFIRMED", owedBy: "COUNTERPARTY",
      dueDate: "2026-10-31", conditionText: "After review", supersedesId: first.id,
      recordedAt: "2026-09-29T00:00:00.000Z",
    });
    const promoted = await repo.promoteCommitment(tenantA, second);
    assert.equal(promoted.status, "inserted");
    assert.equal(promoted.commitment.dueDate, "2026-10-31");
    assert.equal(promoted.commitment.state, "CONFIRMED");
    const successorReplay = await repo.promoteCommitment(tenantA, {
      ...second, id: randomUUID(), recordedAt: "2026-10-01T00:00:00.000Z",
    });
    assert.equal(successorReplay.status, "already_exists");
    assert.equal(successorReplay.commitment.id, second.id);
    const sibling = commitment(source.activity.id, [source.evidenceId], decision,
      { supersedesId: first.id, state: "DECLINED" });
    await assert.rejects(repo.promoteCommitment(tenantA, sibling),
      { code: "COMMITMENT_ID_CONFLICT" });
    assert.equal(await repo.getCommitment(tenantA, sibling.id), null);
    await assert.rejects(pool.query(`INSERT INTO commitments
      (id,tenant_id,commitment_key,kind,state,statement,source_activity_id,
       source_observation_id,account_id,facility_id,counterparty_person_id,
       counterparty_participant_id,counterparty_identity_id,owed_by,due_date,
       condition_text,recorded_at,promotion_policy_decision_id,evidence_count,
       accepted_payload_digest,supersedes_id)
      SELECT $1,tenant_id,$2,kind,state,statement,source_activity_id,
       source_observation_id,account_id,facility_id,counterparty_person_id,
       counterparty_participant_id,counterparty_identity_id,owed_by,due_date,
       condition_text,recorded_at,promotion_policy_decision_id,evidence_count,
       accepted_payload_digest,supersedes_id
      FROM commitments WHERE tenant_id=$3 AND id=$4`,
    [randomUUID(), `synthetic:${randomUUID()}`, tenantA, second.id]), { code: "23505" });
    const otherTenantSource = await acceptedActivity(tenantB);
    const otherTenantDecision = await policy(tenantB, otherTenantSource.activity.id,
      "ACCEPT_COMMITMENT");
    const crossTenantSuccessor = commitment(otherTenantSource.activity.id,
      [otherTenantSource.evidenceId], otherTenantDecision, { supersedesId: first.id });
    await assert.rejects(repo.promoteCommitment(tenantB, crossTenantSuccessor), { code: "23503" });
    assert.equal(await repo.getCommitment(tenantB, crossTenantSuccessor.id), null);
    assert.deepEqual(await repo.listForActivity(tenantA, source.activity.id),
      [accepted.commitment, promoted.commitment]);
    assert.deepEqual(await repo.getCommitment(tenantA, first.id), accepted.commitment);
    const third = commitment(source.activity.id, [source.evidenceId], decision,
      { kind: "AGREED_NEXT_STEP", owedBy: "MUTUAL" });
    assert.equal((await repo.promoteCommitment(tenantA, third)).commitment.kind, "AGREED_NEXT_STEP");
    await assert.rejects(pool.query(`INSERT INTO commitments
      (id,tenant_id,commitment_key,kind,state,statement,source_activity_id,
       source_observation_id,owed_by,recorded_at,promotion_policy_decision_id,
       evidence_count,accepted_payload_digest)
      VALUES ($1,$2,$3,'REQUEST','SUGGESTED','Synthetic claim',$4,$5,'TENANT',$6,$7,1,$8)`,
    [randomUUID(), tenantA, `synthetic:${randomUUID()}`, source.activity.id,
      source.observationId, now, decision, "a".repeat(64)]), { code: "P0001" });
    const extraEvidence = await evidence(tenantA, source.observationId);
    await pool.query(`INSERT INTO activity_evidence
      (tenant_id,activity_id,evidence_id,source_observation_id,recorded_at)
      VALUES ($1,$2,$3,$4,$5)`,
    [tenantA, source.activity.id, extraEvidence, source.observationId, now]);
    await assert.rejects(pool.query(`INSERT INTO commitment_evidence
      (tenant_id,commitment_id,source_activity_id,source_observation_id,evidence_id,recorded_at)
      VALUES ($1,$2,$3,$4,$5,$6)`,
    [tenantA, first.id, source.activity.id, source.observationId, extraEvidence, now]),
    { code: "P0001" });
    await assert.rejects(pool.query(`DELETE FROM commitment_evidence
      WHERE tenant_id=$1 AND commitment_id=$2`, [tenantA, first.id]), { code: "P0001" });
    await assert.rejects(pool.query(`UPDATE commitments SET state='FULFILLED' WHERE id=$1`,
      [second.id]), { code: "P0001" });
    await assert.rejects(pool.query(`DELETE FROM commitments WHERE id=$1`, [first.id]), { code: "P0001" });
  });

  await t.test("goldens 4-7: Activity, attributable Evidence and exact policy gate", async () => {
    const source = await acceptedActivity();
    const allow = await policy(tenantA, source.activity.id, "ACCEPT_COMMITMENT");
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(randomUUID(), [source.evidenceId], allow)), { code: "SOURCE_ACTIVITY_MISSING" });
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [], allow)), { code: "EVIDENCE_REQUIRED_OR_DUPLICATED" });
    const other = await acceptedActivity();
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [other.evidenceId], allow)),
    { code: "ATTRIBUTABLE_EVIDENCE_MISSING" });
    const unlinked = await evidence(tenantA, source.observationId);
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [unlinked], allow)),
    { code: "ATTRIBUTABLE_EVIDENCE_MISSING" });
    for (const [action, disposition, complete, subject] of [
      ["ACCEPT_COMMITMENT", "REVIEW", true, source.activity.id],
      ["ACCEPT_COMMITMENT", "DENY", true, source.activity.id],
      ["ACCEPT_COMMITMENT", "ALLOW", false, source.activity.id],
      ["ACCEPT_INTERACTION", "ALLOW", true, source.activity.id],
      ["ACCEPT_COMMITMENT", "ALLOW", true, other.activity.id],
    ]) {
      const decision = await policy(tenantA, subject, action, disposition, complete);
      await assert.rejects(repo.promoteCommitment(tenantA,
        commitment(source.activity.id, [source.evidenceId], decision)),
      { code: "PROMOTION_POLICY_NOT_ALLOWED" });
    }
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [source.evidenceId], allow,
        { dueDate: "2026-10-31T00:00:00Z" })), { code: "DUE_DATE_INVALID" });
    assert.equal((await repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [source.evidenceId], allow))).status, "inserted");
  });

  await t.test("goldens 12-15, 19: Person authority, tenant context and job-change history", async () => {
    const source = await acceptedActivity();
    const decision = await policy(tenantA, source.activity.id, "ACCEPT_COMMITMENT");
    const person = await people.createPerson(tenantA,
      { id: randomUUID(), displayName: null, recordedAt: now, supersedesId: null });
    await assert.rejects(pool.query(`INSERT INTO commitments
      (id,tenant_id,commitment_key,kind,state,statement,source_activity_id,
       source_observation_id,counterparty_person_id,owed_by,recorded_at,
       promotion_policy_decision_id,evidence_count,accepted_payload_digest)
      VALUES ($1,$2,$3,'REQUEST','SUGGESTED','Synthetic claim',$4,$5,$6,'TENANT',$7,$8,1,$9)`,
    [randomUUID(), tenantA, `synthetic:${randomUUID()}`, source.activity.id,
      source.observationId, person.id, now, decision, "a".repeat(64)]), { code: "23514" });
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [source.evidenceId], decision,
        { counterpartyPersonId: person.id })), { code: "COUNTERPARTY_NOT_RESOLVED" });
    const matchId = randomUUID();
    await pool.query(`INSERT INTO entity_match_decisions
      (id,tenant_id,run_id,correlation_id,subject_key,resolution_scope,status,
       selected_entity_id,candidate_count,fingerprint,policy_version)
      VALUES ($1,$2,$3,$4,'synthetic','PERSON','MATCHED_SAFE',$5,1,'test','test-v1')`,
    [matchId, tenantA, randomUUID(), randomUUID(), person.id]);
    const identity = await people.createIdentity(tenantA, {
      id: randomUUID(), personId: person.id, kind: "EMAIL", namespace: "synthetic:mail",
      normalizedValue: "counterparty@example.invalid", temporalState: "CURRENT",
      effectiveFrom: null, effectiveTo: null, matchDecisionId: matchId,
      recordedAt: now, supersedesId: null,
    });
    await interactions.appendParticipant(tenantA, source.activity.id, {
      id: randomUUID(), role: "FROM", personId: person.id, identityId: identity.id,
      sourceParticipantNamespace: "synthetic:mail",
      sourceParticipantRef: "counterparty@example.invalid", recordedAt: now,
    });
    const oldAccount = await account(tenantA), newAccount = await account(tenantA);
    const oldFacility = await facility(tenantA, oldAccount);
    const newFacility = await facility(tenantA, newAccount);
    const linked = commitment(source.activity.id, [source.evidenceId], decision, {
      accountId: oldAccount, facilityId: oldFacility, counterpartyPersonId: person.id,
    });
    const accepted = await repo.promoteCommitment(tenantA, linked);
    assert.equal(accepted.status, "inserted");
    assert.deepEqual(await repo.listForPerson(tenantA, person.id), [accepted.commitment]);
    assert.deepEqual(await repo.listForAccount(tenantA, oldAccount), [accepted.commitment]);
    await people.createEmployment(tenantA, {
      id: randomUUID(), personId: person.id, accountId: newAccount,
      title: null, state: "CURRENT", startedOn: null, endedOn: null,
      recordedAt: now, supersedesId: null,
    });
    assert.equal((await repo.getCommitment(tenantA, linked.id)).accountId, oldAccount);
    assert.equal((await repo.getCommitment(tenantA, linked.id)).facilityId, oldFacility);
    await assert.rejects(repo.promoteCommitment(tenantA,
      commitment(source.activity.id, [source.evidenceId], decision,
        { accountId: newAccount, facilityId: oldFacility })), { code: "23503" });
    const other = await acceptedActivity(tenantB);
    const otherDecision = await policy(tenantB, other.activity.id, "ACCEPT_COMMITMENT");
    await assert.rejects(repo.promoteCommitment(tenantB,
      commitment(source.activity.id, [other.evidenceId], otherDecision)),
    { code: "SOURCE_ACTIVITY_MISSING" });
    await assert.rejects(repo.promoteCommitment(tenantB,
      commitment(other.activity.id, [source.evidenceId], otherDecision)),
    { code: "ATTRIBUTABLE_EVIDENCE_MISSING" });
    for (const extra of [
      { accountId: oldAccount }, { facilityId: oldFacility },
      { accountId: newAccount, facilityId: oldFacility },
      { facilityId: newFacility, accountId: oldAccount },
    ]) await assert.rejects(repo.promoteCommitment(tenantB,
      commitment(other.activity.id, [other.evidenceId], otherDecision, extra)),
    { code: "23503" });
    await assert.rejects(repo.promoteCommitment(tenantB,
      commitment(other.activity.id, [other.evidenceId], otherDecision,
        { counterpartyPersonId: person.id })), { code: "COUNTERPARTY_NOT_RESOLVED" });
    assert.equal(await repo.getCommitment(tenantB, linked.id), null);
    assert.deepEqual(await repo.listForAccount(tenantB, oldAccount), []);
    assert.deepEqual(await repo.listForPerson(tenantB, person.id), []);
  });
});
