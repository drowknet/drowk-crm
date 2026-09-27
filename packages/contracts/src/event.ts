import type {
  ActorId,
  CorrelationId,
  EntityId,
  IsoDateTime,
  RunId,
  TenantId,
} from "./ids.js";

export interface EventEnvelope<Payload = unknown> {
  eventId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: IsoDateTime;
  tenantId: TenantId;
  actorId: ActorId | null;
  runId: RunId | null;
  correlationId: CorrelationId;
  causationId: string | null;
  subjectId: EntityId | null;
  payload: Payload;
}
