import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { applyMigrations, PostgresIdentityRepository } from "@drowk/db";
import { createRuntime } from "../dist/server.js";
import { disposableDatabase } from "../../../packages/db/test/disposable.mjs";
import { access, accessFixture } from "./access-fixture.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("verified Access claims cannot provision, rebind or override DROWK membership", async t => {
  const { pool, url } = await disposableDatabase(t);
  await applyMigrations(pool);
  const repository = new PostgresIdentityRepository(pool);
  const user = await repository.createUser("Synthetic operator");
  const tenantId = randomUUID(), otherTenant = randomUUID();
  await pool.query("INSERT INTO tenants (id, slug, name) VALUES ($1, 'access-a', 'Synthetic A'), ($2, 'access-b', 'Synthetic B')", [tenantId, otherTenant]);
  const audit = { actorId: user.actorId, runId: randomUUID(), correlationId: randomUUID(), policyVersion: "synthetic-policy-v1" };
  await repository.bindIdentity(user.id, { issuer: access.issuer, subject: "operator", email: "shared@example.invalid" });
  await repository.createMembership(tenantId, user.id, audit);
  const { verifier, sign } = await accessFixture();
  const runtime = createRuntime({ databaseUrl: url, environment: "test", host: "127.0.0.1", port: 8000 }, verifier);
  await new Promise(resolve => runtime.server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${runtime.server.address().port}`;
  const context = async (claims = {}, tenant = tenantId) => fetch(`${base}/operator/context`, { headers: {
    "cf-access-jwt-assertion": await sign({ email: "shared@example.invalid", groups: ["admin"], roles: ["owner"], organization: tenantId, ...claims }),
    "x-drowk-tenant-id": tenant,
  } });
  const counts = async () => (await pool.query("SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM auth_identities) AS identities, (SELECT count(*) FROM tenant_memberships) AS memberships")).rows[0];
  try {
    const before = await counts();
    const response = await context();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.userId, user.id);
    assert.equal(body.tenantId, tenantId);
    assert.equal((await context({ sub: "changed-subject" })).status, 403);
    assert.equal((await context({ sub: "new-identity" })).status, 403);
    assert.equal((await context({}, otherTenant)).status, 403);
    assert.deepEqual(await counts(), before);
    assert.equal((await repository.getIdentity(access.issuer, "operator")).userId, user.id);
    assert.equal(await repository.getIdentity(access.issuer, "changed-subject"), null);
    await repository.revokeMembership(tenantId, user.id, audit);
    assert.equal((await context()).status, 403);
    assert.deepEqual(await counts(), before);
    assert.equal((await fetch(`${base}/health`)).status, 200);
    assert.equal((await fetch(`${base}/ready`)).status, 200);
  } finally { await runtime.close(); }
});
