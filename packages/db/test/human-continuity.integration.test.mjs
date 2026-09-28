import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import { PostgresHumanContinuityRepository } from "../dist/index.js";

const url = process.env.DROWK_TEST_DATABASE_URL;
if (!url) {
  test.skip("human continuity integration requires disposable PostgreSQL");
} else {
  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (process.env.DROWK_TEST_DISPOSABLE !== "1" || !/(_test|_ci)$/.test(databaseName)) {
    throw new Error("Integration tests require DROWK_TEST_DISPOSABLE=1 and a *_test or *_ci database");
  }
  const pool = new pg.Pool({ connectionString: url });
  const repo = new PostgresHumanContinuityRepository(pool);
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const now = "2026-09-27T12:34:56.000Z";
  const person = (id = randomUUID()) =>
    ({ id, displayName: null, recordedAt: now, supersedesId: null });
  const contact = (id = randomUUID()) =>
    ({ id, displayName: "Synthetic Contact", recordedAt: now, supersedesId: null });
  const identity = (personId, matchDecisionId, id = randomUUID()) => ({
    id, personId, kind: "EMAIL", namespace: "synthetic:mail",
    normalizedValue: "shared@example.invalid", temporalState: "UNKNOWN",
    effectiveFrom: null, effectiveTo: null, matchDecisionId,
    recordedAt: now, supersedesId: null,
  });
  const employment = (personId, accountId, id = randomUUID()) => ({
    id, personId, accountId, title: null, state: "UNKNOWN",
    startedOn: null, endedOn: null, recordedAt: now, supersedesId: null,
  });
  async function account(tenantId, name) {
    const id = randomUUID();
    await pool.query(`INSERT INTO accounts (id,tenant_id,name) VALUES ($1,$2,$3)`, [id, tenantId, name]);
    return id;
  }
  async function decision(tenantId, status, selectedEntityId, resolutionScope = "PERSON") {
    const id = randomUUID();
    await pool.query(`INSERT INTO entity_match_decisions
      (id,tenant_id,run_id,correlation_id,subject_key,resolution_scope,status,
       selected_entity_id,candidate_count,fingerprint,policy_version)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,'synthetic-fingerprint','test-v1')`,
    [id, tenantId, randomUUID(), randomUUID(), `synthetic:${id}`, resolutionScope,
      status, selectedEntityId]);
    return id;
  }

  before(async () => {
    await pool.query(`INSERT INTO tenants (id,slug,name) VALUES ($1,$2,'Synthetic A'),($3,$4,'Synthetic B')`,
      [tenantA, `test-${tenantA}`, tenantB, `test-${tenantB}`]);
  });
  after(async () => { await pool.end(); });

  test("goldens 1-2: Person without Employment and legacy unlinked Contact remain valid", async () => {
    const p = person();
    assert.deepEqual(await repo.createPerson(tenantA, p), { ...p, tenantId: tenantA });
    assert.deepEqual(await repo.getPerson(tenantA, p.id), { ...p, tenantId: tenantA });
    assert.deepEqual(await repo.listEmploymentsForPerson(tenantA, p.id), []);
    const c = contact();
    await pool.query(`INSERT INTO contacts (id,tenant_id,display_name,recorded_at)
      VALUES ($1,$2,$3,$4)`, [c.id, tenantA, c.displayName, c.recordedAt]);
    assert.deepEqual(await repo.getContact(tenantA, c.id),
      { ...c, tenantId: tenantA, personId: null, personMatchDecisionId: null });
  });

  test("goldens 3-7: explicit safe Contact link, rejected ambiguity, replay, conflict", async () => {
    const p1 = await repo.createPerson(tenantA, person());
    const p2 = await repo.createPerson(tenantA, person());
    const c = await repo.createContact(tenantA, contact());
    const unsafe = await Promise.all(["REVIEW_REQUIRED", "LINK_CONFLICT", "NO_MATCH"].map(
      status => decision(tenantA, status, null)));
    for (const id of unsafe) {
      assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p1.id, id),
        { status: "unsafe_decision" });
    }
    const wrong = await decision(tenantA, "MATCHED_SAFE", p2.id);
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p1.id, wrong),
      { status: "unsafe_decision" });
    const wrongScope = await decision(tenantA, "MATCHED_SAFE", p1.id, "ACCOUNT");
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p1.id, wrongScope),
      { status: "unsafe_decision" });
    const safe = await decision(tenantA, "MATCHED_SAFE", p1.id);
    const result = await repo.linkContactToPerson(tenantA, c.id, p1.id, safe);
    assert.equal(result.status, "linked");
    assert.equal(result.contact.personId, p1.id);
    assert.equal(result.contact.personMatchDecisionId, safe);
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p1.id, safe),
      { status: "already_linked", contact: result.contact });
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p2.id, wrong),
      { status: "link_conflict" });
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p1.id, wrongScope),
      { status: "link_conflict" });
    assert.deepEqual(await repo.getContact(tenantA, c.id), result.contact);
    await assert.rejects(pool.query(`UPDATE contacts SET person_id=$1,
      person_match_decision_id=$2 WHERE id=$3`, [p2.id, wrong, c.id]), { code: "P0001" });
    await assert.rejects(pool.query(`UPDATE contacts SET person_id=NULL,
      person_match_decision_id=NULL,person_decision_scope=NULL,
      person_decision_status=NULL WHERE id=$1`, [c.id]), { code: "P0001" });
  });

  test("goldens 8-10: Identity promotion needs safe target; shared value is not person proof", async () => {
    const p1 = await repo.createPerson(tenantA, person());
    const p2 = await repo.createPerson(tenantA, person());
    const d1 = await decision(tenantA, "MATCHED_SAFE", p1.id);
    const d2 = await decision(tenantA, "MATCHED_SAFE", p2.id);
    const review = await decision(tenantA, "REVIEW_REQUIRED", null);
    await assert.rejects(repo.createIdentity(tenantA, identity(p1.id, review)), { code: "23503" });
    await assert.rejects(repo.createIdentity(tenantA, identity(p2.id, d1)), { code: "23503" });
    await assert.rejects(repo.createIdentity(tenantA,
      { ...identity(p1.id, d1), namespace: " " }), { code: "23514" });
    await assert.rejects(repo.createIdentity(tenantA,
      { ...identity(p1.id, d1), normalizedValue: " " }), { code: "23514" });
    const historical = { ...identity(p1.id, d1), temporalState: "HISTORICAL",
      effectiveFrom: "2020-01-01", effectiveTo: "2022-01-01" };
    assert.deepEqual(await repo.createIdentity(tenantA, historical),
      { ...historical, tenantId: tenantA });
    const newer = { ...identity(p1.id, d1), normalizedValue: "new@example.invalid",
      temporalState: "CURRENT", effectiveFrom: "2023-01-01",
      recordedAt: "2026-09-28T12:34:56.000Z" };
    await repo.createIdentity(tenantA, newer);
    assert.deepEqual(await repo.getIdentity(tenantA, historical.id),
      { ...historical, tenantId: tenantA });
    assert.deepEqual((await repo.listIdentitiesForPerson(tenantA, p1.id)).map(x => x.id),
      [historical.id, newer.id]);
    const shared = identity(p2.id, d2);
    assert.equal((await repo.createIdentity(tenantA, shared)).personId, p2.id);
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM person_identities
      WHERE tenant_id=$1 AND normalized_value=$2`,
    [tenantA, historical.normalizedValue])).rows[0].n, 2);
  });

  test("goldens 11-14: unknown dates, invalid range, append-only job-change history", async () => {
    const p = await repo.createPerson(tenantA, person());
    const a = await account(tenantA, "Synthetic Account A");
    const b = await account(tenantA, "Synthetic Account B");
    const old = { ...employment(p.id, a), title: "Former title", state: "FORMER" };
    assert.deepEqual(await repo.createEmployment(tenantA, old), { ...old, tenantId: tenantA });
    assert.equal((await repo.getEmployment(tenantA, old.id)).startedOn, null);
    assert.equal((await repo.getEmployment(tenantA, old.id)).endedOn, null);
    await assert.rejects(repo.createEmployment(tenantA,
      { ...employment(p.id, b), startedOn: "2026-02-01", endedOn: "2026-01-01" }),
    { code: "23514" });
    const newer = { ...employment(p.id, b), state: "CURRENT",
      startedOn: "2026-03-01", recordedAt: "2026-09-28T12:34:56.000Z" };
    await repo.createEmployment(tenantA, newer);
    const rows = await repo.listEmploymentsForPerson(tenantA, p.id);
    assert.deepEqual(rows, [{ ...old, tenantId: tenantA }, { ...newer, tenantId: tenantA }]);
    assert.equal(rows[1].title, null);
    assert.equal(rows[0].accountId, a);
    assert.equal(rows[1].accountId, b);
  });

  test("golden 15: cross-tenant reads, parents, decisions and Contact links fail", async () => {
    const p = await repo.createPerson(tenantA, person());
    const a = await account(tenantA, "Synthetic A");
    const b = await account(tenantB, "Synthetic B");
    const d = await decision(tenantA, "MATCHED_SAFE", p.id);
    const ownedIdentity = await repo.createIdentity(tenantA, identity(p.id, d));
    const ownedEmployment = await repo.createEmployment(tenantA, employment(p.id, a));
    const c = await repo.createContact(tenantB, contact());
    assert.equal(await repo.getPerson(tenantB, p.id), null);
    assert.equal(await repo.getContact(tenantA, c.id), null);
    assert.equal(await repo.getIdentity(tenantB, ownedIdentity.id), null);
    assert.equal(await repo.getEmployment(tenantB, ownedEmployment.id), null);
    assert.deepEqual(await repo.listIdentitiesForPerson(tenantB, p.id), []);
    assert.deepEqual(await repo.listEmploymentsForPerson(tenantB, p.id), []);
    assert.deepEqual(await repo.linkContactToPerson(tenantB, c.id, p.id, d),
      { status: "person_not_found" });
    assert.deepEqual(await repo.linkContactToPerson(tenantA, c.id, p.id, d),
      { status: "contact_not_found" });
    await assert.rejects(repo.createIdentity(tenantB, identity(p.id, d)), { code: "23503" });
    await assert.rejects(repo.createEmployment(tenantB, employment(p.id, b)), { code: "23503" });
    await assert.rejects(repo.createEmployment(tenantA, employment(p.id, b)), { code: "23503" });
    await assert.rejects(pool.query(`UPDATE contacts SET person_id=$1,
      person_match_decision_id=$2,person_decision_scope='PERSON',
      person_decision_status='MATCHED_SAFE' WHERE id=$3`, [p.id, d, c.id]), { code: "23503" });
  });

  test("SQL authority guard rejects partial-null decision tuple and direct unsafe promotion", async () => {
    const p = await repo.createPerson(tenantA, person());
    const d = await decision(tenantA, "MATCHED_SAFE", p.id);
    const review = await decision(tenantA, "REVIEW_REQUIRED", null);
    const c = await repo.createContact(tenantA, contact());
    await assert.rejects(pool.query(`UPDATE contacts SET person_id=$1,
      person_match_decision_id=$2 WHERE id=$3`, [p.id, d, c.id]), { code: "23514" });
    await assert.rejects(pool.query(`UPDATE contacts SET person_id=$1,
      person_match_decision_id=$2,person_decision_scope='PERSON',
      person_decision_status='MATCHED_SAFE' WHERE id=$3`, [p.id, review, c.id]), { code: "23503" });
    assert.equal((await repo.getContact(tenantA, c.id)).personId, null);
  });

  test("concurrent links compare-and-set: one wins, the other fails closed", async () => {
    const p1 = await repo.createPerson(tenantA, person());
    const p2 = await repo.createPerson(tenantA, person());
    const d1 = await decision(tenantA, "MATCHED_SAFE", p1.id);
    const d2 = await decision(tenantA, "MATCHED_SAFE", p2.id);
    const c = await repo.createContact(tenantA, contact());
    const results = await Promise.all([
      repo.linkContactToPerson(tenantA, c.id, p1.id, d1),
      repo.linkContactToPerson(tenantA, c.id, p2.id, d2),
    ]);
    assert.deepEqual(results.map(x => x.status).sort(), ["link_conflict", "linked"]);
    assert.ok([p1.id, p2.id].includes((await repo.getContact(tenantA, c.id)).personId));
  });
}
