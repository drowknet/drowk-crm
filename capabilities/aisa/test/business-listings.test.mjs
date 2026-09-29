import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import * as adapterExports from "../dist/index.js";
import {
  AISA_ORIGIN, BUSINESS_LISTINGS_PATH, BUSINESS_LISTINGS_TIMEOUT_MS,
  FIRST_CASE_ID,
  aisaRuntimeConfig, executeSelectedBusinessListings,
  runSelectedBusinessListingsOnce,
  normalizeBusinessListingsCase, normalizeBusinessListingsResponse,
} from "../dist/index.js";

const now = "2026-09-28T12:00:00.000Z";
const selected = (overrides = {}) => ({
  caseId: FIRST_CASE_ID, capabilityId: "DISCOVER_BUSINESS_LISTINGS",
  workloadCell: "FACILITY_LOCATION_DISCOVERY", provider: "dataforseo",
  transport: "aisa", operation: `POST ${BUSINESS_LISTINGS_PATH}`,
  interface: "AISA_REST", accessClass: "READ",
  normalizedInput: { title: "Fastenal", location_coordinate: "33.4484,-112.0740,25", limit: 5 },
  locale: "en-US", geography: "US", maxCostUsdMicros: 15000,
  maxToolCalls: 1, stopCondition: "EVIDENCE_PRESENT",
  rightsClass: "PUBLIC_BUSINESS_LISTING",
  adapterVersion: "aisa-dataforseo-business-listings-v1", ...overrides,
});

test("versioned runner dry-run, disabled and missing-key exits never dispatch", async () => {
  let calls = 0;
  const dry = await runSelectedBusinessListingsOnce({
    mode: "DRY_RUN", tenantId: randomUUID(),
    config: { liveValidationEnabled: false, apiKey: null },
    transport: { async send() { calls++; throw new Error("unexpected"); } },
    now: () => now,
  });
  assert.equal(dry.disposition, "DRY_RUN");
  assert.equal(dry.researchRunId, null);
  assert.equal(calls, 0);
  const baseEnv = { ...process.env, DATABASE_URL: "postgres://invalid.invalid/test",
    DROWK_TENANT_ID: randomUUID(), APP_ENV: "test" };
  delete baseEnv.AISA_API_KEY;
  const cli = fileURLToPath(new URL("../dist/runner-cli.js", import.meta.url));
  const run = env => spawnSync(process.execPath, [cli, "--live"],
    { env, encoding: "utf8", timeout: 3000 });
  const planned = spawnSync(process.execPath, [cli, "--dry-run"],
    { env: baseEnv, encoding: "utf8", timeout: 3000 });
  assert.equal(planned.status, 0);
  assert.equal(JSON.parse(planned.stdout).disposition, "DRY_RUN");
  const disabled = run(baseEnv);
  assert.equal(disabled.status, 1);
  assert.equal(JSON.parse(disabled.stdout).code, "AISA_LIVE_DISABLED");
  const missing = run({ ...baseEnv, DROWK_AISA_LIVE_VALIDATION_ENABLED: "true" });
  assert.equal(missing.status, 1);
  assert.equal(JSON.parse(missing.stdout).code, "AISA_KEY_REQUIRED");
  assert.equal(calls, 0);
});

