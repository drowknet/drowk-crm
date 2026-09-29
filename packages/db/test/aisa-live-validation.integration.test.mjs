import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { applyMigrations, PostgresCapabilityLabRepository } from "../dist/index.js";
import { executeSelectedBusinessListings, FIRST_CASE_ID,
  BUSINESS_LISTINGS_OPERATION } from "../../../capabilities/aisa/dist/index.js";
import { disposableDatabase } from "./disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
const now = "2026-09-28T12:00:00.000Z";
const selected = () => ({
  caseId: FIRST_CASE_ID, capabilityId: "DISCOVER_BUSINESS_LISTINGS",
  workloadCell: "FACILITY_LOCATION_DISCOVERY", provider: "dataforseo",
  transport: "aisa", operation: BUSINESS_LISTINGS_OPERATION,
  interface: "AISA_REST", accessClass: "READ",
  normalizedInput: { title: "Fastenal", location_coordinate: "33.4484,-112.0740,25", limit: 5 },
  locale: "en-US", geography: "US", maxCostUsdMicros: 15000,
  maxToolCalls: 1, stopCondition: "EVIDENCE_PRESENT",
  rightsClass: "PUBLIC_BUSINESS_LISTING",
  adapterVersion: "aisa-dataforseo-business-listings-v1",
});

