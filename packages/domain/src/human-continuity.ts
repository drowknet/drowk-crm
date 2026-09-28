import type {
  Contact, Employment, EntityMatchDecision, Identity, PersonId, TenantId,
} from "@drowk/contracts";

/** Generic decision status alone is insufficient: target and entity scope must agree. */
export function safePersonDecision(
  decision: Pick<EntityMatchDecision, "status" | "resolutionScope" | "selectedEntityId">,
  personId: PersonId,
): boolean {
  return decision.status === "MATCHED_SAFE"
    && decision.resolutionScope === "PERSON"
    && decision.selectedEntityId !== null
    && String(decision.selectedEntityId) === String(personId);
}

/** Unknown temporal bounds remain null; only two known dates can be ordered. */
export function validEmploymentRange(
  employment: Pick<Employment, "startedOn" | "endedOn">,
): boolean {
  return employment.startedOn === null || employment.endedOn === null
    || employment.startedOn <= employment.endedOn;
}

/** Operational Contact creation never promotes a durable human implicitly. */
export function unlinkedContact(
  tenantId: TenantId,
  input: Pick<Contact, "id" | "displayName" | "recordedAt" | "supersedesId">,
): Contact {
  return { ...input, tenantId, personId: null, personMatchDecisionId: null };
}

/** Appending a new job preserves every historical Account/title attribution. */
export function appendEmployment(
  history: readonly Employment[], next: Employment,
): Employment[] {
  if (!validEmploymentRange(next)) throw new Error("INVALID_EMPLOYMENT_RANGE");
  if (history.some(prior => prior.tenantId !== next.tenantId || prior.personId !== next.personId)) {
    throw new Error("EMPLOYMENT_SUBJECT_MISMATCH");
  }
  if (history.some(prior => prior.id === next.id)) throw new Error("EMPLOYMENT_ID_CONFLICT");
  return [...history, next];
}

/** Identity history keys by record ID, never by a shared or recycled value. */
export function appendIdentity(history: readonly Identity[], next: Identity): Identity[] {
  if (history.some(prior => prior.tenantId !== next.tenantId || prior.personId !== next.personId)) {
    throw new Error("IDENTITY_SUBJECT_MISMATCH");
  }
  if (history.some(prior => prior.id === next.id)) throw new Error("IDENTITY_ID_CONFLICT");
  return [...history, next];
}
