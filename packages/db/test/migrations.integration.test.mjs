import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile, cp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { setTimeout } from "node:timers/promises";
import { applyMigrations, defaultMigrationsDirectory, migrationStatus } from "../dist/index.js";
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
  assert.equal(rows.length, 2);
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
