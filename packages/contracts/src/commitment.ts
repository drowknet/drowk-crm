import type {
  AccountId, ActivityId, CommitmentId, EvidenceId, FacilityId, IsoDate,
  IsoDateTime, PersonId, TenantScoped,
} from "./ids.js";

export type CommitmentKind = "REQUEST" | "PROMISE" | "AGREED_NEXT_STEP";
export type CommitmentState = "SUGGESTED" | "CONFIRMED" | "FULFILLED" | "DECLINED" | "UNRESOLVED";
export type CommitmentOwedBy = "TENANT" | "COUNTERPARTY" | "MUTUAL" | "UNKNOWN";

/** Attributable obligation memory; neither an Activity nor executable Work. */
export interface Commitment extends TenantScoped {
  id: CommitmentId;
  commitmentKey: string;
  kind: CommitmentKind;
  state: CommitmentState;
  statement: string;
  sourceActivityId: ActivityId;
  evidenceIds: EvidenceId[];
  accountId: AccountId | null;
  facilityId: FacilityId | null;
  counterpartyPersonId: PersonId | null;
  owedBy: CommitmentOwedBy;
  dueDate: IsoDate | null;
  conditionText: string | null;
  recordedAt: IsoDateTime;
  promotionPolicyDecisionId: string;
  supersedesId: CommitmentId | null;
}
