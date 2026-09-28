import type {
  ActivityParticipant, Evidence, Identity, ObservationId, PolicyDecision,
} from "@drowk/contracts";

/** A raw thread ref never becomes a cross-provider Conversation key. */
export function namespacedConversationRef(namespace: string | null, ref: string | null): string | null {
  if (namespace === null && ref === null) return null;
  if (!namespace?.trim() || !ref?.trim()) throw new Error("SOURCE_CONVERSATION_REF_NOT_NAMESPACED");
  return JSON.stringify([namespace, ref]);
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
