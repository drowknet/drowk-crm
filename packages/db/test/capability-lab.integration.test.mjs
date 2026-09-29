import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { applyMigrations, PostgresCapabilityLabRepository } from "../dist/index.js";
import { disposableDatabase } from "./disposable.mjs";

const pgTest = process.env.DROWK_TEST_DATABASE_URL ? test : test.skip;
pgTest("DCRM-05A synthetic Capability Lab goldens", async t => {
  const { pool } = await disposableDatabase(t);
  await applyMigrations(pool);
  const lab = new PostgresCapabilityLabRepository(pool);
  const tenantA = randomUUID(), tenantB = randomUUID();
  const now = "2026-09-28T12:00:00.000Z";
  await pool.query(`INSERT INTO tenants (id,slug,name) VALUES
    ($1,$2,'Synthetic A'),($3,$4,'Synthetic B')`,
  [tenantA, `lab-${tenantA}`, tenantB, `lab-${tenantB}`]);
  const makeCase = (extra = {}) => ({
    caseId: randomUUID(), capabilityId: "SEARCH_WEB", workloadCell: "search:us",
    provider: "synthetic-alpha", operation: "search", interface: "OTHER",
    accessClass: "READ", normalizedInput: { query: "synthetic example" },
    locale: "en-US", geography: "US", maxCostUsdMicros: 20,
    maxToolCalls: 20, stopCondition: "EVIDENCE_PRESENT",
    rightsClass: "SYNTHETIC_ALLOWED", adapterVersion: "fixture-v1", ...extra,
  });
  const makeFixture = (extra = {}) => ({
    resultState: "PRESENT", output: { synthetic: true },
    estimatedCostUsdMicros: 2, actualCostUsdMicros: null, actualCostKnown: false,
    retrievedAt: now, observedAt: null, latencyMs: 12,
    provenanceComplete: true, ...extra,
  });
  async function makeRun(tenantId = tenantA, extra = {}) {
    const question = {
      text: "Synthetic capability check", entityCandidates: [],
      requiredEvidence: ["source claim"], freshnessSeconds: null,
      maxCostUsdMicros: 100, maxToolCalls: 20,
      allowedCapabilities: ["SEARCH_WEB", "ENRICH_PERSON"],
      stopCondition: "EVIDENCE_PRESENT", ...extra,
    };
    const run = await lab.createResearchRun(tenantId, {
      id: randomUUID(), tenantId, runId: randomUUID(), correlationId: randomUUID(),
      question, status: "PLANNED", outputEvidenceIds: [],
      startedAt: null, completedAt: null,
    });
    return lab.startResearchRun(tenantId, run.id, now);
  }
  async function call(run, labCase = makeCase(), fixture = makeFixture(), tenantId = tenantA) {
    return lab.executeSyntheticCase(tenantId, run.id, labCase, fixture, randomUUID());
  }

  await t.test("goldens 4-13, 18: READ records exact result and cost states; SQL is immutable", async () => {
    const run = await makeRun();
    const states = ["PRESENT", "EMPTY_WITHIN_RESPONSE", "UNKNOWN", "ERROR", "PARTIAL"];
    const stored = [];
    for (const [i, state] of states.entries()) {
      const fixture = makeFixture({ resultState: state,
        actualCostKnown: i === 0 || i === 1,
        actualCostUsdMicros: i === 0 ? 3 : i === 1 ? 0 : null });
      const result = await call(run, makeCase(), fixture);
      assert.equal(result.status, "recorded");
      assert.equal(result.providerRun.resultState, state);
      assert.deepEqual(result.output, { synthetic: true });
      stored.push(result.providerRun);
    }
    assert.equal(stored[2].actualCostKnown, false);
    assert.equal(stored[2].actualCostUsdMicros, null);
    assert.equal(stored[1].actualCostKnown, true);
    assert.equal(stored[1].actualCostUsdMicros, 0);
    assert.equal(stored[0].estimatedCostUsdMicros, 2);
    assert.equal(stored[0].actualCostUsdMicros, 3);
    assert.equal(stored[0].synthetic, true);
    assert.equal(stored[0].accessClass, "READ");
    assert.deepEqual(await lab.getProviderRun(tenantA, stored[0].id), stored[0]);
    assert.equal((await lab.listProviderRuns(tenantA, run.id)).length, 5);
    assert.equal(await lab.getProviderRun(tenantB, stored[0].id), null);
    await assert.rejects(pool.query(`UPDATE provider_runs SET result_state='UNKNOWN' WHERE id=$1`,
      [stored[0].id]), { code: "P0001" });
    await assert.rejects(pool.query(`DELETE FROM provider_runs WHERE id=$1`,
      [stored[0].id]), { code: "P0001" });
    await assert.rejects(pool.query(`INSERT INTO provider_runs
      (id,tenant_id,run_id,correlation_id,capability,provider,operation,interface,
       access_class,request_fingerprint,result_state,estimated_cost_usd_micros,
       actual_cost_usd_micros,actual_cost_known,retrieved_at)
      VALUES ($1,$2,$3,$4,'SEARCH_WEB','synthetic','search','OTHER',
       'READ','sha256:test','PRESENT',-1,NULL,false,$5)`,
    [randomUUID(), tenantA, randomUUID(), randomUUID(), now]), { code: "23514" });
    await assert.rejects(pool.query(`INSERT INTO provider_runs
      (id,tenant_id,run_id,correlation_id,capability,provider,operation,interface,
       access_class,request_fingerprint,result_state,estimated_cost_usd_micros,
       actual_cost_usd_micros,actual_cost_known,retrieved_at)
      VALUES ($1,$2,$3,$4,'SEARCH_WEB','synthetic','search','OTHER',
       'READ','sha256:test','PRESENT',0,0,false,$5)`,
    [randomUUID(), tenantA, randomUUID(), randomUUID(), now]), { code: "23514" });
    await assert.rejects(pool.query(`UPDATE research_runs SET status='SUFFICIENT'
      WHERE id=$1`, [run.id]), { code: "P0001" });
    await assert.rejects(pool.query(`UPDATE research_runs
      SET status='SUFFICIENT',output_evidence_ids=$2::jsonb WHERE id=$1`,
    [run.id, JSON.stringify([randomUUID()])]), { code: "P0001" });
    await assert.rejects(pool.query(`DELETE FROM research_runs WHERE id=$1`,
      [run.id]), { code: "P0001" });
    await assert.rejects(pool.query(`INSERT INTO research_runs
      (id,tenant_id,run_id,correlation_id,question,question_contract,status,
       output_evidence_ids)
      VALUES ($1,$2,$3,$4,'synthetic','{}'::jsonb,'SUFFICIENT',$5::jsonb)`,
    [randomUUID(), tenantA, randomUUID(), randomUUID(), JSON.stringify([randomUUID()])]),
    { code: "P0001" });
  });

  await t.test("goldens 5, 14-17: WRITE, rights and bounded stopping fail closed", async () => {
    const run = await makeRun();
    await assert.rejects(call(run, makeCase({ accessClass: "WRITE" })),
      { code: "WRITE_NOT_AUTHORIZED" });
    assert.equal((await lab.listProviderRuns(tenantA, run.id)).length, 0);
    const rights = await call(run, makeCase({ rightsClass: "RIGHTS_BLOCKED" }));
    assert.equal(rights.status, "stopped");
    assert.equal(rights.researchRun.status, "BLOCKED");
    assert.equal(rights.providerRun, null);
    const costRun = await makeRun(tenantA, { maxCostUsdMicros: 1 });
    const cost = await call(costRun);
    assert.equal(cost.status, "stopped");
    assert.equal(cost.researchRun.status, "EXHAUSTED");
    const callsRun = await makeRun(tenantA, { maxToolCalls: 1 });
    const first = await call(callsRun);
    assert.equal(first.status, "recorded");
    assert.equal(first.researchRun.status, "EXHAUSTED");
    assert.equal((await lab.listProviderRuns(tenantA, callsRun.id)).length, 1);
    await assert.rejects(call(callsRun), { code: "RESEARCH_NOT_RUNNING" });
    const noCalls = await makeRun(tenantA, { maxToolCalls: 0 });
    assert.equal((await call(noCalls)).researchRun.status, "EXHAUSTED");
    const caseBound = await makeRun();
    assert.equal((await call(caseBound, makeCase({ maxToolCalls: 0 }))).researchRun.status,
      "EXHAUSTED");
    const caseCost = await makeRun();
    assert.equal((await call(caseCost, makeCase({ maxCostUsdMicros: 1 }))).researchRun.status,
      "BLOCKED");
    const unknownPrice = await makeRun();
    const blocked = await call(unknownPrice, makeCase(),
      makeFixture({ estimatedCostUsdMicros: null }));
    assert.equal(blocked.researchRun.status, "BLOCKED");
    const noEvidence = await makeRun(tenantA, { maxToolCalls: 1 });
    assert.equal((await call(noEvidence)).researchRun.status, "EXHAUSTED");
    await assert.rejects(lab.attachEvidenceAndStop(tenantA, noEvidence.id, [], now),
      { code: "EVIDENCE_REQUIRED" });
    const failed = await makeRun();
    assert.equal((await lab.failResearchRun(tenantA, failed.id, now)).status, "FAILED");
    await assert.rejects(call(failed), { code: "RESEARCH_NOT_RUNNING" });
  });

  await t.test("golden 16: existing tenant Evidence can stop as SUFFICIENT without calls", async () => {
    const run = await makeRun();
    const observationId = randomUUID(), evidenceId = randomUUID();
    await pool.query(`INSERT INTO source_observations
      (id,tenant_id,run_id,correlation_id,source_system,source_native_id,
       retrieved_at,ingested_at,adapter_version,fingerprint)
      VALUES ($1,$2,$3,$4,'SYNTHETIC',$5,$6,$6,'fixture-v1','sha256:test')`,
    [observationId, tenantA, randomUUID(), randomUUID(), randomUUID(), now]);
    await pool.query(`INSERT INTO evidence
      (id,tenant_id,run_id,correlation_id,observation_id,subject_entity_type,
       claim,value_json,trust_state)
      VALUES ($1,$2,$3,$4,$5,'LAB','synthetic claim','{}'::jsonb,'CLAIMED')`,
    [evidenceId, tenantA, randomUUID(), randomUUID(), observationId]);
    await assert.rejects(lab.attachEvidenceAndStop(tenantB, run.id, [evidenceId], now),
      { code: "RESEARCH_NOT_RUNNING" });
    await assert.rejects(lab.attachEvidenceAndStop(tenantA, run.id, [randomUUID()], now),
      { code: "EVIDENCE_NOT_FOUND" });
    const sufficient = await lab.attachEvidenceAndStop(tenantA, run.id, [evidenceId], now);
    assert.equal(sufficient.status, "SUFFICIENT");
    assert.deepEqual(sufficient.outputEvidenceIds, [evidenceId]);
    assert.equal((await lab.listProviderRuns(tenantA, run.id)).length, 0);
    await assert.rejects(call(run), { code: "RESEARCH_NOT_RUNNING" });
  });

  await t.test("goldens 19-23: capability-cell facts stay provider and workload specific", async () => {
    const run = await makeRun();
    const cell = "search:comparison";
    await call(run, makeCase({ provider: "alpha", workloadCell: cell }), makeFixture({
      resultState: "PRESENT", observedAt: now, actualCostKnown: true,
      actualCostUsdMicros: 4 }));
    await call(run, makeCase({ provider: "beta", workloadCell: cell }), makeFixture({
      resultState: "UNKNOWN", provenanceComplete: false }));
    await call(run, makeCase({ provider: "alpha", workloadCell: "search:eu" }),
      makeFixture({ resultState: "EMPTY_WITHIN_RESPONSE" }));
    await call(run, makeCase({ provider: "alpha", capabilityId: "ENRICH_PERSON",
      workloadCell: "person:us" }), makeFixture({ resultState: "PARTIAL" }));
    const us = await lab.evaluateCapabilityCell(tenantA, "SEARCH_WEB", cell);
    assert.deepEqual(us.map(x => x.provider), ["alpha", "beta"]);
    assert.equal(us[0].resultStateCounts.PRESENT, 1);
    assert.equal(us[0].knownActualCostUsdMicros, 4);
    assert.equal(us[0].actualCostKnownCount, 1);
    assert.equal(us[0].observedAtKnownCount, 1);
    assert.equal(us[0].provenanceCompleteCount, 1);
    assert.deepEqual({ ...us[0].rightsClassCounts }, { SYNTHETIC_ALLOWED: 1 });
    assert.equal(us[1].resultStateCounts.UNKNOWN, 1);
    assert.equal(us[1].actualCostKnownCount, 0);
    assert.equal(us[1].knownActualCostUsdMicros, 0);
    assert.equal((await lab.evaluateCapabilityCell(tenantA,
      "SEARCH_WEB", "search:eu"))[0].resultStateCounts.EMPTY_WITHIN_RESPONSE, 1);
    assert.equal((await lab.evaluateCapabilityCell(tenantA,
      "ENRICH_PERSON", "person:us"))[0].resultStateCounts.PARTIAL, 1);
    assert.deepEqual(await lab.evaluateCapabilityCell(tenantB, "SEARCH_WEB", cell), []);
    assert.equal("score" in us[0], false);
    assert.equal("winner" in us[0], false);
    const crm = (await pool.query(`SELECT
      (SELECT count(*)::int FROM accounts) AS accounts,
      (SELECT count(*)::int FROM persons) AS persons,
      (SELECT count(*)::int FROM relationships) AS relationships,
      (SELECT count(*)::int FROM commitments) AS commitments,
      (SELECT count(*)::int FROM work_items) AS work_items`)).rows[0];
    assert.deepEqual(crm, { accounts: 0, persons: 0, relationships: 0,
      commitments: 0, work_items: 0 });
  });

  await t.test("PR #14: direct SQL synthetic inserts require a complete bounded 05A parent", async () => {
    async function sqlParent(contract) {
      const parent = { id: randomUUID(), runId: randomUUID(), correlationId: randomUUID() };
      await pool.query(`INSERT INTO research_runs
        (id,tenant_id,run_id,correlation_id,question,question_contract,status)
        VALUES ($1,$2,$3,$4,'Legacy synthetic',$5::jsonb,'PLANNED')`,
      [parent.id, tenantA, parent.runId, parent.correlationId, JSON.stringify(contract)]);
      await pool.query(`UPDATE research_runs SET status='RUNNING',started_at=$2 WHERE id=$1`,
        [parent.id, now]);
      return parent;
    }
    async function sqlProvider(parent, extra = {}) {
      const id = randomUUID();
      const result = await pool.query(`INSERT INTO provider_runs
        (id,tenant_id,run_id,correlation_id,research_run_id,case_id,workload_cell,
         adapter_version,normalized_input,lab_case,synthetic,capability,provider,
         operation,interface,access_class,request_fingerprint,result_state,
         estimated_cost_usd_micros,actual_cost_usd_micros,actual_cost_known,retrieved_at)
        VALUES ($1,$2,$3,$4,$5,'synthetic-case','search:us','fixture-v1',
          '{}'::jsonb,'{}'::jsonb,true,'SEARCH_WEB','synthetic-alpha','search',
          'OTHER','READ','sha256:synthetic','PRESENT',$6,$7,$8,$9)
        RETURNING id,actual_cost_usd_micros,actual_cost_known`,
      [id, extra.tenantId ?? tenantA, extra.runId ?? parent.runId,
        extra.correlationId ?? parent.correlationId, parent.id,
        extra.estimated ?? 2, extra.actual ?? null, extra.actualKnown ?? false, now]);
      return result.rows[0];
    }
    const valid = { maxCostUsdMicros: 2, maxToolCalls: 1,
      stopCondition: "EVIDENCE_PRESENT" };
    for (const [label, contract] of [
      ["empty legacy contract", {}],
      ["missing max cost", { maxToolCalls: 1, stopCondition: "EVIDENCE_PRESENT" }],
      ["missing max calls", { maxCostUsdMicros: 2, stopCondition: "EVIDENCE_PRESENT" }],
      ["null max cost", { ...valid, maxCostUsdMicros: null }],
      ["string max cost", { ...valid, maxCostUsdMicros: "2" }],
      ["fractional max cost", { ...valid, maxCostUsdMicros: 1.5 }],
      ["negative max cost", { ...valid, maxCostUsdMicros: -1 }],
      ["unsafe max cost", { ...valid, maxCostUsdMicros: 9007199254740992 }],
      ["null max calls", { ...valid, maxToolCalls: null }],
      ["string max calls", { ...valid, maxToolCalls: "1" }],
      ["fractional max calls", { ...valid, maxToolCalls: 1.5 }],
      ["negative max calls", { ...valid, maxToolCalls: -1 }],
      ["out-of-range max calls", { ...valid, maxToolCalls: 2147483648 }],
      ["missing stop", { maxCostUsdMicros: 2, maxToolCalls: 1 }],
      ["wrong stop", { ...valid, stopCondition: "ALWAYS" }],
      ["zero max calls", { ...valid, maxToolCalls: 0 }],
      ["insufficient max cost", { ...valid, maxCostUsdMicros: 1 }],
    ]) {
      const parent = await sqlParent(contract);
      await assert.rejects(sqlProvider(parent), { code: "P0001" }, label);
      assert.equal((await pool.query(`SELECT count(*)::int AS n FROM provider_runs
        WHERE research_run_id=$1`, [parent.id])).rows[0].n, 0, label);
    }
    const parent = await sqlParent(valid);
    await assert.rejects(sqlProvider(parent, { runId: randomUUID() }), { code: "P0001" });
    await assert.rejects(sqlProvider(parent, { correlationId: randomUUID() }), { code: "P0001" });
    await assert.rejects(sqlProvider(parent, { tenantId: tenantB }), { code: "P0001" });
    const accepted = await sqlProvider(parent);
    assert.equal(accepted.actual_cost_usd_micros, null);
    assert.equal(accepted.actual_cost_known, false);
    await assert.rejects(sqlProvider(parent), { code: "P0001" });
    const knownZero = await sqlParent(valid);
    const zero = await sqlProvider(knownZero,
      { estimated: 0, actual: 0, actualKnown: true });
    assert.equal(zero.actual_cost_usd_micros, "0");
    assert.equal(zero.actual_cost_known, true);
  });
});
