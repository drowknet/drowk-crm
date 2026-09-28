import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { applyMigrations, defaultMigrationsDirectory, migrationStatus,
  PostgresRepositories } from "../dist/index.js";
import { disposableDatabase } from "./disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
async function directory(t) {
  const path = await mkdtemp(join(tmpdir(), "drowk-migrations-"));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

pgTest("fresh plan is read-only; apply is ordered and idempotent with exact ledger checksums", async t => {
  const { pool } = await disposableDatabase(t);
  const plan = await migrationStatus(pool);
  assert.equal(plan.current, false);
  assert.deepEqual(plan.migrations.map(m => [m.filename, m.state]), [
    ["0001_foundation.sql", "pending"], ["0002_source_revision_identity.sql", "pending"],
    ["0003_identity_membership.sql", "pending"], ["0004_work_due_date.sql", "pending"],
    ["0005_human_continuity.sql", "pending"],
    ["0006_accepted_interactions.sql", "pending"],
    ["0007_participant_identity_authority.sql", "pending"],
    ["0008_commitment_memory.sql", "pending"],
  ]);
  assert.deepEqual((await pool.query(
    "SELECT to_regclass('public.drowk_schema_migrations') AS ledger, to_regclass('public.tenants') AS tenants",
  )).rows[0], { ledger: null, tenants: null });
  assert.deepEqual(await applyMigrations(pool), { applied: plan.migrations.map(m => m.filename) });
  assert.equal((await migrationStatus(pool)).current, true);
  assert.deepEqual(await applyMigrations(pool), { applied: [] });
  const rows = (await pool.query("SELECT version, filename, checksum FROM public.drowk_schema_migrations ORDER BY filename")).rows;
  for (let i = 0; i < rows.length; i++) {
    const file = plan.migrations[i];
    assert.deepEqual(rows[i], {
      filename: file.filename, version: file.version,
      checksum: createHash("sha256").update(await readFile(join(defaultMigrationsDirectory, file.filename))).digest("hex"),
    });
  }
  assert.equal(rows.length, 8);
  assert.deepEqual((await pool.query(`
    SELECT data_type, is_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'work_items' AND column_name = 'due_date'
  `)).rows, [{ data_type: "date", is_nullable: "YES" }]);
});

pgTest("checksum drift, missing migrations, and non-prefix ledger history fail closed", async t => {
  const { pool } = await disposableDatabase(t);
  const path = await directory(t);
  await cp(defaultMigrationsDirectory, path, { recursive: true });
  await applyMigrations(pool, path);
  const first = join(path, "0001_foundation.sql");
  const original = await readFile(first);
  await writeFile(first, Buffer.concat([original, Buffer.from("\n-- changed\n")]));
  await assert.rejects(applyMigrations(pool, path), { code: "MIGRATION_CHECKSUM_CHANGED" });
  await assert.rejects(migrationStatus(pool, path), { code: "MIGRATION_CHECKSUM_CHANGED" });
  await writeFile(first, original);
  await rm(join(path, "0002_source_revision_identity.sql"));
  await assert.rejects(migrationStatus(pool, path), { code: "MIGRATION_HISTORY_INVALID" });
  await pool.query("DELETE FROM public.drowk_schema_migrations WHERE version = '0001'");
  await assert.rejects(applyMigrations(pool), { code: "MIGRATION_HISTORY_INVALID" });
});

pgTest("0006 preserves legacy Gmail mailbox identity across namespace backfill and replay", async t => {
  const { pool } = await disposableDatabase(t);
  const path = await directory(t);
  await cp(defaultMigrationsDirectory, path, { recursive: true });
  await rm(join(path, "0006_accepted_interactions.sql"));
  await rm(join(path, "0007_participant_identity_authority.sql"));
  await rm(join(path, "0008_commitment_memory.sql"));
  await applyMigrations(pool, path);
  const tenantId = randomUUID();
  const observationId = randomUUID();
  const nativeId = randomUUID();
  const now = "2026-09-28T12:34:56.000Z";
  const namespace = "gmail:9:connector:7:mailbox";
  const oldMetadata = { gmail: { connectorRef: "connector", mailboxRef: "mailbox" } };
  await pool.query(`INSERT INTO tenants (id,slug,name) VALUES ($1,$2,'Legacy synthetic')`,
    [tenantId, `legacy-${tenantId}`]);
  await pool.query(`INSERT INTO source_observations
    (id,tenant_id,run_id,correlation_id,source_system,source_native_id,source_revision,
     retrieved_at,ingested_at,recorded_at,adapter_version,fingerprint,source_metadata)
    VALUES ($1,$2,$3,$4,'gmail',$5,NULL,$6,$6,$6,'legacy-v1','sha256:legacy',$7::jsonb)`,
  [observationId, tenantId, randomUUID(), randomUUID(), nativeId, now,
    JSON.stringify(oldMetadata)]);
  assert.deepEqual(await applyMigrations(pool), { applied: [
    "0006_accepted_interactions.sql", "0007_participant_identity_authority.sql",
    "0008_commitment_memory.sql",
  ] });
  assert.equal((await pool.query(`SELECT source_namespace FROM source_observations WHERE id=$1`,
    [observationId])).rows[0].source_namespace, namespace);
  const replay = await new PostgresRepositories(pool).appendObservation(tenantId, {
    id: randomUUID(), runId: randomUUID(), correlationId: randomUUID(),
    sourceSystem: "gmail", sourceNativeId: nativeId, sourceRevision: null,
    observedAt: null, effectiveAt: null, retrievedAt: now, ingestedAt: now,
    recordedAt: now, sourceWatermark: null, adapterVersion: "legacy-v1",
    fingerprint: "sha256:legacy", rawArtifactRef: null,
    sourceMetadata: { ...oldMetadata, sourceNamespace: namespace },
  });
  assert.equal(replay.status, "already_exists");
  assert.equal(replay.observation.id, observationId);
});

pgTest("wrapped failed migration rolls back DDL and ledger; retry can succeed", async t => {
  const { pool } = await disposableDatabase(t);
  const path = await directory(t);
  const file = join(path, "0001_failure.sql");
  await writeFile(file, "BEGIN; CREATE TABLE rollback_probe(id int); SELECT 1/0; COMMIT;");
  await assert.rejects(applyMigrations(pool, path), { code: "MIGRATION_APPLY_FAILED" });
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM public.drowk_schema_migrations")).rows[0].n, 0);
  assert.equal((await pool.query("SELECT to_regclass('public.rollback_probe') AS name")).rows[0].name, null);
  await writeFile(file, "BEGIN; CREATE TABLE rollback_probe(id int); COMMIT;");
  assert.deepEqual(await applyMigrations(pool, path), { applied: ["0001_failure.sql"] });
});

pgTest("a running migration excludes other apply/status sessions until completion", async t => {
  const { pool } = await disposableDatabase(t);
  const path = await directory(t);
  await writeFile(join(path, "0001_lock.sql"), "SELECT pg_advisory_xact_lock(52, 1); CREATE TABLE lock_probe(id int);");
  const blocker = await pool.connect();
  await blocker.query("SELECT pg_advisory_lock(52, 1)");
  const first = applyMigrations(pool, path).then(value => ({ value }), error => ({ error }));
  try {
    const deadline = Date.now() + 5000;
    let waiting = false;
    while (!waiting && Date.now() < deadline) {
      waiting = (await pool.query(`SELECT EXISTS (
        SELECT 1 FROM pg_locks WHERE locktype = 'advisory' AND classid = 52 AND objid = 1
        AND database = (SELECT oid FROM pg_database WHERE datname = current_database()) AND NOT granted
      ) AS waiting`)).rows[0].waiting;
      if (!waiting) await setTimeout(20);
    }
    assert.equal(waiting, true, "first runner must actually be blocked inside its migration");
    await assert.rejects(applyMigrations(pool, path), { code: "MIGRATION_LOCKED" });
    await assert.rejects(migrationStatus(pool, path), { code: "MIGRATION_LOCKED" });
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM public.drowk_schema_migrations")).rows[0].n, 0);
  } finally {
    await blocker.query("SELECT pg_advisory_unlock(52, 1)");
    blocker.release();
    const result = await first;
    if (result.error) throw result.error;
  }
  assert.equal((await migrationStatus(pool, path)).current, true);
});