test("one-shot fake dispatch records once; append loss is UNKNOWN without retry", async () => {
  for (const appendFails of [false, true]) {
    let calls = 0, run, claim = false, marked = false;
    const store = {
      async createResearchRun(_tenant, value) { run = value; return value; },
      async startResearchRun() { run = { ...run, status: "RUNNING" }; return run; },
      async getResearchRun() { return run; },
      async claimSelectedLiveValidation() { claim = true; return run; },
      async appendClaimedLiveResult(_tenant, _id, audit) {
        if (appendFails) throw new Error("synthetic append loss");
        run = { ...run, status: "EXHAUSTED" };
        return audit;
      },
      async getLiveDispatchStatus() { return {
        disposition: !claim ? "UNCLAIMED" : appendFails ? "UNKNOWN" : "RECORDED",
        providerRunId: null,
      }; },
      async markClaimedLiveDispatchUnknown() { marked = true; run = { ...run, status: "BLOCKED" }; },
    };
    const secret = randomUUID();
    const outcome = await runSelectedBusinessListingsOnce({
      mode: "LIVE", tenantId: randomUUID(), store,
      config: { liveValidationEnabled: true, apiKey: secret }, now: () => now,
      transport: { async send() { calls++; return { status: 200, body: response() }; } },
    });
    assert.equal(calls, 1);
    assert.equal(outcome.disposition, appendFails ? "UNKNOWN" : "RECORDED");
    assert.equal(outcome.exitCode, appendFails ? 1 : 0);
    assert.equal(marked, appendFails);
    assert.equal(JSON.stringify(outcome).includes(secret), false);
  }
});
const response = (overrides = {}) => ({
  status_code: 20000, tasks_error: 0, cost: 0.0138,
  tasks: [{ id: "task-synthetic-1", status_code: 20000, cost: 0.0138,
    result: [{ items: [{ title: "Fastenal", category: "Industrial supply",
      address: "123 Public Street, Phoenix, AZ", domain: "example.invalid",
      latitude: 33.45, longitude: -112.07, rating: { value: 4.2 },
      cid: "cid-public-1", feature_id: "feature-public-1",
      phone: "+1-555-0100", email: "person@example.invalid",
      contact_person: "Private Person", social_profile: "private-profile" }] }] }],
  ...overrides,
});
function fake(overrides = {}) {
  let calls = 0;
  const records = [];
  const requests = [];
  const run = { id: randomUUID(), status: "RUNNING", question: {
    maxCostUsdMicros: 15000, maxToolCalls: 1,
    stopCondition: "EVIDENCE_PRESENT", allowedCapabilities: ["DISCOVER_BUSINESS_LISTINGS"],
  }, ...overrides.run };
  const store = {
    async getResearchRun() { return run; },
    async claimSelectedLiveValidation() {
      if (overrides.claimError) throw new Error("LIVE_BUDGET_EXHAUSTED");
      return run;
    },
    async appendClaimedLiveResult(_tenant, _id, record) {
      records.push(record); return record;
    },
  };
  const transport = {
    async send(request) {
      calls++; requests.push(request);
      if (overrides.transportError) throw overrides.transportError;
      return { status: overrides.httpStatus ?? 200,
        body: overrides.body ?? response() };
    },
  };
  const secret = randomUUID();
  const input = { tenantId: randomUUID(), researchRunId: run.id,
    providerRunId: randomUUID(), labCase: selected(),
    config: { liveValidationEnabled: true, apiKey: secret },
    store, transport, now: () => now };
  return { input, records, requests, secret, calls: () => calls };
}

test("pre-dispatch gates 1-10: switch, key, tuple, input and budget stop before transport", async () => {
  assert.equal("createAisaHttpTransport" in adapterExports, false);
  const internal = fake();
  internal.input.config.liveValidationEnabled = false;
  delete internal.input.transport;
  await assert.rejects(executeSelectedBusinessListings(internal.input),
    { code: "AISA_LIVE_DISABLED" });
  for (const mutate of [
    x => { x.config.liveValidationEnabled = false; },
    x => { x.config.apiKey = null; },
    x => { x.labCase.capabilityId = "SEARCH_WEB"; },
    x => { x.labCase.accessClass = "WRITE"; },
    x => { x.labCase.provider = "other"; },
    x => { x.labCase.operation = "POST /other"; },
    x => { x.labCase.normalizedInput.url = "https://unapproved.invalid"; },
    x => { x.labCase.normalizedInput.limit = 6; },
    x => { x.labCase.normalizedInput.apiKey = "credential-like"; },
    x => { x.labCase.apiKey = x.config.apiKey; },
    x => { x.labCase.caseId = x.config.apiKey; },
    x => { x.store.getResearchRun = async () => ({ status: "RUNNING",
      question: { maxCostUsdMicros: 1, maxToolCalls: 1,
        stopCondition: "EVIDENCE_PRESENT", allowedCapabilities: ["DISCOVER_BUSINESS_LISTINGS"] } }); },
    x => { x.store.getResearchRun = async () => ({ status: "EXHAUSTED",
      question: { maxCostUsdMicros: 15000, maxToolCalls: 1,
        stopCondition: "EVIDENCE_PRESENT", allowedCapabilities: ["DISCOVER_BUSINESS_LISTINGS"] } }); },
  ]) {
    const h = fake(); mutate(h.input);
    await assert.rejects(executeSelectedBusinessListings(h.input));
    assert.equal(h.calls(), 0);
    assert.equal(h.records.length, 0);
  }
  const h = fake({ claimError: true });
  await assert.rejects(executeSelectedBusinessListings(h.input));
  assert.equal(h.calls(), 0);
  assert.equal(aisaRuntimeConfig({ AISA_API_KEY: h.secret }).liveValidationEnabled, false);
  assert.equal(aisaRuntimeConfig({ DROWK_AISA_LIVE_VALIDATION_ENABLED: "true",
    AISA_API_KEY: h.secret }).liveValidationEnabled, true);
});

