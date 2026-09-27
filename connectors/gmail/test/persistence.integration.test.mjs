import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import test from "node:test";
import { toSourceObservation } from "../dist/index.js";

const url = process.env.DROWK_TEST_DATABASE_URL;
if (!url) {
  test.skip("Gmail observation persistence requires disposable PostgreSQL");
} else {
  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (process.env.DROWK_TEST_DISPOSABLE !== "1" || !/(_test|_ci)$/.test(databaseName)) {
    throw new Error("Gmail persistence sensor requires a disposable *_test or *_ci database");
  }
  const dbRequire = createRequire(new URL("../../../packages/db/package.json", import.meta.url));
  const pg = dbRequire("pg");
  const { PostgresRepositories } = await import("../../../packages/db/dist/index.js");

  test("mapped Gmail observation replays, conflicts and appends real provider revisions", async () => {
    const pool = new pg.Pool({ connectionString: url });
    try {
      const tenantId = randomUUID();
      await pool.query("INSERT INTO tenants (id, slug, name) VALUES ($1, $2, $3)",
        [tenantId, `synthetic-gmail-${tenantId}`, "Synthetic Gmail Tenant"]);
      const repositories = new PostgresRepositories(pool);
      const source = {
        messageId: `synthetic-${randomUUID()}`, threadId: "synthetic-thread",
        providerRevision: null, messageDate: null, internalDate: null,
        retrievedAt: "2026-09-27T10:00:00.000Z",
        from: "sender@example.invalid", to: ["mailbox@example.invalid"], cc: [],
        subject: "Synthetic subject", labels: ["INBOX"],
        mailboxRef: "synthetic-mailbox", connectorRef: "synthetic-connector",
        sourceWatermark: "100", adapterVersion: "synthetic-v1", rawArtifactRef: null,
      };
      const lineage = () => ({ id: randomUUID(), runId: randomUUID(), correlationId: randomUUID(),
        ingestedAt: "2026-09-27T10:00:01.000Z", recordedAt: "2026-09-27T10:00:02.000Z" });
      const first = await repositories.appendObservation(tenantId,
        toSourceObservation(source, lineage()));
      assert.equal(first.status, "inserted");
      const replay = await repositories.appendObservation(tenantId,
        toSourceObservation({ ...source, retrievedAt: "2026-09-27T11:00:00.000Z",
          sourceWatermark: "101" }, lineage()));
      assert.deepEqual(replay, { status: "already_exists", observation: first.observation });
      const changed = await repositories.appendObservation(tenantId,
        toSourceObservation({ ...source, subject: "Changed synthetic subject" }, lineage()));
      assert.deepEqual(changed, { status: "fingerprint_conflict", observation: first.observation });
      const revised = await repositories.appendObservation(tenantId,
        toSourceObservation({ ...source, providerRevision: "102",
          subject: "Changed synthetic subject" }, lineage()));
      assert.equal(revised.status, "inserted");
      assert.equal(revised.observation.sourceRevision, "102");
      assert.equal((await pool.query(
        `SELECT count(*)::int AS count FROM source_observations
         WHERE tenant_id = $1 AND source_system = 'gmail' AND source_native_id = $2`,
        [tenantId, source.messageId])).rows[0].count, 2);
      assert.deepEqual(await repositories.getObservation(tenantId, first.observation.id),
        first.observation);
    } finally {
      await pool.end();
    }
  });
}
