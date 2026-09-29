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
export type PersonId = Brand<string, "PersonId">;
export type IdentityId = Brand<string, "IdentityId">;
export type EmploymentId = Brand<string, "EmploymentId">;
export type ConversationId = Brand<string, "ConversationId">;
export type ActivityId = Brand<string, "ActivityId">;
export type ActivityParticipantId = Brand<string, "ActivityParticipantId">;
export type CommitmentId = Brand<string, "CommitmentId">;
export type RelationshipId = Brand<string, "RelationshipId">;
export type RelationshipInteractionId = Brand<string, "RelationshipInteractionId">;
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
