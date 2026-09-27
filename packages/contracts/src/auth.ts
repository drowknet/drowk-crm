import type { ActorId, CorrelationId, IsoDateTime, PolicyVersion, RunId, TenantId, UserId } from "./ids.js";

/** Asserted profile fields are metadata, never identity or authority. */
export interface ExternalPrincipal {
  issuer: string;
  subject: string;
  email?: string;
  displayName?: string;
}

export interface User {
  id: UserId;
  actorId: ActorId;
  displayName: string | null;
  recordedAt: IsoDateTime;
}

export interface AuthIdentity {
  issuer: string;
  subject: string;
  userId: UserId;
  email: string | null;
  recordedAt: IsoDateTime;
}

export interface AuthorizationAudit {
  actorId: ActorId;
  runId: RunId;
  correlationId: CorrelationId;
  policyVersion: PolicyVersion;
}

export type MembershipStatus = "ACTIVE" | "REVOKED";
export interface TenantMembership {
  tenantId: TenantId;
  userId: UserId;
  status: MembershipStatus;
  recordedAt: IsoDateTime;
  createdAudit: AuthorizationAudit;
  revokedAt: IsoDateTime | null;
  revokedAudit: AuthorizationAudit | null;
}

export interface RequestContext {
  tenantId: TenantId;
  userId: UserId;
  actorId: ActorId;
  runId: RunId;
  correlationId: CorrelationId;
}
