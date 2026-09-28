import type {
  ActivityId, ActivityParticipantId, IdentityId, IsoDateTime, PersonId,
  RelationshipId, RelationshipInteractionId, TenantScoped,
} from "./ids.js";

/** Durable tenant-to-Person memory; employment context stays on historical interactions. */
export interface Relationship extends TenantScoped {
  id: RelationshipId;
  personId: PersonId;
  recordedAt: IsoDateTime;
}

export type RelationshipInteractionKind = "ACTIVITY" | "RECIPROCAL" | "MEANINGFUL";

/** An accepted, attributable assertion. Absence of a kind is unknown, not false. */
export interface RelationshipInteraction extends TenantScoped {
  id: RelationshipInteractionId;
  relationshipId: RelationshipId;
  activityId: ActivityId;
  kind: RelationshipInteractionKind;
  authorityParticipantId: ActivityParticipantId;
  authorityIdentityId: IdentityId;
  occurredAt: IsoDateTime | null;
  recordedAt: IsoDateTime;
  promotionPolicyDecisionId: string | null;
}
