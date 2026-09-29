import type {
  EntityId,
  IsoDate,
  IsoDateTime,
  PolicyVersion,
  RunScoped,
  TenantScoped,
  WorkItemId,
} from "./ids.js";

export type WorkState =
  | "NEEDS_ACTION"
  | "REVIEW"
  | "WAITING"
  | "SCHEDULED"
  | "BLOCKED"
  | "NO_ACTION"
  | "DONE"
  | "CANCELLED"
  | "SUPERSEDED";

export type AttentionClass =
  | "HARD_STOP_REVIEW"
  | "OVERDUE"
  | "DUE_TODAY"
  | "NEEDS_HUMAN_REVIEW"
  | "READY_HIGH"
  | "READY_NORMAL"
  | "BLOCKED_NEEDS_OWNER"
  | "WAITING"
  | "SCHEDULED"
  | "NO_ACTION";

export type AutonomyLevel =
  | "A0_OBSERVE"
  | "A1_SUGGEST"
  | "A2_PREPARE"
  | "A3_CONFIRMED_EXECUTE"
  | "A4_POLICY_AUTO"
  | "A5_NEVER_AUTO";

export type WorkSourceType =
  | "TASK"
  | "CORE"
  | "SHADOW_SUGGESTION"
  | "EVIDENCE"
  | "SYSTEM";

export interface WorkItem extends TenantScoped, RunScoped {
  id: WorkItemId;
  workKey: string;
  subjectId: EntityId;
  kind: string;
  sourceType: WorkSourceType;
  sourceRefs: string[];
  sourceVersion: string | null;
  nextAction: string;
  followingActions: string[];
  ownerRef: string | null;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dueAt: IsoDateTime | null;
  /** Operational calendar date; never synthesize a clock time to populate dueAt. */
  dueDate: IsoDate | null;
  waitingOn: "OWNER" | "CUSTOMER" | "THIRD_PARTY" | "DATE" | "NONE";
  state: WorkState;
  attentionClass: AttentionClass;
  reasonCodes: string[];
  blocker: string | null;
  evidenceNeeded: string | null;
  autonomyLevel: AutonomyLevel;
  approvalRequired: boolean;
  humanReviewRequired: boolean;
  policyVersion: PolicyVersion;
  sourceWatermark: string | null;
  supersedesWorkItemId: WorkItemId | null;
  fingerprint: string;
  availableAt: IsoDateTime;
  recordedAt: IsoDateTime;
}
