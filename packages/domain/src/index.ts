import type {
  ActionAttempt,
  EntityMatchDecision,
  Evidence,
  IsoDateTime,
  PolicyDecision,
  TemporalApplicability,
} from "@drowk/contracts";
import { wasEffectiveAt, wasKnownAt } from "@drowk/contracts";

export function identityDecisionCanLink(
  decision: Pick<EntityMatchDecision, "status" | "selectedEntityId">,
): boolean {
  return decision.status === "MATCHED_SAFE" && decision.selectedEntityId !== null;
}

export function evidenceWasKnownAt(
  evidence: Pick<Evidence, "recordedAt">,
  asOf: IsoDateTime,
): boolean {
  return wasKnownAt(evidence.recordedAt, asOf);
}

export function evidenceApplicabilityAt(
  evidence: Pick<Evidence, "effectiveAt">,
  asOf: IsoDateTime,
): TemporalApplicability {
  return wasEffectiveAt(evidence.effectiveAt, asOf);
}

export function policyAllowsExecution(
  decision: Pick<PolicyDecision, "disposition" | "evidenceComplete">,
): boolean {
  return decision.disposition === "ALLOW" && decision.evidenceComplete;
}

export function actionAttemptRequiresReconciliation(
  attempt: Pick<ActionAttempt, "state">,
): boolean {
  return attempt.state === "UNKNOWN" || attempt.state === "DISPATCHING";
}