test("PRESENT maps only safe public fields, known cost and namespaced provenance", async () => {
  const h = fake();
  const record = await executeSelectedBusinessListings(h.input);
  assert.equal(h.calls(), 1);
  assert.equal(h.requests[0].url, `${AISA_ORIGIN}${BUSINESS_LISTINGS_PATH}`);
  assert.equal(h.requests[0].redirect, "error");
  assert.equal(h.requests[0].timeoutMs, BUSINESS_LISTINGS_TIMEOUT_MS);
  assert.equal(h.requests[0].headers.Authorization, `Bearer ${h.secret}`);
  assert.deepEqual(JSON.parse(h.requests[0].body), [h.input.labCase.normalizedInput]);
  assert.equal(record.resultState, "PRESENT");
  assert.equal(record.estimatedCostUsdMicros, 13800);
  assert.equal(record.actualCostUsdMicros, 13800);
  assert.equal(record.actualCostKnown, true);
  assert.equal(record.providerTaskId, "task-synthetic-1");
  assert.equal(record.providerCid, "cid-public-1");
  assert.equal(record.providerFeatureId, "feature-public-1");
  assert.equal(record.observedAt, null);
  assert.equal(record.retrievedAt, now);
  assert.equal(record.safeSummary.businesses[0].title, "Fastenal");
  for (const forbidden of ["phone", "email", "contact_person", "social_profile", h.secret]) {
    assert.equal(JSON.stringify(record).includes(forbidden), false);
  }
  assert.equal(record.requestFingerprint.includes(h.secret), false);
  assert.equal(record.responseFingerprint.includes(h.secret), false);
  const other = fake();
  const second = await executeSelectedBusinessListings(other.input);
  assert.equal(record.requestFingerprint, second.requestFingerprint);
});

test("empty, unknown cost, known zero and event time retain distinct semantics", () => {
  const empty = normalizeBusinessListingsResponse(200, response({ cost: 0,
    tasks: [{ id: "task-empty", status_code: 20000, cost: 0,
      result: [{ items: [] }] }] }));
  assert.equal(empty.resultState, "EMPTY_WITHIN_RESPONSE");
  assert.equal(empty.actualCostUsdMicros, 0);
  assert.equal(empty.actualCostKnown, true);
  const unknown = normalizeBusinessListingsResponse(200, response({ cost: undefined,
    tasks: [{ id: "task-unknown-cost", status_code: 20000,
      result: [{ items: [] }] }] }));
  assert.equal(unknown.resultState, "EMPTY_WITHIN_RESPONSE");
  assert.equal(unknown.actualCostUsdMicros, null);
  assert.equal(unknown.actualCostKnown, false);
  assert.equal(unknown.observedAt, null);
  const explicit = normalizeBusinessListingsResponse(200, response({
    tasks: [{ id: "task-explicit", status_code: 20000, cost: 0.0138,
      observed_at: "2026-09-27T10:00:00Z", result: [{ items: [] }] }],
  }));
  assert.equal(explicit.observedAt, "2026-09-27T10:00:00.000Z");
});

test("HTTP, task, mixed and schema failures remain ERROR; timeout has no retry", async () => {
  for (const [status, category] of [[401, "HTTP_AUTH"], [403, "HTTP_AUTH"],
    [429, "HTTP_RATE"], [500, "HTTP_SERVER"], [503, "HTTP_SERVER"]]) {
    const h = fake({ httpStatus: status, body: { secret: randomUUID() } });
    const record = await executeSelectedBusinessListings(h.input);
    assert.equal(record.resultState, "ERROR");
    assert.equal(record.safeErrorCategory, category);
    assert.equal(h.calls(), 1);
  }
  for (const body of [
    response({ status_code: 50000 }),
    response({ tasks_error: 1 }),
    response({ tasks: [{ id: "task-bad", status_code: 50000,
      result: [{ items: [{ title: "Fastenal", cid: "cid" }] }] }] }),
    response({ tasks: [{ id: "task-mixed", status_code: 20000,
      result: [{ items: [{ title: "Fastenal", cid: "cid" }, { broken: true }] }] }] }),
    { partial: true, items: [{ title: "Fastenal" }] },
  ]) {
    const mapped = normalizeBusinessListingsResponse(200, body);
    assert.equal(mapped.resultState, "ERROR");
    assert.notEqual(mapped.resultState, "PARTIAL");
  }
  const h = fake({ transportError: Object.assign(new Error("no secret text"),
    { name: "AbortError" }) });
  const timeout = await executeSelectedBusinessListings(h.input);
  assert.equal(timeout.resultState, "ERROR");
  assert.equal(timeout.safeErrorCategory, "TIMEOUT");
  assert.equal(h.calls(), 1);
});

test("secret echo is excluded before response hashing; no live call or CRM writer on import", async () => {
  const h = fake({ body: response({ tasks: [{ id: "task-echo", status_code: 20000,
    result: [{ items: [{ title: "Fastenal", cid: "cid", phone: "private" }] }] }] }) });
  const original = h.input.transport.send;
  h.input.transport.send = request => original(request).then(value => ({
    ...value, body: { ...value.body, echoed: h.secret },
  }));
  const record = await executeSelectedBusinessListings(h.input);
  assert.equal(record.resultState, "ERROR");
  assert.equal(JSON.stringify(record).includes(h.secret), false);
  const source = await readFile(new URL("../src/business-listings.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /LIVE_VALIDATED_CAPABILITY|INSERT INTO (?:accounts|facilities|persons|relationships|commitments|work_items)/i);
  assert.doesNotMatch(source, /\b(?:retry|MCPClient|providerSDK)\s*\(/i);
  assert.equal(h.calls(), 1);
});
