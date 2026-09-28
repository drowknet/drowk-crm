import { createHash } from "node:crypto";
import type {
  AttentionClass, AutonomyLevel, EntityId, IsoDate, IsoDateTime, PolicyVersion,
  TenantId, RunId, CorrelationId, WorkItem, WorkItemId, WorkSourceType, WorkState,
} from "@drowk/contracts";

export const WORK_COMPILER_VERSION = "dcrm-04a-v1";
export type DuePolicy = "TODAY" | "NEXT_BUSINESS_DAY" | "NEXT_2_BUSINESS_DAYS" |
  "TODAY_OR_NEXT_BUSINESS_DAY" | "EXTRACTED_DATE" | "RETURN_DATE" | "NONE";
export type WorkPriority = WorkItem["priority"];
export type WaitingOn = WorkItem["waitingOn"];

interface Source {
  ref: string;
  version?: string | null;
  action?: string | null;
  dueDate?: string | null;
  ownerRef?: string | null;
  priority?: WorkPriority | null;
  waitingOn?: WaitingOn | null;
  lastActivityAt?: string | null;
}
export interface CoreWorkSource extends Source {
  state?: string | null;
  status?: string | null;
  snoozedUntil?: string | null;
  needsHumanReview?: boolean;
  replyDate?: string | null;
}
export interface AccountWorkSource extends Source {
  exclusion: "GREEN" | "AMBER" | "RED" | "HOLD" | "UNKNOWN";
  status?: "ACTIVE" | "CLOSED" | "ARCHIVED";
}
export interface TaskWorkSource extends Source {
  id: string;
  status: "TODO" | "WAITING" | "DONE" | "CANCELLED";
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  completionOutcome?: string | null;
  snoozedUntil?: string | null;
}
export interface ShadowWorkSource {
  ref: string;
  version: string;
  actionPlan: readonly string[];
  semanticState?: string | null;
  runStatus: "SUCCESS" | "FAILED";
  reviewStatus: "NEEDS_REVIEW" | "APPROVED" | "REJECTED" | "OVERRIDDEN";
  analyzedAt: string;
  error?: string | null;
  /** Eligibility is set after the upstream Observation/Evidence boundary. */
  evidenceEligible: boolean;
  replyDate?: string | null;
}
export interface WorkCase {
  subjectId: EntityId;
  /** Resolved upstream; ambiguous links must be signaled, not inferred here. */
  anchorRef: string;
  account?: AccountWorkSource;
  contactRef?: string | null;
  contactDnc?: boolean;
  conversation?: CoreWorkSource;
  pursuit?: CoreWorkSource;
  opportunity?: CoreWorkSource;
  tasks?: readonly TaskWorkSource[];
  shadows?: readonly ShadowWorkSource[];
  evidenceRefs?: readonly string[];
  ambiguousConversationLink?: boolean;
  terminalParentRefs?: readonly string[];
  extractedDate?: string | null;
  returnDate?: string | null;
  sourceAnchorDate?: string | null;
  duePolicies?: Readonly<Record<string, DuePolicy>>;
}
export interface WorkCompileContext {
  tenantId: TenantId;
  runId: RunId;
  correlationId: CorrelationId;
  today: string;
  at: IsoDateTime;
  policyVersion: PolicyVersion;
  sourceWatermark: string | null;
}
/** Resolve only attributable, upstream candidate links. No domain/thread inference occurs here. */
export function resolvePursuitWorkAnchor(input: {
  pursuitRef: string;
  acceptedConversationRef?: string | null;
  reverseConversationRefs?: readonly string[];
  threadConversationRefs?: readonly string[];
  accountContactConversationRefs?: readonly string[];
}): { anchorRef: string; ambiguousConversationLink: boolean } {
  if (input.acceptedConversationRef) {
    return { anchorRef: input.acceptedConversationRef, ambiguousConversationLink: false };
  }
  for (const refs of [input.reverseConversationRefs, input.threadConversationRefs,
    input.accountContactConversationRefs]) {
    const unique = [...new Set(refs ?? [])];
    if (unique.length === 1) return { anchorRef: unique[0]!, ambiguousConversationLink: false };
    if (unique.length > 1) return { anchorRef: input.pursuitRef, ambiguousConversationLink: true };
  }
  return { anchorRef: input.pursuitRef, ambiguousConversationLink: false };
}
/** A deterministic candidate. Compilation itself does not persist or authorize Work. */
export interface CompiledWorkCandidate extends WorkItem {
  anchorRef: string;
  updatedAt: IsoDateTime;
  lastActivityAt: string | null;
  snoozedUntilDate: IsoDate | null;
  replyDate: IsoDate | null;
  taskId: string | null;
  completedAt: string | null;
  completionOutcome: string | null;
}
export type WorkAuditOperation = "CREATE" | "REVIEW" | "UPDATE" | "NOOP" | "SUPERSEDE";
export interface WorkAuditEntry {
  workKey: string;
  operation: WorkAuditOperation;
  previousFingerprint: string | null;
  newFingerprint: string;
  reasonCodes: readonly string[];
  runId: RunId;
  at: IsoDateTime;
}

