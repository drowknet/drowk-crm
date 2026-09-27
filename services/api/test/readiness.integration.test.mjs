import assert from "node:assert/strict";
import { test } from "node:test";
import { applyMigrations } from "@drowk/db";
import { createRuntime } from "../dist/server.js";
import { disposableDatabase } from "../../../packages/db/test/disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("ready requires current migrations and fails closed on ledger drift", async t => {
  const { pool, url } = await disposableDatabase(t);
  const runtime = createRuntime({ databaseUrl: url, environment: "test", host: "127.0.0.1", port: 8000 });
  await new Promise(resolve => runtime.server.listen(0, "127.0.0.1", resolve));
  // Register after fixture creation and explicitly close before database teardown.
  try {
    const base = `http://127.0.0.1:${runtime.server.address().port}`;
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/ready`)).status, 503);
    await applyMigrations(pool);
    const ready = await fetch(`${base}/ready`);
    assert.equal(ready.status, 200);
    assert.deepEqual(await ready.json(), { service: "drowk-api", status: "ready" });
    await pool.query("UPDATE public.drowk_schema_migrations SET checksum = $1 WHERE version = '0001'", ["0".repeat(64)]);
    const drift = await fetch(`${base}/ready`);
    assert.equal(drift.status, 503);
    assert.deepEqual(await drift.json(), { service: "drowk-api", status: "not_ready" });
  } finally { await runtime.close(); }
});
