import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { normalizeProspectingInput, validateProspectingFixture, prospectingCacheIdentity,
  prospectingResultFingerprint, prospectingFreshness, requestFingerprint, labFingerprint } from "../dist/index.js";

const cases = JSON.parse(readFileSync(new URL("../../../evals/prospecting/fixtures.json", import.meta.url), "utf8"));
const get = id => structuredClone(cases.find(c => c.labCase.caseId === id));
const output = id => validateProspectingFixture(get(id)).fixture.output;
const rejects = (id, mutate) => { const c = get(id); mutate(c); assert.throws(() => validateProspectingFixture(c)); };
const source = ["../../contracts/src/prospecting.ts", "../src/prospecting-capability.ts"].map(p => readFileSync(new URL(p, import.meta.url), "utf8")).join("\n");

test("Q1 golden 01: search PRESENT preserves provenance", () => {
  const e = output("search-present").evidence[0];
  assert.equal(e.sourceRef, "https://example.com/source/0");
  assert.equal(e.provider, "synthetic-q1");
  assert.equal(e.observedAt, null);
  rejects("search-present", c => { c.fixture.output.evidence[0].sourceRef = ""; });
});
test("Q1 golden 02: bounded empty is not universal absence", () => {
  assert.equal(validateProspectingFixture(get("search-bounded-empty")).fixture.resultState, "EMPTY_WITHIN_RESPONSE");
  assert.deepEqual(output("search-bounded-empty").gaps, ["universal absence unproven"]);
});
test("Q1 golden 03: UNKNOWN remains distinct from empty", () => {
  assert.equal(validateProspectingFixture(get("search-unknown")).fixture.resultState, "UNKNOWN");
  assert.notEqual(prospectingResultFingerprint(get("search-unknown")), prospectingResultFingerprint(get("search-bounded-empty")));
  rejects("search-unknown", c => { c.fixture.resultState = "PRESENT"; });
});
test("Q1 golden 04: extraction PARTIAL retains missing fields", () => {
  assert.deepEqual(output("extract-partial").gaps, ["address missing"]);
  assert.deepEqual(output("extract-partial").evidence.map(e => e.field), ["services"]);
});
test("Q1 golden 05: extraction ERROR cannot produce facts", () => {
  assert.deepEqual(output("extract-error").evidence, []);
  rejects("extract-error", c => { c.fixture.output.evidence = output("extract-partial").evidence; c.fixture.provenanceComplete = true; });
});
test("Q1 golden 06: company discovery is candidate-only", () => {
  assert.equal(output("company-candidate").authority, "EVIDENCE_CANDIDATE");
  rejects("company-candidate", c => { c.fixture.output.authority = "ACCEPTED_ACCOUNT"; });
});
test("Q1 golden 07: public profile is low-authority indexed evidence", () => {
  assert.equal(output("public-profile").evidence[0].method, "PUBLIC_INDEX");
  assert.deepEqual(output("public-profile").gaps, ["employment unverified"]);
  rejects("public-profile", c => { c.fixture.output.evidence[0].field = "verifiedEmployment"; });
});
test("Q1 golden 08: profile cannot claim connection or authenticated state", () => {
  for (const field of ["connectionDegree", "authenticated", "connectionStatus", "relationshipDegree", "currentEmployment"]) {
    rejects("public-profile", c => { c.fixture.output.evidence[0].field = field; });
  }
  rejects("public-profile", c => { c.fixture.output.evidence[0].method = "AUTHENTICATED_LINKEDIN"; });
});
test("Q1 golden 09: buyer PARTIAL preserves BuyerRole gaps", () => {
  assert.equal(get("buyer-partial").fixture.resultState, "PARTIAL");
  assert.deepEqual(output("buyer-partial").gaps, ["BuyerRole unaccepted"]);
});
test("Q1 golden 10: enrichment has distinct field provenance and freshness", () => {
  const [a, b] = output("enrich-fields").evidence;
  assert.notEqual(a.sourceRef, b.sourceRef);
  assert.equal(a.observedAt, null);
  assert.equal(b.observedAt, "2026-09-29T12:00:00.000Z");
});
test("Q1 golden 11: finding produces UNVERIFIED email candidate", () => {
  assert.equal(output("generated-email").emailCandidate.state, "UNVERIFIED");
  rejects("generated-email", c => { c.fixture.output.emailCandidate.method = "PUBLISHED"; });
});
test("Q1 golden 12: pattern cannot verify deliverability", () => {
  rejects("generated-email", c => { c.fixture.output.emailCandidate.state = "VERIFIED"; });
  rejects("generated-email", c => { c.fixture.output.verification = output("mailbox-proof").verification; });
});
test("Q1 golden 13: VERIFIED requires attributable matching mailbox proof", () => {
  assert.equal(output("mailbox-proof").verification.state, "VERIFIED");
  rejects("mailbox-proof", c => { c.fixture.output.evidence = []; c.fixture.provenanceComplete = false; });
  rejects("mailbox-proof", c => { c.fixture.output.evidence[0].value = "other@example.com"; });
  rejects("mailbox-proof", c => { c.fixture.output.verification.evidenceRef = "https://example.com/unrelated"; });
});
test("Q1 golden 14: MX, syntax and domain never verify a mailbox", () => {
  for (const id of ["mx-only", "syntax-only", "domain-only"]) {
    assert.equal(output(id).verification.state, "UNKNOWN");
    rejects(id, c => { c.fixture.output.verification.state = "VERIFIED"; });
    rejects(id, c => { c.fixture.resultState = "PRESENT"; });
  }
});
test("Q1 golden 15: CATCH_ALL is distinct from UNKNOWN", () => {
  assert.equal(output("catch-all").verification.state, "CATCH_ALL");
  rejects("catch-all", c => { c.fixture.output.verification.state = "VERIFIED"; });
});
test("Q1 golden 16: unavailable and service errors stay unresolved", () => {
  assert.equal(output("unavailable").verification.state, "UNKNOWN");
  assert.equal(output("service-error").verification.state, "ERROR");
  for (const id of ["unavailable", "service-error"]) {
    rejects(id, c => { c.fixture.resultState = "PRESENT"; });
    rejects(id, c => { c.fixture.output.verification.state = "VERIFIED"; });
  }
});
test("Q1 golden 17: unknown Employment is not promoted", () => {
  assert.deepEqual(output("employment-unknown").evidence, []);
  rejects("employment-unknown", c => { c.fixture.resultState = "PRESENT"; });
});
test("Q1 golden 18: conflicting Employment evidence remains visible and PARTIAL", () => {
  const o = output("employment-conflict");
  assert.notEqual(o.evidence[0].value, o.evidence[1].value);
  assert.match(o.gaps[0], /conflict/);
  rejects("employment-conflict", c => { c.fixture.resultState = "PRESENT"; c.fixture.output.gaps = []; c.expectedEvidenceGaps = []; });
});
test("Q1 golden 19: procurement PRESENT has source attribution", () => {
  assert.equal(output("procurement-present").evidence[0].sourceRef, "https://example.com/source/0");
  rejects("procurement-present", c => { c.fixture.output.evidence[0].sourceRef = ""; });
});
test("Q1 golden 20: missing procurement source cannot invent route", () => {
  assert.deepEqual(output("procurement-unsourced").evidence, []);
  rejects("procurement-unsourced", c => { c.fixture.resultState = "PRESENT"; });
});
test("Q1 golden 21: changed material input changes existing request identity", () => {
  const c = get("search-present"), changed = get("search-present");
  changed.labCase.normalizedInput.query = "another synthetic query";
  assert.notEqual(prospectingCacheIdentity(c), prospectingCacheIdentity(changed));
  assert.equal(prospectingCacheIdentity(c), requestFingerprint(c.labCase));
});
test("Q1 golden 22: equivalent JSON order is fingerprint stable", () => {
  const c = get("search-present"), changed = get("search-present");
  changed.labCase.normalizedInput = Object.fromEntries(Object.entries(c.labCase.normalizedInput).reverse());
  assert.equal(prospectingCacheIdentity(c), prospectingCacheIdentity(changed));
  assert.equal(prospectingResultFingerprint(c), labFingerprint(c.fixture));
});
test("Q1 golden 23: credential/session/cookie-like input keys fail closed", () => {
  for (const key of ["api_key", "access_token", "credentials", "session", "cookie", "password", "authorization", "li_at"]) {
    assert.throws(() => normalizeProspectingInput("SEARCH_WEB", { ...get("search-present").labCase.normalizedInput, [key]: "synthetic-redacted" }));
    assert.throws(() => normalizeProspectingInput("SEARCH_WEB", { query: { nested: { [key]: "synthetic-redacted" } } }));
  }
});
test("Q1 golden 24: every Q1 case is READ-only", () => {
  for (const c of cases) {
    assert.equal(validateProspectingFixture(c).labCase.accessClass, "READ");
    rejects(c.labCase.caseId, x => { x.labCase.accessClass = "WRITE"; });
  }
});
test("Q1 golden 25: Q1 runtime source has no network/provider execution", () => {
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(m => m[1]);
  assert.deepEqual(imports, ["./research.js", "@drowk/contracts", "./capability-lab.js"]);
  assert.doesNotMatch(source, /\b(fetch|axios|XMLHttpRequest|WebSocket|require|import|eval|Function|exec|spawn)\s*\(/);
  assert.doesNotMatch(source, /node:(http|https|net|dns|tls|child_process)|smtp|MCPClient|ProviderClient/i);
});
test("Q1 golden 26: no session/cookie/browser automation in Q1 runtime", () => {
  assert.doesNotMatch(source, /li_at|cookie|session|playwright|puppeteer|selenium|SalesNavigator|captcha|InMail/i);
});
test("Q1 golden 27: no live capability promotion", () => {
  assert.doesNotMatch(source, /LIVE_VALIDATED_CAPABILITY/);
  rejects("search-present", c => { c.fixture.capabilityState = "LIVE_VALIDATED_CAPABILITY"; });
});
test("Q1 golden 28: no universal score, winner or ranking", () => {
  assert.doesNotMatch(source, /universalScore|globalScore|winner|ranking/i);
  rejects("search-present", c => { c.fixture.output.globalScore = 100; });
});
test("Q1 golden 29: no canonical CRM mutation or ID invention", () => {
  assert.doesNotMatch(source, /INSERT INTO|UPDATE .* SET|DELETE FROM|@drowk\/db|Repository|\.query\s*\(/i);
  for (const field of ["accountId", "personId", "employmentId", "buyerRoleId", "procurementRouteId", "facilityId"]) {
    rejects("company-candidate", c => { c.fixture.output.evidence[0].field = field; });
  }
});
test("Q1 golden 30: deterministic, synthetic fixtures cover ten cells", () => {
  assert.equal(new Set(cases.map(c => c.labCase.capabilityId)).size, 10);
  assert.equal(new Set(cases.map(c => c.labCase.caseId)).size, cases.length);
  for (const c of cases) {
    const before = structuredClone(c);
    assert.deepEqual(validateProspectingFixture(c), validateProspectingFixture(structuredClone(c)));
    assert.deepEqual(c, before);
    assert.equal(c.labCase.provider, "synthetic-q1");
    assert.equal(c.labCase.rightsClass, "SYNTHETIC_ALLOWED");
    for (const value of JSON.stringify(c).matchAll(/https?:\/\/([^/"\s]+)/g)) assert.equal(value[1], "example.com");
    for (const value of JSON.stringify(c).matchAll(/[\w.+-]+@([\w.-]+)/g)) assert.equal(value[1], "example.com");
  }
});

test("Q1 additional: required inputs, arrays, bounds, disambiguation and URL shape", () => {
  for (const c of cases) {
    assert.doesNotThrow(() => normalizeProspectingInput(c.labCase.capabilityId, c.labCase.normalizedInput));
    assert.throws(() => normalizeProspectingInput(c.labCase.capabilityId, {}));
  }
  for (const input of [{ fullName: "Example Person" }, { fullName: "Example Person", titleHint: "" }]) {
    assert.throws(() => normalizeProspectingInput("DISCOVER_PUBLIC_PROFESSIONAL_PROFILE", input));
  }
  for (const maxResults of [0, -1, 101, 1.5]) assert.throws(() => normalizeProspectingInput("SEARCH_WEB", { ...get("search-present").labCase.normalizedInput, maxResults }));
  for (const url of ["/relative", "file:///example", "https://user:pass@example.com"]) assert.throws(() => normalizeProspectingInput("EXTRACT_WEB_PAGE", { url, extractionGoal: "synthetic" }));
  rejects("buyer-partial", c => { c.labCase.normalizedInput.roleTerms = []; });
  rejects("enrich-fields", c => { c.labCase.normalizedInput.fields = []; });
});
test("Q1 additional: PENDING, cost-known and elapsed budgets reuse 05A semantics", () => {
  assert.equal(validateProspectingFixture(get("search-pending")).fixture.resultState, "PENDING");
  assert.deepEqual(output("search-pending").evidence, []);
  rejects("search-present", c => { c.fixture.actualCostKnown = true; });
  rejects("search-present", c => { c.fixture.actualCostUsdMicros = 0; });
  rejects("search-present", c => { c.fixture.latencyMs = 1001; });
  rejects("search-present", c => { c.fixture.estimatedCostUsdMicros = 11; });
  rejects("search-present", c => { c.labCase.maxToolCalls = -1; });
  const c = get("search-present"); c.fixture.actualCostKnown = true; c.fixture.actualCostUsdMicros = 0;
  assert.equal(validateProspectingFixture(c).fixture.actualCostUsdMicros, 0);
});
test("Q1 additional: result changes affect fingerprint; unknown source time stays unknown", () => {
  const c = get("search-present"), changed = get("search-present");
  changed.fixture.output.evidence[0].value = "Changed synthetic snippet";
  assert.notEqual(prospectingResultFingerprint(c), prospectingResultFingerprint(changed));
  assert.equal(prospectingFreshness(c, "2026-09-30T12:00:00.000Z"), "UNKNOWN");
  c.fixture.observedAt = "2026-09-30T12:00:00.000Z";
  assert.equal(prospectingFreshness(c, "2026-09-30T12:30:00.000Z"), "FRESH");
  assert.equal(prospectingFreshness(c, "2026-09-30T14:00:00.000Z"), "STALE");
  assert.equal(prospectingFreshness(c, "2026-09-30T11:00:00.000Z"), "UNKNOWN");
});
