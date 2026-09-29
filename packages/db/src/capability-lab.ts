import type {
  CapabilityId, CapabilityLabCase, EvidenceId, IsoDateTime, JsonValue, LiveProviderAuditInput,
  ProviderResultState, ProviderRun, ResearchRun, TenantId, SyntheticCapabilityFixture,
} from "@drowk/contracts";
import {
  CapabilityLabError, labFingerprint, normalizeLabJson, requestFingerprint, syntheticStopState,
  validateLabCase, validateSyntheticFixture,
} from "@drowk/domain";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type ResearchRow = QueryResultRow & {
  id: string; tenant_id: TenantId; run_id: ResearchRun["runId"];
  correlation_id: ResearchRun["correlationId"]; question: string;
  question_contract: ResearchRun["question"]; status: ResearchRun["status"];
  output_evidence_ids: EvidenceId[]; started_at: Date | null; completed_at: Date | null;
  live_dispatch_claimed_at: Date | null;
  live_dispatch_state: "UNKNOWN" | "RECORDED" | null;
};
type ProviderRow = QueryResultRow & {
  id: string; tenant_id: TenantId; run_id: ProviderRun["runId"];
  correlation_id: ProviderRun["correlationId"]; research_run_id: string;
  case_id: string; workload_cell: string; adapter_version: string;
  normalized_input: ProviderRun["normalizedInput"]; lab_case: CapabilityLabCase;
  latency_ms: number | null; provenance_complete: boolean; synthetic: boolean;
  capability: CapabilityId; provider: string; operation: string;
  interface: ProviderRun["interface"]; access_class: ProviderRun["accessClass"];
  request_fingerprint: ProviderRun["requestFingerprint"];
  response_fingerprint: ProviderRun["responseFingerprint"];
  result_state: ProviderResultState; estimated_cost_usd_micros: string | null;
  actual_cost_usd_micros: string | null; actual_cost_known: boolean;
  retrieved_at: Date; observed_at: Date | null; rights_class: string | null;
  transport: string | null; provider_task_id: string | null;
  provider_cid: string | null; provider_feature_id: string | null;
  safe_summary: JsonValue | null; safe_status_codes: JsonValue | null;
  safe_error_category: string | null;
};
const timestampTypes = {
  getTypeParser: (oid: number, format?: "text" | "binary") =>
    oid === 1184 && format !== "binary"
      ? (value: string) => value : pg.types.getTypeParser(oid, format),
};
function query<Row extends QueryResultRow>(connection: Connection, sql: string, values: unknown[]) {
  return connection.query<Row>({ text: sql, values, types: timestampTypes });
}
function iso(value: Date | string | null): IsoDateTime | null {
  return value === null ? null : new Date(value).toISOString() as IsoDateTime;
}
function safeNumber(value: string | null): number | null {
  if (value === null) return null;
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new CapabilityLabError("COST_EXCEEDS_SAFE_INTEGER");
  return number;
}
const researchFrom = (row: ResearchRow): ResearchRun => ({
  id: row.id, tenantId: row.tenant_id, runId: row.run_id,
  correlationId: row.correlation_id, question: row.question_contract,
  status: row.status, outputEvidenceIds: row.output_evidence_ids,
  startedAt: iso(row.started_at), completedAt: iso(row.completed_at),
});
const providerFrom = (row: ProviderRow): ProviderRun => ({
  id: row.id, tenantId: row.tenant_id, runId: row.run_id,
  correlationId: row.correlation_id, researchRunId: row.research_run_id,
  caseId: row.case_id, workloadCell: row.workload_cell,
  adapterVersion: row.adapter_version, normalizedInput: row.normalized_input,
  labCase: row.lab_case, latencyMs: row.latency_ms,
  provenanceComplete: row.provenance_complete, synthetic: row.synthetic,
  capability: row.capability, provider: row.provider, operation: row.operation,
  interface: row.interface, accessClass: row.access_class,
  requestFingerprint: row.request_fingerprint,
  responseFingerprint: row.response_fingerprint, resultState: row.result_state,
  estimatedCostUsdMicros: safeNumber(row.estimated_cost_usd_micros),
  actualCostUsdMicros: safeNumber(row.actual_cost_usd_micros),
  actualCostKnown: row.actual_cost_known,
  retrievedAt: iso(row.retrieved_at)!, observedAt: iso(row.observed_at),
  rightsClass: row.rights_class,
  transport: row.transport, providerTaskId: row.provider_task_id,
  providerCid: row.provider_cid, providerFeatureId: row.provider_feature_id,
  safeSummary: row.safe_summary, safeStatusCodes: row.safe_status_codes,
  safeErrorCategory: row.safe_error_category,
});

