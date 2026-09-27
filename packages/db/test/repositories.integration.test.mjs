import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import { PostgresRepositories, withTransaction } from "../dist/index.js";

const url = process.env.DROWK_TEST_DATABASE_URL;
if (!url) {
  test.skip("repository integration requires DROWK_TEST_DATABASE_URL (disposable PostgreSQL)");
} else {
const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
if (process.env.DROWK_TEST_DISPOSABLE !== "1" || !/(_test|_ci)$/.test(databaseName)) {
  throw new Error("Integration tests require DROWK_TEST_DISPOSABLE=1 and a *_test or *_ci database");
}

const pool = new pg.Pool({ connectionString: url });
const repositories = new PostgresRepositories(pool);
const tenantA = randomUUID();
const tenantB = randomUUID();
const now = "2026-09-27T12:34:56.000Z";

function account(id = randomUUID()) {
  return { id, name: "Synthetic Account", status: "ACTIVE", recordedAt: now, supersedesId: null };
}

function facility(accountId, id = randomUUID()) {
  return {
    id, accountId, name: "Synthetic Facility", addressText: "Test address",
    effectiveAt: null, recordedAt: now, supersedesId: null,
  };
}

function observation(id = randomUUID()) {
  return {
    id, runId: randomUUID(), correlationId: randomUUID(),
    sourceSystem: "SYNTHETIC", sourceNativeId: randomUUID(), sourceRevision: null,
    observedAt: null, effectiveAt: null, retrievedAt: now, ingestedAt: now,
    recordedAt: now, sourceWatermark: "cursor:7", adapterVersion: "test-v1",
    fingerprint: "sha256:synthetic-observation", rawArtifactRef: null,
    sourceMetadata: { nested: { labels: ["a", "b"], count: 2 }, active: true },
  };
}

function evidence(observationId, id = randomUUID()) {
  return {
    id, runId: randomUUID(), correlationId: randomUUID(), observationId,
    subject: { entityType: "ACCOUNT", entityId: null, candidateKey: "synthetic-candidate" },
    claim: "synthetic.claim", value: { answer: 42, nested: { valid: true } },
    trust: "CLAIMED", observedAt: null, effectiveAt: null, retrievedAt: now,
    recordedAt: now, expiresAt: null, rightsClass: "SYNTHETIC", supersedesId: null,
  };
}

before(async () => {
  await pool.query(
    `INSERT INTO tenants (id, slug, name) VALUES ($1, $2, $3), ($4, $5, $6)`,
    [tenantA, `test-${tenantA}`, "Synthetic Tenant A", tenantB, `test-${tenantB}`, "Synthetic Tenant B"],
  );
});

after(async () => { await pool.end(); });

test("Account create/read is tenant scoped", async () => {
  const input = account();
  assert.deepEqual(await repositories.createAccount(tenantA, input), { ...input, tenantId: tenantA });
  assert.deepEqual(await repositories.getAccount(tenantA, input.id), { ...input, tenantId: tenantA });
  assert.equal(await repositories.getAccount(tenantB, input.id), null);
});

test("Facility create/read/list and parent FK are tenant consistent", async () => {
  const parent = await repositories.createAccount(tenantA, account());
  const input = facility(parent.id);
  assert.deepEqual(await repositories.createFacility(tenantA, input), { ...input, tenantId: tenantA });
  assert.deepEqual(await repositories.getFacility(tenantA, input.id), { ...input, tenantId: tenantA });
  assert.deepEqual(await repositories.listFacilitiesForAccount(tenantA, parent.id), [
    { ...input, tenantId: tenantA },
  ]);
  assert.equal(await repositories.getFacility(tenantB, input.id), null);
  assert.deepEqual(await repositories.listFacilitiesForAccount(tenantB, parent.id), []);
  const unlinked = facility(null);
  assert.deepEqual(await repositories.createFacility(tenantA, unlinked), {
    ...unlinked, tenantId: tenantA,
  });
  await assert.rejects(
    repositories.createFacility(tenantB, facility(parent.id)),
    { code: "23503" },
  );
});

test("SourceObservation round trip and duplicate source identity", async () => {
  const input = observation();
  const inserted = await repositories.appendObservation(tenantA, input);
  assert.equal(inserted.status, "inserted");
  const expected = { ...input, tenantId: tenantA };
  assert.deepEqual(inserted.observation, expected);
  assert.deepEqual(await repositories.getObservation(tenantA, input.id), expected);
  assert.equal(await repositories.getObservation(tenantB, input.id), null);
  assert.deepEqual(
    await repositories.findObservationBySourceIdentity(
      tenantA, input.sourceSystem, input.sourceNativeId, null,
    ), expected,
  );
  assert.equal(
    await repositories.findObservationBySourceIdentity(
      tenantB, input.sourceSystem, input.sourceNativeId, null,
    ), null,
  );

  const duplicate = await repositories.appendObservation(tenantA, {
    ...input, id: randomUUID(), fingerprint: "sha256:changed-candidate",
  });
  assert.deepEqual(duplicate, { status: "already_exists", observation: expected });
  const count = await pool.query(
    `SELECT count(*)::int AS count FROM source_observations
     WHERE tenant_id = $1 AND source_system = $2 AND source_native_id = $3`,
    [tenantA, input.sourceSystem, input.sourceNativeId],
  );
  assert.equal(count.rows[0].count, 1);

  const emptyRevision = await repositories.appendObservation(tenantA, {
    ...input, id: randomUUID(), sourceRevision: "",
  });
  assert.equal(emptyRevision.status, "inserted");
  assert.equal(emptyRevision.observation.sourceRevision, "");
  assert.equal(
    (await repositories.findObservationBySourceIdentity(
      tenantA, input.sourceSystem, input.sourceNativeId, "",
    ))?.id,
    emptyRevision.observation.id,
  );
  const revised = await repositories.appendObservation(tenantA, {
    ...input, id: randomUUID(), sourceRevision: "revision-2",
  });
  assert.equal(revised.status, "inserted");
  assert.equal(revised.observation.sourceRevision, "revision-2");
  assert.deepEqual(await repositories.appendObservation(tenantA, {
    ...input, sourceNativeId: randomUUID(),
  }), { status: "id_conflict" });

  const precise = {
    ...observation(), observedAt: "2026-09-25T01:02:03.123456Z",
    effectiveAt: "2026-09-25T01:02:03.654321Z",
    retrievedAt: "2026-09-27T12:34:56.234567Z",
    ingestedAt: "2026-09-27T12:34:56.345678Z",
    recordedAt: "2026-09-27T12:34:56.456789Z",
  };
  assert.deepEqual(await repositories.appendObservation(tenantA, precise), {
    status: "inserted", observation: { ...precise, tenantId: tenantA },
  });
});

test("Evidence round trip, tenant FK, and observation immutability", async () => {
  const source = observation();
  await repositories.appendObservation(tenantA, source);
  const beforeAppend = await repositories.getObservation(tenantA, source.id);
  const input = evidence(source.id);
  const expected = { ...input, tenantId: tenantA };
  assert.deepEqual(await repositories.appendEvidence(tenantA, input), expected);
  assert.deepEqual(await repositories.getEvidence(tenantA, input.id), expected);
  assert.deepEqual(await repositories.listEvidenceForObservation(tenantA, source.id), [expected]);
  assert.equal(await repositories.getEvidence(tenantB, input.id), null);
  assert.deepEqual(await repositories.listEvidenceForObservation(tenantB, source.id), []);
  assert.deepEqual(await repositories.getObservation(tenantA, source.id), beforeAppend);
  await assert.rejects(repositories.appendEvidence(tenantB, evidence(source.id)), { code: "23503" });
  await assert.rejects(repositories.appendEvidence(tenantA, input), { code: "23505" });
});

test("transaction rollback leaves no partial Account/Facility data", async () => {
  const parent = account();
  const child = facility(parent.id);
  await assert.rejects(
    withTransaction(pool, async (tx) => {
      await tx.createAccount(tenantA, parent);
      await tx.createFacility(tenantA, child);
      throw new Error("synthetic rollback");
    }),
    /synthetic rollback/,
  );
  assert.equal(await repositories.getAccount(tenantA, parent.id), null);
  assert.equal(await repositories.getFacility(tenantA, child.id), null);
});
}
