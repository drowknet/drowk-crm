import type { ActorId, CorrelationId, RunId, TenantId } from "@drowk/contracts";

export interface RequestContext {
  tenantId: TenantId;
  actorId: ActorId;
  runId: RunId;
  correlationId: CorrelationId;
}

export interface ApiHealth {
  service: "drowk-api";
  status: "ok";
}

export function health(): ApiHealth {
  return { service: "drowk-api", status: "ok" };
}
