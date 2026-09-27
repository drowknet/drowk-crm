import type {
  ActorId,
  EntityId,
  IsoDateTime,
  PolicyVersion,
  RunScoped,
  Sha256Digest,
  TenantScoped,
} from "./ids.js";

export type PolicyDisposition = "ALLOW" | "DENY" | "REVIEW";

export interface PolicyDecision extends TenantScoped, RunScoped {
  id: string;
  subjectId: EntityId | null;
  action: string;
  disposition: PolicyDisposition;
  evidenceComplete: boolean;
  reasonCodes: string[];
  policyVersion: PolicyVersion;
  recordedAt: IsoDateTime;
}

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CONSUMED";

export interface Approval extends TenantScoped {
  id: string;
  actorId: ActorId;
  action: string;
  targetRef: string;
  payloadDigest: Sha256Digest;
  policyVersion: PolicyVersion;
  status: ApprovalStatus;
  expiresAt: IsoDateTime;
  recordedAt: IsoDateTime;
}
