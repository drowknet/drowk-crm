import type {
  EntityId,
  EvidenceId,
  IsoDateTime,
  ObservationId,
  RunScoped,
  TenantScoped,
} from "./ids.js";
import type { KnowledgeTime } from "./temporal.js";

export type EvidenceTrust = "CLAIMED" | "VERIFIED" | "REJECTED";
export type EvidenceValue = string | number | boolean | null | Record<string, unknown>;

export interface EvidenceSubject {
  entityType: string;
  entityId: EntityId | null;
  candidateKey: string | null;
}

export interface Evidence extends TenantScoped, RunScoped, KnowledgeTime {
  id: EvidenceId;
  observationId: ObservationId;
  subject: EvidenceSubject;
  claim: string;
  value: EvidenceValue;
  trust: EvidenceTrust;
  observedAt: IsoDateTime | null;
  expiresAt: IsoDateTime | null;
  rightsClass: string | null;
  supersedesId: EvidenceId | null;
}
