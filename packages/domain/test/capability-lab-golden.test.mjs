import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  labFingerprint, normalizeLabJson, requestFingerprint, syntheticStopState,
  validateLabCase, validateSyntheticFixture,
} from "../dist/index.js";

const labCase = () => ({
  caseId: "synthetic-1", capabilityId: "SEARCH_WEB", workloadCell: "web-search:us",
  provider: "synthetic-alpha", operation: "search", interface: "OTHER",
  accessClass: "READ", normalizedInput: { term: "example", filters: { b: 2, a: 1 } },
  locale: "en-US", geography: "US", maxCostUsdMicros: 10,
  maxToolCalls: 2, stopCondition: "EVIDENCE_PRESENT",
  rightsClass: "SYNTHETIC_ALLOWED", adapterVersion: "test-v1",
});
const fixture = () => ({
  resultState: "PRESENT", output: { synthetic: true },
  estimatedCostUsdMicros: 2, actualCostUsdMicros: null,
  actualCostKnown: false, retrievedAt: "2026-09-28T12:00:00.000Z",
  observedAt: null, latencyMs: 12, provenanceComplete: true,
});

test("goldens 1-5: canonical fingerprints, credential rejection and READ authority", () => {
  assert.equal(requestFingerprint(labCase()), requestFingerprint({ ...labCase(),
    normalizedInput: { filters: { a: 1, b: 2 }, term: "example" } }));
  assert.equal(requestFingerprint(labCase()), requestFingerprint({ ...labCase(),
    caseId: "another-run-case", maxToolCalls: 10 }));
  assert.notEqual(requestFingerprint(labCase()), requestFingerprint({ ...labCase(),
    normalizedInput: { term: "changed" } }));
  assert.notEqual(requestFingerprint(labCase()), requestFingerprint({ ...labCase(),
    adapterVersion: "test-v2" }));
  for (const key of ["apiKey", "access_token", "credential", "password", "sessionCookie"]) {
    assert.throws(() => requestFingerprint({ ...labCase(),
      normalizedInput: { nested: { [key]: "redacted" } } }),
    { code: "CREDENTIAL_FIELD_FORBIDDEN" });
  }
  assert.throws(() => validateLabCase({ ...labCase(), accessClass: "WRITE" }),
    { code: "WRITE_NOT_AUTHORIZED" });
  assert.deepEqual(normalizeLabJson({ z: 1, a: [3, 2] }), { a: [3, 2], z: 1 });
});

test("goldens 7-13: result states and cost-known semantics stay distinct", () => {
  for (const resultState of ["PRESENT", "EMPTY_WITHIN_RESPONSE", "UNKNOWN", "ERROR", "PARTIAL", "PENDING"]) {
    assert.equal(validateSyntheticFixture({ ...fixture(), resultState }).resultState, resultState);
    assert.notEqual(labFingerprint({ resultState }), labFingerprint({ resultState: "OTHER" }));
  }
  assert.equal(validateSyntheticFixture(fixture()).actualCostUsdMicros, null);
  assert.equal(validateSyntheticFixture({ ...fixture(), actualCostUsdMicros: 0,
    actualCostKnown: true }).actualCostUsdMicros, 0);
  for (const bad of [
    { actualCostUsdMicros: 0, actualCostKnown: false },
    { actualCostUsdMicros: null, actualCostKnown: true },
    { actualCostUsdMicros: -1, actualCostKnown: true },
    { estimatedCostUsdMicros: -1 },
  ]) assert.throws(() => validateSyntheticFixture({ ...fixture(), ...bad }));
});

test("goldens 16-17, 21-24: evidence controls stopping; no live or CRM authority", async () => {
  const run = { question: { stopCondition: "EVIDENCE_PRESENT" }, outputEvidenceIds: [] };
  assert.equal(syntheticStopState(run), null);
  assert.equal(syntheticStopState({ ...run, outputEvidenceIds: ["synthetic-evidence"] }), "SUFFICIENT");
  const files = [
    "../src/capability-lab.ts", "../../db/src/capability-lab.ts",
  ];
  const source = (await Promise.all(files.map(file => readFile(new URL(file, import.meta.url), "utf8")))).join("\n");
  assert.doesNotMatch(source, /LIVE_VALIDATED_CAPABILITY|globalScore|winner|ranking/i);
  assert.doesNotMatch(source, /\b(fetch|axios|MCPClient|Gmail|Apollo|LinkedIn|OpenAI)\s*\(/);
  assert.doesNotMatch(source, /\b(INSERT INTO|UPDATE|DELETE FROM)\s+(accounts|facilities|persons|relationships|commitments|work_items)\b/i);
});
