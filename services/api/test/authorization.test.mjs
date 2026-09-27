import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import { test } from "node:test";
import { createProbeServer } from "../dist/server.js";

const tenantId = randomUUID(), otherTenant = randomUUID(), userId = randomUUID(), actorId = randomUUID();
const principal = { issuer: "synthetic-issuer", subject: "synthetic-subject", email: "synthetic@example.invalid" };

async function fixture(t) {
  const state = { principal, active: true, authCalls: 0, dbCalls: 0, readyCalls: 0 };
  const server = createProbeServer(async () => { state.readyCalls++; return true; }, {
    verifier: { verify: async () => { state.authCalls++; if (state.failure) throw new Error("SECRET verifier internals"); return state.principal; } },
    identities: {
      getIdentity: async (issuer, subject) => {
        state.dbCalls++;
        if (state.dbFailure) throw new Error("SECRET SQL credentials");
        return issuer === principal.issuer && subject === principal.subject ? { ...principal, userId } : null;
      },
      resolveActiveMembership: async (tenant, user) => {
        state.dbCalls++;
        if (state.mismatchedMembership) return state.mismatchedMembership;
        return state.active && tenant === tenantId && user === userId ? { tenantId, userId, actorId } : null;
      },
    },
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = (selector = tenantId) => fetch(`${base}/operator/context`, { headers: selector === null ? {} : { "x-drowk-tenant-id": selector } });
  return { state, base, context };
}

test("active membership yields only bounded context with independent server attribution", async t => {
  const { context } = await fixture(t);
  const response = await context(tenantId.toUpperCase());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.deepEqual(Object.keys(body).sort(), ["actorId", "correlationId", "runId", "tenantId", "userId"]);
  assert.deepEqual([body.tenantId, body.userId, body.actorId], [tenantId, userId, actorId]);
  assert.equal(new Set(Object.values(body)).size, 5);
  const next = await (await context()).json();
  assert.notEqual(next.runId, body.runId);
  assert.notEqual(next.correlationId, body.correlationId);
});

test("tenant isolation, missing membership and immediate revocation deny access", async t => {
  const { context, state } = await fixture(t);
  assert.equal((await context(otherTenant)).status, 403);
  assert.equal((await context()).status, 200);
  state.active = false;
  assert.equal((await context()).status, 403);
});

test("inconsistent resolver scope fails closed and client attribution cannot override context", async t => {
  const { context, state, base } = await fixture(t);
  for (const membership of [
    { tenantId: otherTenant, userId, actorId }, { tenantId, userId: randomUUID(), actorId },
  ]) {
    state.mismatchedMembership = membership;
    assert.equal((await context()).status, 403);
  }
  state.mismatchedMembership = null;
  const forged = randomUUID();
  const response = await fetch(`${base}/operator/context`, { headers: {
    "x-drowk-tenant-id": tenantId, "x-actor-id": forged, "x-run-id": forged, "x-correlation-id": forged,
  } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.actorId, actorId);
  assert.notEqual(body.runId, forged);
  assert.notEqual(body.correlationId, forged);
});

test("email and subject alone cannot resolve a principal; unknown identities fail closed", async t => {
  const { context, state } = await fixture(t);
  for (const candidate of [
    { ...principal, subject: "unknown" }, { ...principal, issuer: "other-issuer" },
  ]) {
    state.principal = candidate;
    assert.equal((await context()).status, 403);
  }
  for (const candidate of [null, { email: principal.email }, { issuer: "", subject: "x" }, { issuer: 5, subject: "x" }]) {
    state.principal = candidate;
    assert.equal((await context()).status, 401);
  }
});

test("missing, malformed and duplicated tenant selectors fail before repository access", async t => {
  const { context, state, base } = await fixture(t);
  for (const value of [null, "", "not-uuid", `${tenantId},${otherTenant}`]) {
    assert.equal((await context(value)).status, 400);
  }
  const status = await new Promise((resolve, reject) => {
    const request = httpRequest(`${base}/operator/context`, { headers: ["x-drowk-tenant-id", tenantId, "X-Drowk-Tenant-Id", tenantId] }, response => {
      response.resume(); response.on("end", () => resolve(response.statusCode));
    });
    request.on("error", reject); request.end();
  });
  assert.equal(status, 400);
  assert.equal(state.dbCalls, 0);
});

test("verifier and database failures are generic; public probes bypass authentication", async t => {
  const { context, state, base } = await fixture(t);
  state.failure = true;
  let response = await context();
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { status: "unauthenticated" });
  assert.equal(state.dbCalls, 0);
  const authCalls = state.authCalls;
  assert.equal((await fetch(`${base}/health`)).status, 200);
  assert.equal(state.readyCalls, 0);
  assert.equal((await fetch(`${base}/ready`)).status, 200);
  assert.equal(state.authCalls, authCalls);
  assert.equal(state.dbCalls, 0);
  assert.equal((await fetch(`${base}/operator/context`, { method: "POST" })).status, 404);
  state.failure = false; state.dbFailure = true;
  response = await context();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: "unavailable" });
});
