import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { applyMigrations, PostgresIdentityRepository } from "@drowk/db";
import { createRuntime } from "../dist/server.js";
import { disposableDatabase } from "../../../packages/db/test/disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("PostgreSQL identity and membership gate protects HTTP context without implicit provisioning", async t => {
  const { pool, url } = await disposableDatabase(t);
  await applyMigrations(pool);
  const repository = new PostgresIdentityRepository(pool);
  const user = await repository.createUser("Synthetic operator");
  const outsider = await repository.createUser();
  const tenantId = randomUUID(), otherTenant = randomUUID();
  await pool.query("INSERT INTO tenants (id, slug, name) VALUES ($1, 'synthetic-a', 'Synthetic A'), ($2, 'synthetic-b', 'Synthetic B')", [tenantId, otherTenant]);
  const audit = { actorId: user.actorId, runId: randomUUID(), correlationId: randomUUID(), policyVersion: "synthetic-policy-v1" };
  const original = { issuer: "synthetic", subject: "operator", email: "shared@example.invalid" };
  await repository.bindIdentity(user.id, original);
  await repository.bindIdentity(outsider.id, { ...original, subject: "outsider" });
  await repository.createMembership(tenantId, user.id, audit);
  let principal = original;
  const runtime = createRuntime({ databaseUrl: url, environment: "test", host: "127.0.0.1", port: 8000 }, {
    verify: async () => { if (principal === "throw") throw new Error("secret-provider-error"); return principal; },
  });
  await new Promise(resolve => runtime.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${runtime.server.address().port}`;
  const context = (tenant = tenantId) => fetch(`${base}/operator/context`, { headers: { "x-drowk-tenant-id": tenant } });
  const counts = async () => (await pool.query("SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM auth_identities) AS identities, (SELECT count(*) FROM tenant_memberships) AS memberships")).rows[0];
  try {
    const before = await counts();
    let response = await context();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.userId, user.id);
    assert.equal(body.actorId, user.actorId);
    assert.equal(body.tenantId, tenantId);
    assert.equal((await context(otherTenant)).status, 403);
    principal = { ...original, subject: "outsider" };
    assert.equal((await context()).status, 403);
    principal = { ...original, subject: "unknown" };
    assert.equal((await context()).status, 403);
    principal = { ...original, issuer: "unknown" };
    assert.equal((await context()).status, 403);
    principal = original;
    await repository.revokeMembership(tenantId, user.id, audit);
    assert.equal((await context()).status, 403);
    assert.equal((await context("malformed")).status, 400);
    assert.equal((await fetch(`${base}/operator/context`)).status, 400);
    principal = "throw";
    response = await context();
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { status: "unauthenticated" });
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/ready`)).status, 200);
    assert.deepEqual(await counts(), before);
  } finally { await runtime.close(); }
});