const selectedOperation = "POST /apis/v1/dataforseo/business_data/business_listings/search/live";
const selectedInput = { title: "Fastenal", location_coordinate: "33.4484,-112.0740,25", limit: 5 };
function selectedLiveCase(labCase: CapabilityLabCase): boolean {
  const input = labCase.normalizedInput;
  if (input === null || Array.isArray(input) || typeof input !== "object") return false;
  return Object.keys(labCase).sort().join(",") ===
      "accessClass,adapterVersion,capabilityId,caseId,geography,interface,locale,maxCostUsdMicros,maxToolCalls,normalizedInput,operation,provider,rightsClass,stopCondition,transport,workloadCell"
    && labCase.caseId === "dcrm-05c-fastenal-phoenix-1"
    && labCase.capabilityId === "DISCOVER_BUSINESS_LISTINGS"
    && labCase.workloadCell === "FACILITY_LOCATION_DISCOVERY"
    && labCase.provider === "dataforseo" && labCase.transport === "aisa"
    && labCase.operation === selectedOperation && labCase.interface === "AISA_REST"
    && labCase.accessClass === "READ" && labCase.maxCostUsdMicros === 15000
    && labCase.maxToolCalls === 1 && labCase.stopCondition === "EVIDENCE_PRESENT"
    && labCase.adapterVersion === "aisa-dataforseo-business-listings-v1"
    && labCase.rightsClass === "PUBLIC_BUSINESS_LISTING"
    && labCase.locale === "en-US" && labCase.geography === "US"
    && Object.keys(input).sort().join(",") === "limit,location_coordinate,title"
    && input.title === selectedInput.title
    && input.location_coordinate === selectedInput.location_coordinate
    && input.limit === selectedInput.limit;
}

function selectedSafeSummary(value: JsonValue | null): boolean {
  if (value === null) return true;
  if (Array.isArray(value) || typeof value !== "object" ||
      Object.keys(value).join(",") !== "businesses" || !Array.isArray(value.businesses)) return false;
  const fields = new Set(["title", "category", "address", "domain", "latitude",
    "longitude", "rating", "cid", "feature_id"]);
  const addressFields = new Set(["address", "city", "region", "postal_code", "country_code"]);
  return value.businesses.every(item => {
    if (!item || Array.isArray(item) || typeof item !== "object" ||
        Object.keys(item).some(key => !fields.has(key)) ||
        typeof item.title !== "string" || !item.title) return false;
    return Object.entries(item).every(([key, entry]) => {
      if (key === "address") {
        if (typeof entry === "string") return true;
        return !!entry && !Array.isArray(entry) && typeof entry === "object" &&
          Object.entries(entry).every(([part, text]) =>
            addressFields.has(part) && typeof text === "string");
      }
      return (key === "latitude" || key === "longitude" || key === "rating")
        ? typeof entry === "number" && Number.isFinite(entry)
        : typeof entry === "string";
    });
  });
}

function selectedSafeStatusCodes(value: JsonValue | null): boolean {
  if (value === null) return true;
  if (Array.isArray(value) || typeof value !== "object") return false;
  const fields = new Set(["http", "provider", "task", "tasksError"]);
  return Object.entries(value).every(([key, code]) => fields.has(key) &&
    (code === null || (typeof code === "number" && Number.isInteger(code) &&
      code >= 0 && code <= 2_147_483_647)));
}

export interface LiveDispatchStatus {
  researchRunId: string;
  researchStatus: ResearchRun["status"];
  claimAt: IsoDateTime | null;
  disposition: "UNCLAIMED" | "UNKNOWN" | "RECORDED" | "RECONCILED";
  providerRunId: string | null;
  reconciliationOutcome: "UNKNOWN_AFTER_REVIEW" | "CONFIRMED_NO_DISPATCH" | null;
  reviewedAt: IsoDateTime | null;
}

