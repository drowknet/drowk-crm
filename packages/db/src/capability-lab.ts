import type {
  CapabilityId, CapabilityLabCase, EvidenceId, IsoDateTime, JsonValue, ProviderResultState,
  ProviderRun, ResearchRun, TenantId, SyntheticCapabilityFixture,
} from "@drowk/contracts";
import {
  CapabilityLabError, labFingerprint, requestFingerprint, syntheticStopState,
  validateLabCase, validateSyntheticFixture,
} from "@drowk/domain";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type ResearchRow = QueryResultRow & {
  id: string; tenant_id: TenantId; run_id: ResearchRun["runId"];
  correlation_id: ResearchRun["correlationId"]; question: string;
  question_contract: ResearchRun["question"]; status: ResearchRun["status"];
  output_evidence_ids: EvidenceId[]; started_at: Date | null; completed_at: Date | null;
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
});

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
