export type Brand<T, Name extends string> = T & {
  readonly __brand: Name;
};

export type TenantId = Brand<string, "TenantId">;
export type UserId = Brand<string, "UserId">;
export type ActorId = Brand<string, "ActorId">;
export type EntityId = Brand<string, "EntityId">;
export type AccountId = Brand<string, "AccountId">;
export type FacilityId = Brand<string, "FacilityId">;
export type ContactId = Brand<string, "ContactId">;
export type ObservationId = Brand<string, "ObservationId">;
export type EvidenceId = Brand<string, "EvidenceId">;
export type RunId = Brand<string, "RunId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type PolicyVersion = Brand<string, "PolicyVersion">;
export type WorkItemId = Brand<string, "WorkItemId">;
export type ActionAttemptId = Brand<string, "ActionAttemptId">;
export type OutcomeId = Brand<string, "OutcomeId">;
export type IsoDateTime = Brand<string, "IsoDateTime">;
export type IsoDate = Brand<string, "IsoDate">;
export type Sha256Digest = Brand<string, "Sha256Digest">;
export type CapabilityId = Brand<string, "CapabilityId">;

export interface TenantScoped {
  tenantId: TenantId;
}

export interface RunScoped {
  runId: RunId;
  correlationId: CorrelationId;
}
