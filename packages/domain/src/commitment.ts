import type { Activity, ActivityParticipant, Commitment, Evidence, PolicyDecision } from "@drowk/contracts";

/** An accepted Activity and its evidence remain distinct from the obligation claim. */
export function canPromoteCommitment(
  activity: Pick<Activity, "id" | "sourceObservationId">,
  evidence: readonly Pick<Evidence, "observationId">[],
  policy: Pick<PolicyDecision, "subjectId" | "action" | "disposition" | "evidenceComplete">,
): boolean {
  return evidence.length > 0 && evidence.every(item => item.observationId === activity.sourceObservationId)
    && policy.subjectId !== null && String(policy.subjectId) === String(activity.id)
    && policy.action === "ACCEPT_COMMITMENT"
    && policy.disposition === "ALLOW" && policy.evidenceComplete;
}

/** A Person link needs an accepted participant already backed by canonical Identity. */
export function commitmentCounterpartyResolved(
  personId: Commitment["counterpartyPersonId"],
  participants: readonly Pick<ActivityParticipant, "personId" | "identityId">[],
): boolean {
  return personId === null || participants.some(p => p.personId === personId && p.identityId !== null);
}

export function validCommitmentDate(dueDate: Commitment["dueDate"]): boolean {
  if (dueDate === null) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return false;
  const instant = new Date(`${dueDate}T00:00:00.000Z`);
  return !Number.isNaN(instant.getTime()) && instant.toISOString().slice(0, 10) === dueDate;
}

/** Record identity/recordedAt do not change the attributable replay payload. */
export function commitmentPayload(value: Omit<Commitment, "tenantId">): string {
  return JSON.stringify([
    value.kind, value.state, value.statement, value.sourceActivityId,
    [...value.evidenceIds].sort(), value.accountId, value.facilityId,
    value.counterpartyPersonId, value.owedBy, value.dueDate, value.conditionText,
    value.promotionPolicyDecisionId, value.supersedesId,
  ]);
}
