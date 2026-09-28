import type {
  AccountId, ActivityId, ActivityParticipantId, ConversationId, EvidenceId,
  FacilityId, IdentityId, IsoDateTime, ObservationId, PersonId, TenantScoped,
} from "./ids.js";

/** Provider-neutral container. A source thread is lineage, not its canonical ID. */
export interface Conversation extends TenantScoped {
  id: ConversationId;
  channel: string;
  accountId: AccountId | null;
  facilityId: FacilityId | null;
  sourceNamespace: string | null;
  sourceConversationRef: string | null;
  recordedAt: IsoDateTime;
  supersedesId: ConversationId | null;
}

export type ActivityDirection = "INBOUND" | "OUTBOUND" | "INTERNAL" | "UNKNOWN";

/** Accepted event, distinct from its Observation/Evidence and from Work. */
export interface Activity extends TenantScoped {
  id: ActivityId;
  conversationId: ConversationId;
  kind: string;
  direction: ActivityDirection;
  sourceObservationId: ObservationId;
  evidenceIds: EvidenceId[];
  occurredAt: IsoDateTime | null;
  recordedAt: IsoDateTime;
  promotionPolicyDecisionId: string;
  supersedesId: ActivityId | null;
}

export type ActivityParticipantRole = "FROM" | "TO" | "CC" | "PARTICIPANT" | "OWNER" | "UNKNOWN";

/** A source participant may remain unresolved. Corrections append a successor; null marks a root. */
export interface ActivityParticipant extends TenantScoped {
  id: ActivityParticipantId;
  activityId: ActivityId;
  role: ActivityParticipantRole;
  personId: PersonId | null;
  identityId: IdentityId | null;
  sourceParticipantNamespace: string | null;
  sourceParticipantRef: string | null;
  recordedAt: IsoDateTime;
  supersedesId: ActivityParticipantId | null;
}
