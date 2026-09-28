import type {
  Activity, ActivityParticipant, Identity, PolicyDecision, Relationship,
  RelationshipInteraction, RelationshipInteractionKind,
} from "@drowk/contracts";

export function relationshipAssertionAction(kind: RelationshipInteractionKind): string | null {
  switch (kind) {
    case "ACTIVITY": return null;
    case "RECIPROCAL": return "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL";
    case "MEANINGFUL": return "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL";
    default: throw new Error("RELATIONSHIP_INTERACTION_KIND_INVALID");
  }
}

/** Policy for one assertion kind cannot authorize another kind or Activity. */
export function canAssertRelationshipInteraction(kind: RelationshipInteractionKind,
  activityId: Activity["id"],
  policy: Pick<PolicyDecision, "action" | "subjectId" | "disposition" | "evidenceComplete"> | null,
): boolean {
  const action = relationshipAssertionAction(kind);
  if (action === null) return policy === null;
  return policy !== null && policy.action === action
    && policy.subjectId !== null && String(policy.subjectId) === String(activityId)
    && policy.disposition === "ALLOW"
    && policy.evidenceComplete;
}

/** A current canonical Identity must agree with the Relationship Person. */
export function hasCurrentRelationshipParticipant(
  relationship: Pick<Relationship, "tenantId" | "personId">,
  activity: Pick<Activity, "tenantId" | "id">,
  history: readonly Pick<ActivityParticipant, "id" | "tenantId" | "activityId"
    | "personId" | "identityId" | "supersedesId">[],
  identities: readonly Pick<Identity, "id" | "tenantId" | "personId">[],
): boolean {
  if (relationship.tenantId !== activity.tenantId) return false;
  const superseded = new Set(history.map(item => item.supersedesId));
  return history.some(participant => participant.tenantId === relationship.tenantId
    && participant.activityId === activity.id
    && participant.personId === relationship.personId
    && participant.identityId !== null && !superseded.has(participant.id)
    && identities.some(identity => identity.tenantId === relationship.tenantId
      && identity.id === participant.identityId && identity.personId === relationship.personId));
}

/** Unknown event time remains in history and never advances a known-time clock. */
function eventMicros(value: NonNullable<RelationshipInteraction["occurredAt"]>): bigint {
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) throw new Error("RELATIONSHIP_EVENT_TIME_INVALID");
  const fraction = /\.(\d{1,6})(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1] ?? "";
  return BigInt(milliseconds) * 1000n + BigInt(fraction.padEnd(6, "0").slice(3));
}

export function latestKnownRelationshipInteraction(
  history: readonly RelationshipInteraction[], kind: RelationshipInteractionKind,
): RelationshipInteraction | null {
  return history.filter(item => item.kind === kind && item.occurredAt !== null)
    .reduce<RelationshipInteraction | null>((latest, item) => {
      if (latest === null) return item;
      const itemTime = eventMicros(item.occurredAt!);
      const latestTime = eventMicros(latest.occurredAt!);
      if (itemTime > latestTime || (itemTime === latestTime && item.id > latest.id)) return item;
      return latest;
    }, null);
}

/** A logical assertion is one Relationship, Activity and kind. */
export function relationshipAssertionReplay(
  previous: Pick<RelationshipInteraction, "relationshipId" | "activityId" | "kind"
    | "occurredAt" | "promotionPolicyDecisionId">,
  incoming: Pick<RelationshipInteraction, "relationshipId" | "activityId" | "kind"
    | "occurredAt" | "promotionPolicyDecisionId">,
): "different_assertion" | "same_assertion" | "assertion_conflict" {
  if (previous.relationshipId !== incoming.relationshipId
    || previous.activityId !== incoming.activityId || previous.kind !== incoming.kind) {
    return "different_assertion";
  }
  return previous.occurredAt === incoming.occurredAt
    && previous.promotionPolicyDecisionId === incoming.promotionPolicyDecisionId
    ? "same_assertion" : "assertion_conflict";
}