export type SyntheticExecutionResult =
  | { status: "recorded"; researchRun: ResearchRun; providerRun: ProviderRun; output: JsonValue }
  | { status: "stopped"; researchRun: ResearchRun; providerRun: null; output: null };

export interface CapabilityCellFacts {
  capabilityId: CapabilityId;
  workloadCell: string;
  provider: string;
  resultStateCounts: Record<ProviderResultState, number>;
  totalRuns: number;
  latencyKnownCount: number;
  latencyTotalMs: number;
  actualCostKnownCount: number;
  knownActualCostUsdMicros: number;
  observedAtKnownCount: number;
  rightsKnownCount: number;
  rightsClassCounts: Record<string, number>;
  provenanceCompleteCount: number;
}

/** The repository has no provider transport, credential access, or CRM mutation path. */
export class PostgresCapabilityLabRepository {
  constructor(private readonly pool: Pool) {}

  async createResearchRun(tenantId: TenantId, run: ResearchRun): Promise<ResearchRun> {
    if (run.tenantId !== tenantId || run.status !== "PLANNED" ||
      run.outputEvidenceIds.length !== 0 || run.startedAt !== null || run.completedAt !== null ||
      !Number.isSafeInteger(run.question.maxCostUsdMicros) || run.question.maxCostUsdMicros < 0 ||
      !Number.isSafeInteger(run.question.maxToolCalls) || run.question.maxToolCalls < 0 ||
      run.question.maxToolCalls > 2_147_483_647 ||
      run.question.stopCondition !== "EVIDENCE_PRESENT") {
      throw new CapabilityLabError("INVALID_RESEARCH_RUN");
    }
    const result = await query<ResearchRow>(this.pool,
      `INSERT INTO research_runs
        (id,tenant_id,run_id,correlation_id,question,question_contract,status,
         output_evidence_ids,started_at,completed_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,'PLANNED','[]'::jsonb,NULL,NULL) RETURNING *`,
      [run.id, tenantId, run.runId, run.correlationId, run.question.text,
        JSON.stringify(run.question)]);
    return researchFrom(result.rows[0]!);
  }

  async getResearchRun(tenantId: TenantId, id: string): Promise<ResearchRun | null> {
    const result = await query<ResearchRow>(this.pool,
      `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2`, [tenantId, id]);
    return result.rows[0] ? researchFrom(result.rows[0]) : null;
  }

  async startResearchRun(tenantId: TenantId, id: string, at: IsoDateTime): Promise<ResearchRun> {
    const result = await query<ResearchRow>(this.pool,
      `UPDATE research_runs SET status='RUNNING',started_at=$3
       WHERE tenant_id=$1 AND id=$2 AND status='PLANNED' RETURNING *`,
      [tenantId, id, at]);
    if (!result.rows[0]) throw new CapabilityLabError("RESEARCH_NOT_PLANNED");
    return researchFrom(result.rows[0]);
  }

