import type { CorrelationId, RunId, TenantId } from "@drowk/contracts";

export interface TenantJobEnvelope<Payload = unknown> {
  jobType: string;
  tenantId: TenantId;
  runId: RunId;
  correlationId: CorrelationId;
  payload: Payload;
}

export function assertTenantScopedJob(
  job: Partial<TenantJobEnvelope>,
): asserts job is TenantJobEnvelope {
  if (!job.tenantId || !job.runId || !job.correlationId || !job.jobType) {
    throw new Error("Worker job is missing tenant/run/correlation scope.");
  }
}
