import assert from "node:assert/strict";
import { generateKeyPair } from "jose";
import { test } from "node:test";
import { createAccessVerifier, configuredVerifier } from "../dist/cloudflare-access.js";
import { readRuntimeConfig, createProbeServer } from "../dist/server.js";
import { access, accessFixture } from "./access-fixture.mjs";

test("Access verifies RS256 and emits only validated identity and structural metadata", async () => {
  const { verifier, sign, request } = await accessFixture();
  assert.deepEqual(await verifier.verify(request(await sign({ email: "operator@example.invalid", name: "Synthetic", groups: ["admin"] }))), {
    issuer: access.issuer, subject: "operator", email: "operator@example.invalid", displayName: "Synthetic",
  });
  assert.deepEqual(await verifier.verify(request(await sign({ type: undefined, email: {}, name: [] }))), { issuer: access.issuer, subject: "operator" });
  assert.ok(await verifier.verify(request(await sign({ aud: ["other", access.audience] }))));
  assert.ok(await verifier.verify(request(await sign({ aud: access.audience, nbf: undefined }))));
});

test("Access fails closed on invalid claims, time, signatures, algorithms and malformed JWTs", async t => {
  const { verifier, sign, request } = await accessFixture();
  for (const [name, claims] of Object.entries({
    issuer: { iss: "https://wrong.invalid" }, audience: { aud: "wrong" }, missingAudience: { aud: undefined },
    expired: { exp: 1 }, missingExpiry: { exp: undefined }, invalidExpiry: { exp: "tomorrow" },
    future: { nbf: Math.floor(Date.now() / 1000) + 3600 }, invalidNotBefore: { nbf: "later" },
    missingSubject: { sub: undefined }, emptySubject: { sub: "" }, blankSubject: { sub: "  " }, invalidSubject: { sub: 42 },
    globalToken: { type: "org" }, invalidType: { type: null },
  })) await t.test(name, async () => assert.equal(await verifier.verify(request(await sign(claims))), null));
  const wrongKey = await generateKeyPair("RS256");
  assert.equal(await verifier.verify(request(await sign({}, wrongKey.privateKey))), null);
  assert.equal(await verifier.verify(request(await sign({}, new Uint8Array(32), "HS256"))), null);
  for (const token of ["garbage", "", "eyJhbGciOiJub25lIn0.e30."]) assert.equal(await verifier.verify(request(token)), null);
  const unavailable = createAccessVerifier(access, async () => { throw new Error("sensitive key source failure"); });
  assert.equal(await unavailable.verify(request(await sign())), null);
});

test("only exactly one assertion header is accepted; cookies and bearer credentials do not substitute", async () => {
  const { verifier, sign, request } = await accessFixture();
  const token = await sign();
  for (const candidate of [
    { headers: { authorization: `Bearer ${token}`, cookie: `CF_Authorization=${token}` }, rawHeaders: [] },
    { headers: { "cf-access-jwt-assertion": [token, token] }, rawHeaders: ["cf-access-jwt-assertion", token] },
    { ...request(token), rawHeaders: ["Cf-Access-Jwt-Assertion", token, "CF-ACCESS-JWT-ASSERTION", token] },
    request(`${token}, ${token}`),
  ]) assert.equal(await verifier.verify(candidate), null);
});

test("runtime auth configuration is explicit, HTTPS-only and fail-closed", async () => {
  const base = { DATABASE_URL: "synthetic", APP_ENV: "test" };
  assert.equal(await configuredVerifier(readRuntimeConfig(base).access).verify({}), null);
  assert.equal(await configuredVerifier(readRuntimeConfig({ ...base, AUTH_PROVIDER: "none" }).access).verify({}), null);
  const valid = { ...base, AUTH_PROVIDER: "cloudflare-access", CLOUDFLARE_ACCESS_ISSUER: access.issuer, CLOUDFLARE_ACCESS_AUDIENCE: access.audience };
  assert.deepEqual(readRuntimeConfig(valid).access, access);
  for (const changes of [
    { AUTH_PROVIDER: "unknown" }, { AUTH_PROVIDER: "" }, { CLOUDFLARE_ACCESS_ISSUER: "" },
    { CLOUDFLARE_ACCESS_AUDIENCE: "" }, { CLOUDFLARE_ACCESS_AUDIENCE: "  " },
    ...["http://example.invalid", "https://user:pass@example.invalid", `${access.issuer}/path`, `${access.issuer}?x=1`].map(issuer => ({ CLOUDFLARE_ACCESS_ISSUER: issuer })),
  ]) assert.throws(() => readRuntimeConfig({ ...valid, ...changes }));
  assert.throws(() => readRuntimeConfig({ ...valid, AUTH_PROVIDER: "none" }));
  assert.throws(() => readRuntimeConfig({ ...base, CLOUDFLARE_ACCESS_ISSUER: access.issuer }));
});

test("public probes bypass Access and invalid authentication never reaches identity storage", async t => {
  const { verifier } = await accessFixture();
  let calls = 0;
  const server = createProbeServer(async () => true, { verifier: { verify: async request => { calls++; return verifier.verify(request); } }, identities: {
    getIdentity: async () => assert.fail("unexpected identity lookup"), resolveActiveMembership: async () => assert.fail("unexpected membership lookup"),
  } });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ["health", "ready"]) assert.equal((await fetch(`${base}/${path}`)).status, 200);
  assert.equal(calls, 0);
  const response = await fetch(`${base}/operator/context`, { headers: { "cf-access-jwt-assertion": "bad" } });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { status: "unauthenticated" });
});