  async attachEvidenceAndStop(tenantId: TenantId, id: string,
    evidenceIds: EvidenceId[], at: IsoDateTime): Promise<ResearchRun> {
    if (evidenceIds.length === 0 || new Set(evidenceIds).size !== evidenceIds.length) {
      throw new CapabilityLabError("EVIDENCE_REQUIRED");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const run = await query<ResearchRow>(client,
        `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2 FOR UPDATE`, [tenantId, id]);
      if (run.rows[0]?.status !== "RUNNING") throw new CapabilityLabError("RESEARCH_NOT_RUNNING");
      const found = await query(client,
        `SELECT id FROM evidence WHERE tenant_id=$1 AND id=ANY($2::uuid[])`,
        [tenantId, evidenceIds]);
      if (found.rows.length !== evidenceIds.length) throw new CapabilityLabError("EVIDENCE_NOT_FOUND");
      const updated = await query<ResearchRow>(client,
        `UPDATE research_runs SET output_evidence_ids=$3::jsonb,status='SUFFICIENT',completed_at=$4
         WHERE tenant_id=$1 AND id=$2 RETURNING *`,
        [tenantId, id, JSON.stringify(evidenceIds), at]);
      await client.query("COMMIT");
      return researchFrom(updated.rows[0]!);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async failResearchRun(tenantId: TenantId, id: string, at: IsoDateTime): Promise<ResearchRun> {
    const updated = await query<ResearchRow>(this.pool,
      `UPDATE research_runs SET status='FAILED',completed_at=$3
       WHERE tenant_id=$1 AND id=$2 AND status='RUNNING' RETURNING *`,
      [tenantId, id, at]);
    if (!updated.rows[0]) throw new CapabilityLabError("RESEARCH_NOT_RUNNING");
    return researchFrom(updated.rows[0]);
  }

  async executeSyntheticCase(tenantId: TenantId, researchRunId: string,
    caseInput: CapabilityLabCase, fixtureInput: SyntheticCapabilityFixture,
    providerRunId: string): Promise<SyntheticExecutionResult> {
    const labCase = validateLabCase(caseInput);
    const fixture = validateSyntheticFixture(fixtureInput);
    const estimated = fixture.estimatedCostUsdMicros;
    const charge = estimated === null ? null : Math.max(estimated, fixture.actualCostUsdMicros ?? 0);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const locked = await query<ResearchRow>(client,
        `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
        [tenantId, researchRunId]);
      if (!locked.rows[0] || locked.rows[0].status !== "RUNNING") {
        throw new CapabilityLabError("RESEARCH_NOT_RUNNING");
      }
      const run = researchFrom(locked.rows[0]);
      if (!run.question.allowedCapabilities.includes(labCase.capabilityId)) {
        throw new CapabilityLabError("CAPABILITY_NOT_ALLOWED");
      }
      let stop: ResearchRun["status"] | null = syntheticStopState(run);
      const usage = await query<QueryResultRow & { calls: string; cost: string; case_calls: string }>(client,
        `SELECT count(*)::text AS calls,
           coalesce(sum(greatest(actual_cost_usd_micros,estimated_cost_usd_micros)),0)::text AS cost,
           count(*) FILTER (WHERE case_id=$3)::text AS case_calls
         FROM provider_runs WHERE tenant_id=$1 AND research_run_id=$2 AND synthetic`,
        [tenantId, researchRunId, labCase.caseId]);
      const calls = Number(usage.rows[0]!.calls);
      const spent = Number(usage.rows[0]!.cost);
      const caseCalls = Number(usage.rows[0]!.case_calls);
      if (!Number.isSafeInteger(spent)) throw new CapabilityLabError("COST_EXCEEDS_SAFE_INTEGER");
      if (!stop && labCase.rightsClass === "RIGHTS_BLOCKED") stop = "BLOCKED";
      if (!stop && (estimated === null || charge === null ||
        charge > labCase.maxCostUsdMicros)) stop = "BLOCKED";
      if (!stop && (calls >= run.question.maxToolCalls || caseCalls >= labCase.maxToolCalls ||
        spent + charge! > run.question.maxCostUsdMicros)) stop = "EXHAUSTED";
      if (stop) {
        const updated = await query<ResearchRow>(client,
          `UPDATE research_runs SET status=$3,completed_at=$4
           WHERE tenant_id=$1 AND id=$2 RETURNING *`,
          [tenantId, researchRunId, stop, fixture.retrievedAt]);
        await client.query("COMMIT");
        return { status: "stopped", researchRun: researchFrom(updated.rows[0]!), providerRun: null, output: null };
      }
      const inserted = await query<ProviderRow>(client,
        `INSERT INTO provider_runs
          (id,tenant_id,run_id,correlation_id,research_run_id,case_id,workload_cell,
           adapter_version,normalized_input,lab_case,latency_ms,provenance_complete,synthetic,
           capability,provider,operation,interface,access_class,request_fingerprint,
           response_fingerprint,result_state,estimated_cost_usd_micros,
           actual_cost_usd_micros,actual_cost_known,retrieved_at,observed_at,rights_class)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,true,
           $13,$14,$15,$16,'READ',$17,$18,$19,$20,$21,$22,$23,$24,$25)
         RETURNING *`,
        [providerRunId, tenantId, run.runId, run.correlationId, researchRunId,
          labCase.caseId, labCase.workloadCell, labCase.adapterVersion,
          JSON.stringify(labCase.normalizedInput), JSON.stringify(labCase),
          fixture.latencyMs, fixture.provenanceComplete, labCase.capabilityId,
          labCase.provider, labCase.operation, labCase.interface,
          requestFingerprint(labCase), labFingerprint({ resultState: fixture.resultState,
            output: fixture.output }), fixture.resultState, estimated,
          fixture.actualCostUsdMicros, fixture.actualCostKnown,
          fixture.retrievedAt, fixture.observedAt, labCase.rightsClass]);
      const nextCalls = calls + 1;
      const nextSpent = spent + charge!;
      let next = run;
      if (nextCalls >= run.question.maxToolCalls || nextSpent >= run.question.maxCostUsdMicros) {
        const updated = await query<ResearchRow>(client,
          `UPDATE research_runs SET status='EXHAUSTED',completed_at=$3
           WHERE tenant_id=$1 AND id=$2 RETURNING *`,
          [tenantId, researchRunId, fixture.retrievedAt]);
        next = researchFrom(updated.rows[0]!);
      }
      await client.query("COMMIT");
      return { status: "recorded", researchRun: next, providerRun: providerFrom(inserted.rows[0]!),
        output: fixture.output };
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  /** Irreversible one-call reservation. Provider transport is never inside this transaction. */
  async claimSelectedLiveValidation(tenantId: TenantId, researchRunId: string,
    caseInput: CapabilityLabCase, at: IsoDateTime): Promise<ResearchRun> {
    const labCase = validateLabCase(caseInput);
    if (!selectedLiveCase(labCase)) throw new CapabilityLabError("LIVE_TUPLE_NOT_ALLOWED");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await query<ResearchRow>(client,
        `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
        [tenantId, researchRunId]);
      const row = result.rows[0];
      if (!row || row.status !== "RUNNING" || row.live_dispatch_claimed_at !== null ||
          row.question_contract.maxCostUsdMicros !== 15000 ||
          row.question_contract.maxToolCalls !== 1 ||
          row.question_contract.stopCondition !== "EVIDENCE_PRESENT" ||
          !row.question_contract.allowedCapabilities?.includes(labCase.capabilityId) ||
          row.output_evidence_ids.length > 0) {
        throw new CapabilityLabError("LIVE_RESEARCH_NOT_AUTHORIZED");
      }
      const existing = await query<QueryResultRow & { calls: string; cost: string }>(client,
        `SELECT count(*)::text AS calls,
          coalesce(sum(greatest(actual_cost_usd_micros,estimated_cost_usd_micros)),0)::text AS cost
         FROM provider_runs WHERE tenant_id=$1 AND research_run_id=$2`, [tenantId, researchRunId]);
      const input = labCase.normalizedInput as Record<string, JsonValue>;
      const estimate = 12000 + 360 * Number(input.limit);
      if (Number(existing.rows[0]!.calls) >= 1 ||
          Number(existing.rows[0]!.cost) + estimate > 15000) {
        throw new CapabilityLabError("LIVE_BUDGET_EXHAUSTED");
      }
      const claimed = await query<ResearchRow>(client,
        `UPDATE research_runs SET live_dispatch_claimed_at=$3,live_dispatch_state='UNKNOWN'
         WHERE tenant_id=$1 AND id=$2 AND live_dispatch_claimed_at IS NULL RETURNING *`,
        [tenantId, researchRunId, at]);
      if (!claimed.rows[0]) throw new CapabilityLabError("LIVE_ALREADY_CLAIMED");
      await client.query("COMMIT");
      return researchFrom(claimed.rows[0]);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async appendClaimedLiveResult(tenantId: TenantId, researchRunId: string,
    record: LiveProviderAuditInput): Promise<ProviderRun> {
    const labCase = validateLabCase(record.labCase);
    if (!selectedLiveCase(labCase) || record.requestFingerprint !== requestFingerprint(labCase) ||
        !["PRESENT", "EMPTY_WITHIN_RESPONSE", "ERROR"].includes(record.resultState) ||
        !Number.isSafeInteger(record.estimatedCostUsdMicros) ||
        record.estimatedCostUsdMicros < 0 || record.estimatedCostUsdMicros > 15000 ||
        record.actualCostKnown !== (record.actualCostUsdMicros !== null) ||
        (record.actualCostUsdMicros !== null &&
          (!Number.isSafeInteger(record.actualCostUsdMicros) || record.actualCostUsdMicros < 0)) ||
        (record.actualCostUsdMicros !== null && record.actualCostUsdMicros > 15000 &&
          (record.resultState !== "ERROR" || record.safeErrorCategory !== "COST_ENVELOPE"))) {
      throw new CapabilityLabError("INVALID_LIVE_AUDIT");
    }
    const safeSummary = record.safeSummary === null ? null : normalizeLabJson(record.safeSummary);
    const safeStatusCodes = record.safeStatusCodes === null ? null : normalizeLabJson(record.safeStatusCodes);
    if (!selectedSafeSummary(safeSummary)) throw new CapabilityLabError("UNSAFE_LIVE_SUMMARY");
    if (!selectedSafeStatusCodes(safeStatusCodes)) throw new CapabilityLabError("UNSAFE_LIVE_STATUS_CODES");
    const allowedErrors = [null, "HTTP_AUTH", "HTTP_PAYMENT", "HTTP_RATE", "HTTP_SERVER",
      "HTTP_OTHER", "TIMEOUT", "NETWORK", "PROVIDER_STATUS", "TASK_STATUS",
      "SCHEMA", "MIXED_RESPONSE", "COST_ENVELOPE"];
    if (!allowedErrors.includes(record.safeErrorCategory) ||
      (record.resultState === "ERROR") !== (record.safeErrorCategory !== null)) {
      throw new CapabilityLabError("INVALID_LIVE_ERROR_CATEGORY");
    }
    const ambiguous = ["TIMEOUT", "NETWORK", "HTTP_SERVER", "HTTP_OTHER",
      "SCHEMA", "MIXED_RESPONSE"].includes(record.safeErrorCategory ?? "");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const parent = await query<ResearchRow>(client,
        `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
        [tenantId, researchRunId]);
      const row = parent.rows[0];
      if (!row || row.status !== "RUNNING" || row.live_dispatch_claimed_at === null) {
        throw new CapabilityLabError("LIVE_CLAIM_MISSING");
      }
      const inserted = await query<ProviderRow>(client,
        `INSERT INTO provider_runs
          (id,tenant_id,run_id,correlation_id,research_run_id,case_id,workload_cell,
           adapter_version,normalized_input,lab_case,latency_ms,provenance_complete,synthetic,
           capability,provider,operation,interface,access_class,request_fingerprint,
           response_fingerprint,result_state,estimated_cost_usd_micros,
           actual_cost_usd_micros,actual_cost_known,retrieved_at,observed_at,rights_class,
           transport,provider_task_id,provider_cid,provider_feature_id,safe_summary,
           safe_status_codes,safe_error_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12,false,
           $13,$14,$15,$16,'READ',$17,$18,$19,$20,$21,$22,$23,$24,$25,
           'aisa',$26,$27,$28,$29::jsonb,$30::jsonb,$31) RETURNING *`,
        [record.id, tenantId, row.run_id, row.correlation_id, researchRunId,
          labCase.caseId, labCase.workloadCell, labCase.adapterVersion,
          JSON.stringify(labCase.normalizedInput), JSON.stringify(labCase),
          record.latencyMs, record.provenanceComplete, labCase.capabilityId,
          labCase.provider, labCase.operation, labCase.interface,
          record.requestFingerprint, record.responseFingerprint, record.resultState,
          record.estimatedCostUsdMicros, record.actualCostUsdMicros, record.actualCostKnown,
          record.retrievedAt, record.observedAt, labCase.rightsClass,
          record.providerTaskId, record.providerCid, record.providerFeatureId,
          safeSummary === null ? null : JSON.stringify(safeSummary),
          safeStatusCodes === null ? null : JSON.stringify(safeStatusCodes),
          record.safeErrorCategory]);
      await query(client,
        `UPDATE research_runs SET status=$3,completed_at=$4,live_dispatch_state=$5
         WHERE tenant_id=$1 AND id=$2`,
        [tenantId, researchRunId,
          ambiguous ? "BLOCKED" : record.resultState === "ERROR" ? "FAILED" : "EXHAUSTED",
          record.retrievedAt, ambiguous ? "UNKNOWN" : "RECORDED"]);
      await client.query("COMMIT");
      return providerFrom(inserted.rows[0]!);
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  }

  async getLiveDispatchStatus(tenantId: TenantId, researchRunId: string): Promise<LiveDispatchStatus | null> {
    const result = await query<QueryResultRow & {
      id: string; status: ResearchRun["status"]; live_dispatch_claimed_at: Date | null;
      live_dispatch_state: "UNKNOWN" | "RECORDED" | null;
      provider_run_id: string | null;
      outcome: LiveDispatchStatus["reconciliationOutcome"]; reviewed_at: Date | null;
    }>(this.pool, `SELECT r.id,r.status,r.live_dispatch_claimed_at,r.live_dispatch_state,
      p.id AS provider_run_id,x.outcome,x.reviewed_at
      FROM research_runs r
      LEFT JOIN provider_runs p ON p.tenant_id=r.tenant_id AND p.research_run_id=r.id
        AND p.transport='aisa'
      LEFT JOIN aisa_live_dispatch_reconciliations x ON x.tenant_id=r.tenant_id
        AND x.research_run_id=r.id
      WHERE r.tenant_id=$1 AND r.id=$2`, [tenantId, researchRunId]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      researchRunId: row.id, researchStatus: row.status,
      claimAt: iso(row.live_dispatch_claimed_at),
      disposition: row.outcome ? "RECONCILED" : row.live_dispatch_state ?? "UNCLAIMED",
      providerRunId: row.provider_run_id,
      reconciliationOutcome: row.outcome, reviewedAt: iso(row.reviewed_at),
    };
  }

  /** Closes a stranded claim as UNKNOWN; the immutable claim still forbids redispatch. */
  async markClaimedLiveDispatchUnknown(tenantId: TenantId, researchRunId: string,
    at: IsoDateTime): Promise<LiveDispatchStatus> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await query<ResearchRow>(client,
        `SELECT * FROM research_runs WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
        [tenantId, researchRunId]);
      const row = result.rows[0];
      if (!row || row.live_dispatch_state !== "UNKNOWN" ||
          (row.status !== "RUNNING" && row.status !== "BLOCKED")) {
        throw new CapabilityLabError("LIVE_UNKNOWN_CLAIM_REQUIRED");
      }
      const prior = await query<QueryResultRow>(client,
        `SELECT id FROM provider_runs WHERE tenant_id=$1 AND research_run_id=$2
         AND transport='aisa'`, [tenantId, researchRunId]);
      if (prior.rowCount && row.status === "RUNNING") {
        throw new CapabilityLabError("LIVE_RESULT_ALREADY_RECORDED");
      }
      if (row.status === "RUNNING") await query(client,
        `UPDATE research_runs SET status='BLOCKED',completed_at=$3
         WHERE tenant_id=$1 AND id=$2`, [tenantId, researchRunId, at]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
    return (await this.getLiveDispatchStatus(tenantId, researchRunId))!;
  }

  /** Attribution of review does not erase uncertainty or enable a second dispatch. */
  async reconcileUnknownLiveDispatch(tenantId: TenantId, researchRunId: string,
    review: { id: string; actorRef: string; evidenceDigest: string;
      outcome: "UNKNOWN_AFTER_REVIEW" | "CONFIRMED_NO_DISPATCH"; reviewedAt: IsoDateTime }):
    Promise<LiveDispatchStatus> {
    if (!/^[0-9a-fA-F-]{36}$/.test(review.id) ||
        !/^[0-9a-fA-F-]{36}$/.test(review.actorRef) ||
        !/^sha256:[0-9a-f]{64}$/.test(review.evidenceDigest) ||
        !["UNKNOWN_AFTER_REVIEW", "CONFIRMED_NO_DISPATCH"].includes(review.outcome)) {
      throw new CapabilityLabError("INVALID_LIVE_RECONCILIATION");
    }
    await this.markClaimedLiveDispatchUnknown(tenantId, researchRunId, review.reviewedAt);
    await query(this.pool, `INSERT INTO aisa_live_dispatch_reconciliations
      (id,tenant_id,research_run_id,reviewed_at,actor_ref,evidence_digest,outcome)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [review.id, tenantId, researchRunId, review.reviewedAt, review.actorRef,
        review.evidenceDigest, review.outcome]);
    return (await this.getLiveDispatchStatus(tenantId, researchRunId))!;
  }

  async getSelectedLiveProviderRun(tenantId: TenantId, id: string): Promise<ProviderRun | null> {
    const result = await query<ProviderRow>(this.pool,
      `SELECT * FROM provider_runs WHERE tenant_id=$1 AND id=$2 AND transport='aisa'`,
      [tenantId, id]);
    return result.rows[0] ? providerFrom(result.rows[0]) : null;
  }

  async getProviderRun(tenantId: TenantId, id: string): Promise<ProviderRun | null> {
    const result = await query<ProviderRow>(this.pool,
      `SELECT * FROM provider_runs WHERE tenant_id=$1 AND id=$2 AND synthetic`, [tenantId, id]);
    return result.rows[0] ? providerFrom(result.rows[0]) : null;
  }

  async listProviderRuns(tenantId: TenantId, researchRunId: string): Promise<ProviderRun[]> {
    const result = await query<ProviderRow>(this.pool,
      `SELECT * FROM provider_runs WHERE tenant_id=$1 AND research_run_id=$2 AND synthetic
       ORDER BY recorded_at,id`, [tenantId, researchRunId]);
    return result.rows.map(providerFrom);
  }

  async evaluateCapabilityCell(tenantId: TenantId, capabilityId: CapabilityId,
    workloadCell: string): Promise<CapabilityCellFacts[]> {
    const result = await query<ProviderRow>(this.pool,
      `SELECT * FROM provider_runs WHERE tenant_id=$1 AND capability=$2
       AND workload_cell=$3 AND synthetic ORDER BY provider,recorded_at,id`,
      [tenantId, capabilityId, workloadCell]);
    const facts = new Map<string, CapabilityCellFacts>();
    for (const row of result.rows) {
      let cell = facts.get(row.provider);
      if (!cell) {
        cell = { capabilityId, workloadCell, provider: row.provider,
          resultStateCounts: { PRESENT: 0, EMPTY_WITHIN_RESPONSE: 0, UNKNOWN: 0,
            ERROR: 0, PENDING: 0, PARTIAL: 0 }, totalRuns: 0,
          latencyKnownCount: 0, latencyTotalMs: 0, actualCostKnownCount: 0,
          knownActualCostUsdMicros: 0, observedAtKnownCount: 0,
          rightsKnownCount: 0, rightsClassCounts: Object.create(null) as Record<string, number>,
          provenanceCompleteCount: 0 };
        facts.set(row.provider, cell);
      }
      cell.totalRuns++;
      cell.resultStateCounts[row.result_state]++;
      if (row.latency_ms !== null) { cell.latencyKnownCount++; cell.latencyTotalMs += row.latency_ms; }
      if (row.actual_cost_known) {
        cell.actualCostKnownCount++;
        cell.knownActualCostUsdMicros += safeNumber(row.actual_cost_usd_micros)!;
      }
      if (row.observed_at !== null) cell.observedAtKnownCount++;
      if (row.rights_class !== null) {
        cell.rightsKnownCount++;
        cell.rightsClassCounts[row.rights_class] =
          (cell.rightsClassCounts[row.rights_class] ?? 0) + 1;
      }
      if (row.provenance_complete) cell.provenanceCompleteCount++;
      if (!Number.isSafeInteger(cell.knownActualCostUsdMicros) ||
          !Number.isSafeInteger(cell.latencyTotalMs)) {
        throw new CapabilityLabError("CELL_TOTAL_EXCEEDS_SAFE_INTEGER");
      }
    }
    return [...facts.values()];
  }
}
