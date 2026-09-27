import type {
  ActorId,
  EntityId,
  EvidenceId,
  IsoDateTime,
  RunScoped,
  Sha256Digest,
  TenantScoped,
} from "./ids.js";

export type EntityMatchDecisionStatus =
  | "MATCHED_SAFE"
  | "NO_MATCH"
  | "INSUFFICIENT_STRONG_EVIDENCE"
  | "REVIEW_REQUIRED"
  | "LINK_CONFLICT"
  | "BLOCKED_PARENT_REQUIRED";

export interface EntityMatchDecision extends TenantScoped, RunScoped {
  id: string;
  subjectKey: string;
  resolutionScope: string;
  status: EntityMatchDecisionStatus;
  selectedEntityId: EntityId | null;
  candidateCount: number;
  evidenceIds: EvidenceId[];
  reasonCodes: string[];
  fingerprint: Sha256Digest;
  policyVersion: string;
  decidedBy: ActorId | null;
  recordedAt: IsoDateTime;
  supersedesId: string | null;
}