pgTest("DCRM-05C claimed fake transport persists only a bounded audit", async t => {
  const { pool } = await disposableDatabase(t);
  await applyMigrations(pool);
  const lab = new PostgresCapabilityLabRepository(pool);
  const tenant = randomUUID(), otherTenant = randomUUID();
  await pool.query("INSERT INTO tenants(id,slug,name) VALUES ($1,$2,'A'),($3,$4,'B')",
    [tenant, `aisa-${tenant}`, otherTenant, `aisa-${otherTenant}`]);
  async function run(extra = {}) {
    const id = randomUUID();
    await lab.createResearchRun(tenant, {
      id, tenantId: tenant, runId: randomUUID(), correlationId: randomUUID(),
      question: { text: "Synthetic pre-live check", entityCandidates: [],
        requiredEvidence: ["listing"], freshnessSeconds: null,
        maxCostUsdMicros: 15000, maxToolCalls: 1,
        allowedCapabilities: ["DISCOVER_BUSINESS_LISTINGS"],
        stopCondition: "EVIDENCE_PRESENT", ...extra },
      status: "PLANNED", outputEvidenceIds: [], startedAt: null, completedAt: null,
    });
    return lab.startResearchRun(tenant, id, now);
  }
  const research = await run();
  await assert.rejects(lab.claimSelectedLiveValidation(otherTenant, research.id,
    selected(), now), { code: "LIVE_RESEARCH_NOT_AUTHORIZED" });
  for (const question of [{ maxCostUsdMicros: 1 }, { maxToolCalls: 0 }]) {
    const bounded = await run(question);
    await assert.rejects(lab.claimSelectedLiveValidation(tenant, bounded.id,
      selected(), now), { code: "LIVE_RESEARCH_NOT_AUTHORIZED" });
    await assert.rejects(pool.query(`UPDATE research_runs SET live_dispatch_claimed_at=$2
      WHERE id=$1`, [bounded.id, now]), { code: "P0001" });
  }
  let calls = 0;
  const secret = randomUUID();
  const provider = await executeSelectedBusinessListings({
    tenantId: tenant, researchRunId: research.id, providerRunId: randomUUID(),
    labCase: selected(), config: { liveValidationEnabled: true, apiKey: secret },
    store: lab, now: () => now,
    transport: { async send(request) {
      calls++;
      assert.equal(request.redirect, "error");
      assert.equal(request.headers.Authorization, `Bearer ${secret}`);
      return { status: 200, body: {
        status_code: 20000, tasks_error: 0, cost: 0.0138,
        tasks: [{ id: "synthetic-task", status_code: 20000, cost: 0.0138,
          result: [{ items: [{ title: "Fastenal", cid: "synthetic-cid",
            feature_id: "synthetic-feature", address: "Public address",
            phone: "forbidden", email: "forbidden@example.invalid" }] }] }],
      } };
    } },
  });
  assert.equal(calls, 1);
  assert.equal(provider.resultState, "PRESENT");
  assert.equal(provider.synthetic, false);
  assert.equal(provider.actualCostUsdMicros, 13800);
  assert.equal(provider.providerTaskId, "synthetic-task");
  assert.equal(provider.providerCid, "synthetic-cid");
  assert.equal(provider.providerFeatureId, "synthetic-feature");
  assert.equal(provider.observedAt, null);
  assert.equal(JSON.stringify(provider).includes(secret), false);
  assert.equal(JSON.stringify(provider).includes("forbidden"), false);
  assert.deepEqual(await lab.getSelectedLiveProviderRun(tenant, provider.id), provider);
  assert.equal(await lab.getSelectedLiveProviderRun(otherTenant, provider.id), null);
  assert.equal((await lab.getResearchRun(tenant, research.id)).status, "EXHAUSTED");
  await assert.rejects(lab.claimSelectedLiveValidation(tenant, research.id, selected(), now));
  await assert.rejects(pool.query("UPDATE provider_runs SET result_state='ERROR' WHERE id=$1",
    [provider.id]), { code: "P0001" });
  for (const table of ["accounts", "facilities", "persons", "relationships",
    "commitments", "work_items"]) {
    assert.equal((await pool.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n, 0);
  }

  const repositoryRun = await run();
  await lab.claimSelectedLiveValidation(tenant, repositoryRun.id, selected(), now);
  const unsafeSummary = { businesses: [{ title: "Public", address: { phone: "private" } }] };
  await assert.rejects(lab.appendClaimedLiveResult(tenant, repositoryRun.id, {
    id: randomUUID(), labCase: selected(), requestFingerprint: provider.requestFingerprint,
    responseFingerprint: provider.responseFingerprint, resultState: "PRESENT",
    estimatedCostUsdMicros: 13800, actualCostUsdMicros: null, actualCostKnown: false,
    retrievedAt: now, observedAt: null, latencyMs: 1, provenanceComplete: true,
    providerTaskId: "synthetic-task-2", providerCid: null, providerFeatureId: null,
    safeSummary: unsafeSummary, safeStatusCodes: null, safeErrorCategory: null,
  }), { code: "UNSAFE_LIVE_SUMMARY" });

  const sqlRun = await run();
  await lab.claimSelectedLiveValidation(tenant, sqlRun.id, selected(), now);
  await assert.rejects(pool.query(`INSERT INTO provider_runs
    (id,tenant_id,run_id,correlation_id,research_run_id,case_id,workload_cell,
     adapter_version,normalized_input,lab_case,latency_ms,provenance_complete,synthetic,
     capability,provider,operation,interface,access_class,request_fingerprint,
     response_fingerprint,result_state,estimated_cost_usd_micros,actual_cost_usd_micros,
     actual_cost_known,retrieved_at,observed_at,rights_class,transport,provider_task_id,
     provider_cid,provider_feature_id,safe_summary,safe_status_codes,safe_error_category)
    SELECT $2,p.tenant_id,r.run_id,r.correlation_id,$3,p.case_id,p.workload_cell,
      p.adapter_version,p.normalized_input,p.lab_case,p.latency_ms,p.provenance_complete,
      p.synthetic,p.capability,p.provider,p.operation,p.interface,p.access_class,
      p.request_fingerprint,p.response_fingerprint,p.result_state,p.estimated_cost_usd_micros,
      p.actual_cost_usd_micros,p.actual_cost_known,p.retrieved_at,p.observed_at,p.rights_class,
      p.transport,p.provider_task_id,p.provider_cid,p.provider_feature_id,$4::jsonb,
      p.safe_status_codes,p.safe_error_category
    FROM provider_runs p JOIN research_runs r ON r.id=$3 WHERE p.id=$1`,
    [provider.id, randomUUID(), sqlRun.id, JSON.stringify(unsafeSummary)]), { code: "P0001" });
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM provider_runs WHERE research_run_id=$1",
    [sqlRun.id])).rows[0].n, 0);
});
