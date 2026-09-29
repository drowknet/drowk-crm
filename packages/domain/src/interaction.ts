import type {
  ActivityParticipant, Conversation, Evidence, Identity, ObservationId, PolicyDecision,
} from "@drowk/contracts";

/** A raw thread ref never becomes a cross-provider Conversation key. */
export function namespacedConversationRef(namespace: string | null, ref: string | null): string | null {
  if (namespace === null && ref === null) return null;
  if (!namespace?.trim() || !ref?.trim()) throw new Error("SOURCE_CONVERSATION_REF_NOT_NAMESPACED");
  return JSON.stringify([namespace, ref]);
}

type SourceConversationContext = Pick<Conversation, "channel" | "sourceNamespace"
  | "sourceConversationRef" | "accountId" | "facilityId" | "supersedesId">;

/** Channel and namespace are part of source identity; accepted context is immutable. */
export function sourceConversationReplay(previous: SourceConversationContext,
  incoming: SourceConversationContext): "different_source" | "same_context" | "context_conflict" {
  const previousRef = namespacedConversationRef(previous.sourceNamespace,
    previous.sourceConversationRef);
  const incomingRef = namespacedConversationRef(incoming.sourceNamespace,
    incoming.sourceConversationRef);
  if (previousRef === null || incomingRef === null) return "different_source";
  if (previous.channel !== incoming.channel
    || previousRef !== incomingRef) {
    return "different_source";
  }
  return previous.accountId === incoming.accountId
    && previous.facilityId === incoming.facilityId
    && previous.supersedesId === incoming.supersedesId
    ? "same_context" : "context_conflict";
}

/** Corrections retain source subject and role; Person authority is checked separately. */
export function participantCorrectionPreservesLineage(
  previous: Pick<ActivityParticipant, "tenantId" | "activityId" | "role"
    | "sourceParticipantNamespace" | "sourceParticipantRef">,
  successor: Pick<ActivityParticipant, "tenantId" | "activityId" | "role"
    | "sourceParticipantNamespace" | "sourceParticipantRef">,
): boolean {
  return previous.tenantId === successor.tenantId
    && previous.activityId === successor.activityId
    && previous.role === successor.role
    && previous.sourceParticipantNamespace === successor.sourceParticipantNamespace
    && previous.sourceParticipantRef === successor.sourceParticipantRef;
}

/** Each chain has one head; branching history is invalid. */
export function currentParticipantHeads(
  history: readonly Pick<ActivityParticipant, "id" | "supersedesId">[],
): typeof history {
  const ids = new Set(history.map(item => item.id));
  if (ids.size !== history.length) throw new Error("PARTICIPANT_HISTORY_DUPLICATE_ID");
  const superseded = new Set<string>();
  for (const item of history) {
    if (item.supersedesId === null) continue;
    if (!ids.has(item.supersedesId) || superseded.has(item.supersedesId)) {
      throw new Error("PARTICIPANT_HISTORY_INVALID_SUCCESSOR");
    }
    superseded.add(item.supersedesId);
  }
  const byId = new Map(history.map(item => [item.id, item]));
  for (const item of history) {
    const seen = new Set<string>();
    let cursor: typeof item | undefined = item;
    while (cursor !== undefined && cursor.supersedesId !== null) {
      if (seen.has(cursor.id)) throw new Error("PARTICIPANT_HISTORY_CYCLE");
      seen.add(cursor.id);
      cursor = byId.get(cursor.supersedesId);
    }
  }
  return history.filter(item => !superseded.has(item.id));
}

/** An ALLOW for another subject/action cannot promote this observation. */
export function canPromoteInteraction(
  policy: Pick<PolicyDecision, "action" | "subjectId" | "disposition" | "evidenceComplete">,
  observationId: ObservationId,
  evidence: readonly Pick<Evidence, "observationId">[],
): boolean {
  return policy.action === "ACCEPT_INTERACTION"
    && policy.subjectId !== null && String(policy.subjectId) === String(observationId)
    && policy.disposition === "ALLOW" && policy.evidenceComplete
    && evidence.length > 0 && evidence.every(item => item.observationId === observationId);
}

/** Source lineage alone cannot resolve Person; a canonical Identity may prove the link. */
export function participantLinksAgree(
  participant: Pick<ActivityParticipant, "identityId" | "personId" | "sourceParticipantRef">,
  identity: Pick<Identity, "id" | "personId"> | null,
): boolean {
  if (participant.sourceParticipantRef !== null && participant.personId !== null
    && participant.identityId === null) return false;
  if (participant.identityId === null) return identity === null;
  return identity !== null && identity.id === participant.identityId
    && (participant.personId === null || identity.personId === participant.personId);
}

/** One stable source identity has one accepted Activity in this package. */
export function acceptedSourceReplay(
  previous: { sourceNamespace: string; sourceNativeId: string; sourceRevision: string | null },
  incoming: { sourceNamespace: string; sourceNativeId: string; sourceRevision: string | null },
): "same_revision" | "revision_conflict" | "different_source" {
  if (previous.sourceNamespace !== incoming.sourceNamespace
    || previous.sourceNativeId !== incoming.sourceNativeId) return "different_source";
  return previous.sourceRevision === incoming.sourceRevision ? "same_revision" : "revision_conflict";
}