const terminalStates = new Set<WorkState>(["DONE", "CANCELLED", "SUPERSEDED"]);
const outboundActions = new Set(["FOLLOW_UP_EMAIL", "FOLLOW_UP_PROPOSAL", "EMAIL", "CALL",
  "SEND_INFORMATION", "SEND_REQUESTED_INFORMATION", "SCHEDULE_ASSESSMENT",
  "RECONTACT_AT_DATE"]);
const followupActions = new Set(["FOLLOW_UP_EMAIL", "FOLLOW_UP_PROPOSAL",
  "RECONTACT_AT_DATE", "MONITOR_FUTURE_SOLICITATIONS", "REVIEW_REACTIVATION"]);
const prepareActions = new Set(["FOLLOW_UP_EMAIL", "SEND_INFORMATION",
  "SEND_REQUESTED_INFORMATION", "SCHEDULE_ASSESSMENT"]);
const approvalActions = new Set([...prepareActions, "COMPLETE_VENDOR_REGISTRATION",
  "FOLLOW_PROCUREMENT_PATH", "CONTINUE_BID_SUBMISSION", "QUALIFY_CONVERSATION"]);
const replyActions = new Set(["REVIEW_REPLY", "QUALIFY_CONVERSATION", "SCHEDULE_ASSESSMENT",
  "SEND_INFORMATION", "SEND_REQUESTED_INFORMATION", "COMPLETE_VENDOR_REGISTRATION",
  "RESEARCH_BUYER", "VERIFY_REFERRED_CONTACT", "FOLLOW_PROCUREMENT_PATH",
  "CONTINUE_BID_SUBMISSION"]);
const attentionOrder: AttentionClass[] = ["HARD_STOP_REVIEW", "OVERDUE", "DUE_TODAY",
  "NEEDS_HUMAN_REVIEW", "READY_HIGH", "READY_NORMAL", "BLOCKED_NEEDS_OWNER",
  "WAITING", "SCHEDULED", "NO_ACTION"];
const priorityOrder: WorkPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function date(value: string | null | undefined): IsoDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value as IsoDate : null;
}

function businessDate(today: IsoDate, days: number): IsoDate {
  const cursor = new Date(`${today}T00:00:00Z`);
  while (days > 0) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) days--;
  }
  return cursor.toISOString().slice(0, 10) as IsoDate;
}

export function resolveWorkDueDate(
  policy: DuePolicy, todayValue: string, explicit: string | null,
  extracted: string | null, returned: string | null, sourceAnchorDate: string | null,
): { dueDate: IsoDate | null; missing: boolean } {
  const today = date(todayValue);
  if (!today) throw new Error("Work compilation requires a valid operational date.");
  if (explicit) return { dueDate: date(explicit), missing: date(explicit) === null };
  const policyBase = date(sourceAnchorDate);
  if (["TODAY", "NEXT_BUSINESS_DAY", "NEXT_2_BUSINESS_DAYS",
    "TODAY_OR_NEXT_BUSINESS_DAY"].includes(policy) && !policyBase) {
    return { dueDate: null, missing: true };
  }
  switch (policy) {
    case "TODAY": return { dueDate: policyBase, missing: false };
    case "NEXT_BUSINESS_DAY": return { dueDate: businessDate(policyBase!, 1), missing: false };
    case "NEXT_2_BUSINESS_DAYS": return { dueDate: businessDate(policyBase!, 2), missing: false };
    case "TODAY_OR_NEXT_BUSINESS_DAY":
      return { dueDate: [0, 6].includes(new Date(`${policyBase}T00:00:00Z`).getUTCDay())
        ? businessDate(policyBase!, 1) : policyBase, missing: false };
    case "EXTRACTED_DATE": return { dueDate: date(extracted), missing: !date(extracted) };
    case "RETURN_DATE": return { dueDate: date(returned), missing: !date(returned) };
    case "NONE": return { dueDate: null, missing: false };
  }
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
function workId(tenantId: TenantId, key: string): WorkItemId {
  const hex = hash(`${tenantId}\u001f${key}`).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}` as WorkItemId;
}
function fingerprint(item: CompiledWorkCandidate): string {
  const { id: _id, runId: _run, correlationId: _correlation,
    availableAt: _available, recordedAt: _recorded, updatedAt: _updated,
    supersedesWorkItemId: _supersedes, fingerprint: _fingerprint, ...state } = item;
  return `sha256:${hash(JSON.stringify(state))}`;
}
function activeTask(task: TaskWorkSource): boolean {
  return task.status !== "DONE" && task.status !== "CANCELLED";
}
function compareStamp(left: string | null | undefined, right: string | null | undefined): number {
  const valid = (value: string | null | undefined): value is string =>
    !!value && !!date(value.slice(0, 10)) &&
    (value.length === 10 || !Number.isNaN(Date.parse(value)));
  if (!valid(left)) return valid(right) ? -1 : 0;
  if (!valid(right)) return 1;
  if (left.slice(0, 10) !== right.slice(0, 10))
    return left.slice(0, 10) > right.slice(0, 10) ? 1 : -1;
  if (left.length === 10 || right.length === 10) return 0;
  return Math.sign(Date.parse(left) - Date.parse(right));
}
function latestStamp(values: readonly (string | null | undefined)[]): string | null {
  return values.reduce<string | null>((best, value) => {
    const order = compareStamp(value, best);
    return order > 0 || order === 0 && !!value && value.length === 10 && !!date(value)
      ? value ?? null : best;
  }, null);
}
function taskStamp(task: TaskWorkSource): string | null {
  return latestStamp([task.completedAt, task.updatedAt, task.createdAt]);
}
function newerCoreEvent(coreAt: string | null, taskAt: string | null): boolean {
  return compareStamp(coreAt, taskAt) > 0;
}
function latestTask(tasks: readonly TaskWorkSource[]): TaskWorkSource | null {
  return [...tasks].sort((a, b) =>
    compareStamp(taskStamp(b), taskStamp(a)) || a.id.localeCompare(b.id))[0] ?? null;
}
function eligibleShadow(shadows: readonly ShadowWorkSource[]): ShadowWorkSource | null {
  return [...shadows].filter(s => s.evidenceEligible && s.runStatus === "SUCCESS" &&
    !s.error && s.reviewStatus !== "REJECTED" && s.reviewStatus !== "OVERRIDDEN")
    .sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt) || a.ref.localeCompare(b.ref))[0] ?? null;
}
function shadowPlan(shadow: ShadowWorkSource): string[] {
  if (shadow.actionPlan.length) return [...shadow.actionPlan];
  return ["ACKNOWLEDGEMENT_ONLY", "DNC_SIGNAL"].includes(shadow.semanticState ?? "")
    ? ["NO_ACTION"] : [];
}
function attention(state: WorkState, reasons: readonly string[], due: IsoDate | null,
  today: IsoDate, priority: WorkPriority): AttentionClass {
  if (reasons.includes("HARD_STOP")) return "HARD_STOP_REVIEW";
  if (terminalStates.has(state) || state === "NO_ACTION") return "NO_ACTION";
  if (state === "WAITING") return "WAITING";
  if (state === "SCHEDULED") return "SCHEDULED";
  if (state === "BLOCKED") return "BLOCKED_NEEDS_OWNER";
  if (due && due < today) return "OVERDUE";
  if (due === today) return "DUE_TODAY";
  if (state === "REVIEW") return "NEEDS_HUMAN_REVIEW";
  return priority === "CRITICAL" || priority === "HIGH" ? "READY_HIGH" : "READY_NORMAL";
}
export function compareWorkAttention(a: CompiledWorkCandidate, b: CompiledWorkCandidate): number {
  return attentionOrder.indexOf(a.attentionClass) - attentionOrder.indexOf(b.attentionClass) ||
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority) ||
    (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") ||
    (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "") ||
    a.workKey.localeCompare(b.workKey);
}

export function compileWorkCase(context: WorkCompileContext, input: WorkCase): CompiledWorkCandidate[] {
  const today = date(context.today);
  if (!today) throw new Error("Work compilation requires a valid operational date.");
  if (!input.anchorRef || !input.subjectId) throw new Error("Work compilation requires an anchor and subject.");
  if (input.account?.exclusion === "AMBER" && !input.conversation && !input.pursuit &&
    !input.opportunity && !input.tasks?.length && !input.shadows?.length) return [];
  const core = [input.conversation, input.pursuit, input.opportunity, input.account]
    .filter((source): source is CoreWorkSource | AccountWorkSource => source !== undefined);
  const coreActions = core.map(source => source.action).filter((action): action is string => !!action);
  const tasks = input.tasks ?? [];
  const active = tasks.filter(activeTask);
  const task = [...active].sort((a, b) => (date(a.dueDate) ?? "9999-12-31")
    .localeCompare(date(b.dueDate) ?? "9999-12-31") ||
    priorityOrder.indexOf(a.priority ?? "MEDIUM") - priorityOrder.indexOf(b.priority ?? "MEDIUM") ||
    a.id.localeCompare(b.id))[0] ?? null;
  const terminal = latestTask(tasks.filter(t => !activeTask(t)));
  const coreEvent = core.map(source => ({ ref: source.ref, at: source.lastActivityAt ?? null }))
    .filter(source => source.at).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "") ||
      a.ref.localeCompare(b.ref))[0] ?? null;
  const sameCoreAction = coreActions.length > 0 && !!terminal &&
    coreActions.every(action => action === terminal.action);
  const terminalSelected = !task && !!terminal &&
    (coreActions.length === 0 || sameCoreAction &&
      !newerCoreEvent(coreEvent?.at ?? null, taskStamp(terminal)));
  const taskSource = task ?? (terminalSelected ? terminal : null);
  const shadow = eligibleShadow(input.shadows ?? []);
  const reasons: string[] = [];
  if (input.ambiguousConversationLink) reasons.push("AMBIGUOUS_CONVERSATION_LINK");
  let plan = taskSource?.action ? [taskSource.action] : [];
  let sourceType: WorkSourceType = plan.length ? "TASK" : "CORE";
  if (!plan.length && coreActions.length) plan = [coreActions[0]!];
  if (!plan.length && ["WAITING_FOR_REPLY", "NO_CURRENT_NEED"].includes(input.conversation?.state ?? ""))
    plan = ["NO_ACTION"];
  if (!plan.length && shadow) { plan = shadowPlan(shadow); sourceType = "SHADOW_SUGGESTION"; }
  if (!plan.length) { plan = ["REVIEW_WORK_STATE"]; reasons.push("MISSING_ACTION"); }
  if (active.length > 1) {
    plan = ["REVIEW_WORK_STATE"];
    reasons.push("MULTIPLE_ACTIVE_TASKS");
    for (const [field, code] of [["dueDate", "TASK_DUE_CONFLICT"],
      ["priority", "TASK_PRIORITY_CONFLICT"], ["ownerRef", "TASK_OWNER_CONFLICT"],
      ["waitingOn", "TASK_WAITING_CONFLICT"], ["action", "TASK_ACTION_CONFLICT"]] as const) {
      if (new Set(active.map(t => t[field] ?? null)).size > 1) reasons.push(code);
    }
  }
  if (!taskSource && new Set(coreActions).size > 1) {
    plan = ["REVIEW_WORK_STATE"]; reasons.push("CORE_ACTION_CONFLICT");
  }
  if (terminalSelected) reasons.push("TASK_TERMINAL_CYCLE");
  if (task && active.length === 1 && coreActions.some(action => action !== plan[0]))
    reasons.push("CORE_TASK_CONFLICT");
  if (shadow && sourceType !== "SHADOW_SUGGESTION" && shadowPlan(shadow).length &&
    shadowPlan(shadow)[0] !== plan[0]) reasons.push("SHADOW_CONFLICT_CORE_WINS");
  const intendedAction = plan[0]!;
  const parentConflict = (input.terminalParentRefs?.length ?? 0) > 0 &&
    [intendedAction, ...coreActions, ...active.map(t => t.action ?? "")].some(action =>
      outboundActions.has(action) || ["QUALIFY_CONVERSATION", "COMPLETE_VENDOR_REGISTRATION",
        "FOLLOW_PROCUREMENT_PATH", "CONTINUE_BID_SUBMISSION"].includes(action));
  if (parentConflict) reasons.push("PARENT_TERMINAL_CONFLICT");
  // A Shadow semantic label is a review candidate, not accepted DNC authority.
  const dnc = input.contactDnc === true || input.conversation?.state === "DNC" ||
    input.pursuit?.state === "DNC";
  const shadowDncCandidate = sourceType === "SHADOW_SUGGESTION" &&
    shadow?.semanticState === "DNC_SIGNAL";
  if (shadowDncCandidate) reasons.push("SHADOW_DNC_CANDIDATE");
  const exclusion = input.account?.exclusion;
  if (dnc) { plan = ["NO_ACTION"]; reasons.push("HARD_STOP"); }
  else if (outboundActions.has(intendedAction) && (exclusion === "RED" || exclusion === "HOLD")) {
    plan = ["NO_ACTION"];
    reasons.push(exclusion === "RED" ? "COMMERCIAL_EXCLUSION_EXISTING_PWM" :
      "COMMERCIAL_EXCLUSION_HOLD");
  } else if (outboundActions.has(intendedAction) && exclusion === "UNKNOWN")
    reasons.push("EXCLUSION_RECONCILIATION");
  const action = plan[0]!;
  const explicitDue = taskSource?.dueDate ?? input.conversation?.dueDate ??
    input.pursuit?.dueDate ?? input.opportunity?.dueDate ?? input.account?.dueDate ?? null;
  const due = resolveWorkDueDate(input.duePolicies?.[action] ?? "NONE", context.today,
    explicitDue, input.extractedDate ?? input.conversation?.snoozedUntil ?? null,
    input.returnDate ?? input.conversation?.snoozedUntil ?? null,
    input.sourceAnchorDate ?? taskSource?.createdAt?.slice(0, 10) ??
      input.conversation?.replyDate ?? input.pursuit?.replyDate ??
      input.pursuit?.lastActivityAt?.slice(0, 10) ??
      input.conversation?.lastActivityAt?.slice(0, 10) ??
      input.account?.lastActivityAt?.slice(0, 10) ?? null);
  const snooze = date(taskSource?.snoozedUntil ?? input.conversation?.snoozedUntil ?? null);
  const waiting = taskSource?.waitingOn ?? input.conversation?.waitingOn ??
    input.pursuit?.waitingOn ?? "NONE";
  const ownerRef = taskSource?.ownerRef ?? input.pursuit?.ownerRef ??
    input.opportunity?.ownerRef ?? input.account?.ownerRef ?? null;
  const missingIdentity = !input.account || !ownerRef ||
    input.anchorRef.startsWith("TASK:") || input.anchorRef.startsWith("ACTIVITY:");
  const missingContact = !input.contactRef && outboundActions.has(action);
  const ownerFollowupDue = followupActions.has(action) && !!due.dueDate && !!explicitDue;
  let state: WorkState = "NEEDS_ACTION";
  if (terminalSelected) state = terminal!.status as WorkState;
  else if (dnc || shadowDncCandidate) state = "REVIEW";
  else if (missingIdentity || input.ambiguousConversationLink || parentConflict ||
    active.length > 1 || reasons.some(r => ["CORE_ACTION_CONFLICT", "CORE_TASK_CONFLICT",
      "SHADOW_CONFLICT_CORE_WINS", "MISSING_ACTION"].includes(r))) state = "REVIEW";
  else if (due.missing) { state = "REVIEW"; reasons.push("MISSING_POLICY_DATE"); }
  else if (waiting === "DATE" && !due.dueDate) { state = "REVIEW"; reasons.push("MISSING_DATE"); }
  else if (input.conversation?.state === "SNOOZED" && !snooze) {
    state = "REVIEW"; reasons.push("MISSING_SNOOZE_DATE");
  } else if (missingContact) { state = "BLOCKED"; reasons.push("MISSING_CONTACT"); }
  else if (input.pursuit?.status === "BLOCKED") {
    state = "BLOCKED"; reasons.push("PURSUIT_BLOCKED");
  } else if (input.conversation?.state === "NO_CURRENT_NEED") state = "NO_ACTION";
  else if (input.conversation?.state === "WAITING_FOR_REPLY" && waiting === "CUSTOMER" &&
    !ownerFollowupDue) state = "WAITING";
  else if (action === "NO_ACTION") state = "NO_ACTION";
  else if (task?.status === "WAITING") state = "WAITING";
  else if (snooze && snooze > today) state = "SCHEDULED";
  else if (ownerFollowupDue) state = due.dueDate! > today ? "SCHEDULED" : "NEEDS_ACTION";
  else if (waiting === "CUSTOMER" || waiting === "THIRD_PARTY") state = "WAITING";
  else if ((waiting === "DATE" || ["RECONTACT_AT_DATE", "MONITOR_FUTURE_SOLICITATIONS"]
    .includes(action)) && due.dueDate && due.dueDate > today) state = "SCHEDULED";
  else if (sourceType === "SHADOW_SUGGESTION" || input.conversation?.needsHumanReview) state = "REVIEW";
  if (reasons.includes("EXCLUSION_RECONCILIATION") &&
    (state === "NEEDS_ACTION" || state === "WAITING" && !due.dueDate)) state = "REVIEW";
  if (missingIdentity) reasons.push("MISSING_CRITICAL_IDENTITY");
  if (snooze && snooze <= today) reasons.push("SNOOZE_DUE");
  if (sourceType === "SHADOW_SUGGESTION") reasons.push("AI_DERIVED_REVIEW");
  const causal: Array<[boolean, string, string]> = [
    [dnc, "HARD_STOP", "DNC_CONFIRMATION"],
    [missingIdentity, "MISSING_CRITICAL_IDENTITY", "OWNER_OR_OBJECT"],
    [!!input.ambiguousConversationLink, "AMBIGUOUS_CONVERSATION_LINK", "CONVERSATION_LINK"],
    [parentConflict, "PARENT_TERMINAL_CONFLICT", "PARENT_STATE_RECONCILIATION"],
    [active.length > 1, "MULTIPLE_ACTIVE_TASKS", "ACTIVE_TASK_RECONCILIATION"],
    [due.missing, "MISSING_POLICY_DATE", "SOURCE_DATE"],
    [reasons.includes("MISSING_DATE"), "MISSING_DATE", "SOURCE_DATE"],
    [reasons.includes("MISSING_SNOOZE_DATE"), "MISSING_SNOOZE_DATE", "SOURCE_DATE"],
    [missingContact, "MISSING_CONTACT", "CONTACT_ID"],
    [reasons.includes("PURSUIT_BLOCKED"), "PURSUIT_BLOCKED", "PREREQUISITE"],
    [reasons.includes("COMMERCIAL_EXCLUSION_EXISTING_PWM"),
      "COMMERCIAL_EXCLUSION_EXISTING_PWM", "COMMERCIAL_EXCLUSION_REVIEW"],
    [reasons.includes("COMMERCIAL_EXCLUSION_HOLD"),
      "COMMERCIAL_EXCLUSION_HOLD", "COMMERCIAL_EXCLUSION_REVIEW"],
    [reasons.includes("EXCLUSION_RECONCILIATION"),
      "EXCLUSION_RECONCILIATION", "EXCLUSION_RECONCILIATION"],
  ];
  const firstCause = causal.find(([condition]) => condition);
  const observation = state === "NO_ACTION" || state === "WAITING" || terminalStates.has(state);
  const autonomyLevel: AutonomyLevel = dnc || ["RED", "HOLD"].includes(exclusion ?? "") &&
    outboundActions.has(intendedAction) ? "A5_NEVER_AUTO" : observation ? "A0_OBSERVE" :
    state === "REVIEW" || state === "BLOCKED" ? "A1_SUGGEST" :
    prepareActions.has(action) ? "A2_PREPARE" : "A1_SUGGEST";
  const approvalRequired = !observation && !dnc &&
    (approvalActions.has(action) || sourceType === "SHADOW_SUGGESTION");
  const sourceRefs = [...new Set([...core.map(s => s.ref), ...tasks.map(t => t.ref),
    ...input.shadows?.filter(s => s === shadow).map(s => s.ref) ?? [],
    ...input.evidenceRefs ?? [], ...input.terminalParentRefs ?? [],
    ...(input.contactRef ? [input.contactRef] : [])])].sort();
  const priority = active.length > 1 ? priorityOrder.find(p => active.some(t => t.priority === p)) ?? "MEDIUM" :
    taskSource?.priority ?? input.conversation?.priority ?? input.pursuit?.priority ??
    input.account?.priority ?? "MEDIUM";
  const sameActionTasks = tasks.filter(t => t.action === action)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.id.localeCompare(b.id));
  const generation = !task && terminal && sameCoreAction &&
    newerCoreEvent(coreEvent?.at ?? null, taskStamp(terminal))
    ? `|EVENT:${coreEvent!.ref}@${coreEvent!.at}` :
    taskSource && sameActionTasks.length && sameActionTasks[0]?.id !== taskSource.id
      ? `|TASK:${taskSource.id}` : "";
  const workKey = `${input.anchorRef}|${action}|${sourceType === "SHADOW_SUGGESTION"
    ? shadow!.version : WORK_COMPILER_VERSION}${generation}`;
  const item: CompiledWorkCandidate = {
    id: workId(context.tenantId, workKey), tenantId: context.tenantId,
    runId: context.runId, correlationId: context.correlationId,
    workKey, subjectId: input.subjectId, kind: action, sourceType,
    sourceRefs, sourceVersion: sourceType === "SHADOW_SUGGESTION" ? shadow!.version :
      taskSource?.version ?? input.conversation?.version ?? WORK_COMPILER_VERSION,
    nextAction: action, followingActions: plan.slice(1), ownerRef, priority,
    dueAt: null, dueDate: dnc ? null : due.dueDate, waitingOn: waiting, state,
    attentionClass: attention(state, reasons, dnc ? null : due.dueDate, today, priority),
    reasonCodes: [...new Set(reasons)], blocker: firstCause?.[1] ?? null,
    evidenceNeeded: firstCause?.[2] ?? (terminalStates.has(state) ? null :
      state === "REVIEW" ? "OWNER_DECISION" : state === "WAITING" ? "EXTERNAL_RESPONSE" :
      state === "SCHEDULED" ? "DATE_REACHED" : state === "BLOCKED" ? "PREREQUISITE" :
      state === "NO_ACTION" ? "NEW_EVIDENCE" : "ACTION_OUTCOME"),
    autonomyLevel, approvalRequired, humanReviewRequired: state === "REVIEW" ||
      sourceType === "SHADOW_SUGGESTION" || reasons.includes("EXCLUSION_RECONCILIATION"),
    policyVersion: context.policyVersion, sourceWatermark: context.sourceWatermark,
    supersedesWorkItemId: null, fingerprint: "", availableAt: context.at,
    recordedAt: context.at, updatedAt: context.at, anchorRef: input.anchorRef,
    lastActivityAt: input.conversation?.lastActivityAt ?? input.pursuit?.lastActivityAt ??
      input.account?.lastActivityAt ?? null,
    snoozedUntilDate: snooze, replyDate: date(shadow?.replyDate ??
      input.conversation?.replyDate ?? null), taskId: taskSource?.id ?? null,
    completedAt: terminalSelected ? terminal?.completedAt ?? null : null,
    completionOutcome: terminalSelected ? terminal?.completionOutcome ?? null : null,
  };
  item.fingerprint = fingerprint(item);
  const items = [item];
  for (const completed of tasks.filter(t => !activeTask(t))) {
    if (terminalSelected && completed.id === terminal?.id) continue;
    const completedAction = completed.action ?? "REVIEW_WORK_STATE";
    const cycle = tasks.filter(t => t.action === completedAction)
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "") ||
        a.id.localeCompare(b.id))[0]?.id === completed.id ? "" : `|TASK:${completed.id}`;
    const historicalKey = `${input.anchorRef}|${completedAction}|${WORK_COMPILER_VERSION}${cycle}`;
    if (historicalKey === item.workKey) continue;
    const historical: CompiledWorkCandidate = {
      ...item, id: workId(context.tenantId, historicalKey), workKey: historicalKey,
      kind: completedAction, sourceType: "TASK", sourceRefs: [...new Set([
        ...sourceRefs.filter(ref => !ref.startsWith("Tasks:")), completed.ref])].sort(),
      sourceVersion: completed.version ?? WORK_COMPILER_VERSION,
      nextAction: completedAction, followingActions: [], ownerRef: completed.ownerRef ?? ownerRef,
      priority: completed.priority ?? priority, dueDate: date(completed.dueDate),
      waitingOn: completed.waitingOn ?? "NONE", state: completed.status as WorkState,
      attentionClass: "NO_ACTION", reasonCodes: ["TASK_TERMINAL_CYCLE"],
      blocker: null, evidenceNeeded: null, autonomyLevel: "A0_OBSERVE",
      approvalRequired: false, humanReviewRequired: false, taskId: completed.id,
      completedAt: completed.completedAt ?? null,
      completionOutcome: completed.completionOutcome ?? null,
      lastActivityAt: completed.completedAt ?? completed.updatedAt ?? completed.createdAt ?? null,
      fingerprint: "",
    };
    historical.fingerprint = fingerprint(historical);
    items.push(historical);
  }
  if (new Set(items.map(work => work.workKey)).size !== items.length)
    throw new Error("Duplicate compiled Work Key.");
  return items.sort(compareWorkAttention);
}

export function compileWork(context: WorkCompileContext,
  cases: readonly WorkCase[]): CompiledWorkCandidate[] {
  const items = cases.flatMap(input => compileWorkCase(context, input));
  if (new Set(items.map(work => work.workKey)).size !== items.length)
    throw new Error("Duplicate compiled Work Key across cases.");
  return items.sort(compareWorkAttention);
}

export function reconcileWork(current: readonly CompiledWorkCandidate[],
  previous: readonly CompiledWorkCandidate[], runId: RunId, at: IsoDateTime):
  { rows: CompiledWorkCandidate[]; audit: WorkAuditEntry[] } {
  const oldByKey = new Map(previous.map(row => [row.workKey, row]));
  const currentKeys = new Set(current.map(row => row.workKey));
  const rows: CompiledWorkCandidate[] = [];
  const audit: WorkAuditEntry[] = [];
  for (const candidate of current) {
    const old = oldByKey.get(candidate.workKey);
    const priorAnchor = previous.filter(row => row.anchorRef === candidate.anchorRef &&
      row.workKey !== candidate.workKey)
      .sort((a, b) => Number(terminalStates.has(a.state)) - Number(terminalStates.has(b.state)) ||
        b.updatedAt.localeCompare(a.updatedAt))[0];
    const operation: WorkAuditOperation = !old ? candidate.state === "REVIEW" ? "REVIEW" : "CREATE" :
      old.fingerprint === candidate.fingerprint ? "NOOP" : "UPDATE";
    const row = operation === "NOOP" ? old! : { ...candidate,
      id: old?.id ?? candidate.id,
      recordedAt: old?.recordedAt ?? at,
      availableAt: old?.availableAt ?? at,
      updatedAt: at,
      supersedesWorkItemId: old?.supersedesWorkItemId ?? priorAnchor?.id ?? null };
    rows.push(row);
    audit.push({ workKey: row.workKey, operation,
      previousFingerprint: old?.fingerprint ?? null, newFingerprint: row.fingerprint,
      reasonCodes: row.reasonCodes, runId, at });
  }
  for (const old of previous) if (!currentKeys.has(old.workKey)) {
    if (terminalStates.has(old.state)) { rows.push(old); continue; }
    const reasonCodes = [...new Set([...old.reasonCodes,
      ...(current.some(row => row.anchorRef === old.anchorRef) ? [] : ["SOURCE_NO_LONGER_ACTIVE"])])];
    const superseded: CompiledWorkCandidate = { ...old, state: "SUPERSEDED",
      attentionClass: "NO_ACTION", reasonCodes, autonomyLevel: "A0_OBSERVE",
      approvalRequired: false, humanReviewRequired: false, updatedAt: at, fingerprint: "" };
    superseded.fingerprint = fingerprint(superseded);
    rows.push(superseded);
    audit.push({ workKey: old.workKey, operation: "SUPERSEDE",
      previousFingerprint: old.fingerprint, newFingerprint: superseded.fingerprint,
      reasonCodes, runId, at });
  }
  return { rows: rows.sort(compareWorkAttention), audit };
}

export function projectWorkViews(items: readonly CompiledWorkCandidate[], todayValue: string):
  { today: CompiledWorkCandidate[]; replies: CompiledWorkCandidate[];
    followUps: CompiledWorkCandidate[] } {
  const today = date(todayValue);
  if (!today) throw new Error("Work projection requires a valid operational date.");
  const active = items.filter(item => !terminalStates.has(item.state)).sort(compareWorkAttention);
  const unsnoozed = (item: CompiledWorkCandidate) => !item.snoozedUntilDate ||
    item.snoozedUntilDate <= today;
  return {
    today: active.filter(item => ["NEEDS_ACTION", "REVIEW", "BLOCKED"].includes(item.state) &&
      (item.attentionClass === "HARD_STOP_REVIEW" || unsnoozed(item)) &&
      (!item.dueDate || item.dueDate <= today ||
        ["HARD_STOP_REVIEW", "NEEDS_HUMAN_REVIEW"].includes(item.attentionClass))),
    replies: active.filter(item => item.replyDate && (replyActions.has(item.nextAction) ||
      item.state === "REVIEW") && unsnoozed(item)),
    followUps: active.filter(item => followupActions.has(item.nextAction) &&
      !!item.dueDate && unsnoozed(item) &&
      !item.reasonCodes.includes("HARD_STOP") &&
      !item.reasonCodes.includes("PARENT_TERMINAL_CONFLICT") &&
      (["SCHEDULED", "NEEDS_ACTION"].includes(item.state) ||
        item.state === "REVIEW" && item.dueDate <= today &&
          item.reasonCodes.includes("EXCLUSION_RECONCILIATION"))),
  };
}
