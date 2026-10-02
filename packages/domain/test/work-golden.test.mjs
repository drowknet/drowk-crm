import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  compileWork, compileWorkCase, compareWorkAttention, projectWorkViews,
  reconcileWork, resolvePursuitWorkAnchor, resolveWorkDueDate,
} from "../dist/work.js";

// Synthetic equivalents of legacy CRM source/harness/wp02-regression.mjs cases cited below.
const context = {
  tenantId: "00000000-0000-4000-8000-000000000001",
  runId: "00000000-0000-4000-8000-000000000002",
  correlationId: "00000000-0000-4000-8000-000000000003",
  today: "2026-09-25", at: "2026-09-25T12:00:00.000Z",
  policyVersion: "synthetic-policy-v1", sourceWatermark: "synthetic:7",
};
const base = () => ({
  subjectId: "00000000-0000-4000-8000-000000000004",
  anchorRef: "CONVERSATION:synthetic-c1",
  account: { ref: "Accounts:synthetic-a1", exclusion: "GREEN", ownerRef: "owner-a" },
  contactRef: "Contacts:synthetic-ct1",
  conversation: { ref: "Conversations:synthetic-c1", action: "REVIEW_REPLY",
    dueDate: context.today, state: "REPLY_NEEDS_REVIEW", priority: "MEDIUM",
    waitingOn: "NONE", replyDate: "2026-09-24", lastActivityAt: "2026-09-24T12:00:00Z" },
  evidenceRefs: ["Activities:synthetic-act1"],
});
const one = input => compileWorkCase(context, { ...base(), ...input })[0];
const shadow = (plan, semanticState = "OTHER_OR_UNCLEAR") => ({
  ref: "Shadow:synthetic-s1", version: "synthetic-shadow-v1", actionPlan: plan,
  semanticState, runStatus: "SUCCESS", reviewStatus: "NEEDS_REVIEW",
  analyzedAt: "2026-09-25T10:00:00Z", evidenceEligible: true,
  replyDate: "2026-09-24",
});
const at2 = "2026-09-26T12:00:00.000Z";

test("legacy reference cases 1, 14: inbound reply and hard bounce retain explicit action", () => {
  const reply = one({});
  assert.equal(reply.nextAction, "REVIEW_REPLY");
  assert.equal(reply.state, "NEEDS_ACTION");
  assert.equal(reply.ownerRef, "owner-a");
  assert.equal(reply.policyVersion, context.policyVersion);
  assert.equal(reply.sourceWatermark, context.sourceWatermark);
  assert.equal(projectWorkViews([reply], context.today).today.length, 1);
  assert.equal(one({ conversation: { ...base().conversation, action: "VERIFY_ALTERNATE_CHANNEL" } })
    .nextAction, "VERIFY_ALTERNATE_CHANNEL");
});

test("legacy reference cases 2-3, 27, 48: eligible Shadow preserves ordered vendor plan only as review candidate", () => {
  const vendor = one({ conversation: { ...base().conversation, action: null },
    shadows: [shadow(["COMPLETE_VENDOR_REGISTRATION", "SEND_REQUESTED_INFORMATION"], "VENDOR_PROCESS")] });
  assert.equal(vendor.nextAction, "COMPLETE_VENDOR_REGISTRATION");
  assert.deepEqual(vendor.followingActions, ["SEND_REQUESTED_INFORMATION"]);
  assert.equal(vendor.sourceType, "SHADOW_SUGGESTION");
  assert.equal(vendor.state, "REVIEW");
  assert.equal(vendor.autonomyLevel, "A1_SUGGEST");
  assert.equal(vendor.approvalRequired, true);
  assert.ok(vendor.sourceRefs.includes("Shadow:synthetic-s1"));
  const rejected = one({ conversation: { ...base().conversation, action: "VERIFY_CONTACT" },
    shadows: [{ ...shadow(["FOLLOW_UP_EMAIL"]), reviewStatus: "REJECTED" }] });
  assert.equal(rejected.nextAction, "VERIFY_CONTACT");
  assert.equal(rejected.reasonCodes.includes("SHADOW_CONFLICT_CORE_WINS"), false);
  const modelDnc = one({ conversation: { ...base().conversation, action: null },
    shadows: [shadow([], "DNC_SIGNAL")] });
  assert.equal(modelDnc.state, "REVIEW");
  assert.equal(modelDnc.autonomyLevel, "A1_SUGGEST");
  assert.equal(modelDnc.reasonCodes.includes("HARD_STOP"), false);
  assert.ok(modelDnc.reasonCodes.includes("SHADOW_DNC_CANDIDATE"));
});

test("legacy reference cases 4-5, 10-13: solicitation and relationship suggestions remain reviewable", () => {
  const noCoreAction = { ...base().conversation, action: null, dueDate: null };
  const activeBid = one({ conversation: noCoreAction,
    shadows: [shadow(["CONTINUE_BID_SUBMISSION"], "ACTIVE_SOLICITATION_INSTRUCTION")] });
  assert.equal(activeBid.nextAction, "CONTINUE_BID_SUBMISSION");
  assert.equal(activeBid.autonomyLevel, "A1_SUGGEST");
  assert.equal(activeBid.approvalRequired, true);
  const closedBid = one({ conversation: { ...noCoreAction, dueDate: "2026-10-10",
    waitingOn: "DATE" }, shadows: [shadow(["MONITOR_FUTURE_SOLICITATIONS"],
    "PROCUREMENT_FUTURE_OPPORTUNITY")] });
  assert.equal(closedBid.state, "SCHEDULED");
  assert.notEqual(closedBid.nextAction, "FOLLOW_UP_EMAIL");
  for (const semantic of ["POSSIBLE_REFERRAL", "WRONG_CONTACT"]) {
    const research = one({ conversation: noCoreAction,
      shadows: [shadow(["RESEARCH_BUYER"], semantic)] });
    assert.equal(research.nextAction, "RESEARCH_BUYER");
    assert.equal(research.state, "REVIEW");
  }
  for (const [action, semantic] of [["QUALIFY_CONVERSATION", "POSITIVE_INTEREST"],
    ["SCHEDULE_ASSESSMENT", "ASSESSMENT_INTEREST"]]) {
    const candidate = one({ conversation: noCoreAction, shadows: [shadow([action], semantic)] });
    assert.equal(candidate.nextAction, action);
    assert.equal(candidate.approvalRequired, true);
  }
});

test("legacy reference cases 6-8, 15, 28, 38: due policy uses dates and refuses missing source dates", () => {
  const future = one({ conversation: { ...base().conversation, action: "RECONTACT_AT_DATE",
    dueDate: "2026-10-10", waitingOn: "DATE" } });
  assert.equal(future.dueDate, "2026-10-10");
  assert.equal(future.dueAt, null);
  assert.equal(future.state, "SCHEDULED");
  const missing = one({ conversation: { ...base().conversation, action: "RECONTACT_AT_DATE",
    dueDate: null, waitingOn: "DATE", lastActivityAt: null, replyDate: null },
    duePolicies: { RECONTACT_AT_DATE: "EXTRACTED_DATE" } });
  assert.equal(missing.dueDate, null);
  assert.equal(missing.state, "REVIEW");
  assert.equal(missing.blocker, "MISSING_POLICY_DATE");
  assert.deepEqual(resolveWorkDueDate("NONE", context.today, null, null, null, null),
    { dueDate: null, missing: false });
  assert.equal(resolveWorkDueDate("NEXT_BUSINESS_DAY", context.today, null, null, null,
    context.today).dueDate, "2026-09-28");
  assert.equal(resolveWorkDueDate("NEXT_2_BUSINESS_DAYS", context.today, null, null, null,
    context.today).dueDate, "2026-09-29");
  assert.equal(resolveWorkDueDate("TODAY", context.today, null, null, null,
    "2026-09-24").dueDate, "2026-09-24");
  const acknowledgement = one({ conversation: { ...base().conversation, action: null },
    shadows: [shadow([], "ACKNOWLEDGEMENT_ONLY")] });
  assert.equal(acknowledgement.nextAction, "NO_ACTION");
  assert.equal(acknowledgement.state, "NO_ACTION");
  const ooo = one({ conversation: { ...base().conversation, action: null,
    dueDate: null, snoozedUntil: "2026-10-02", waitingOn: "DATE" },
    shadows: [shadow(["RECONTACT_AT_DATE"], "OUT_OF_OFFICE")],
    duePolicies: { RECONTACT_AT_DATE: "RETURN_DATE" } });
  assert.equal(ooo.dueDate, "2026-10-02");
  assert.equal(ooo.state, "SCHEDULED");
  const taskAnchored = one({ conversation: { ...base().conversation, action: null,
    dueDate: null, replyDate: null, lastActivityAt: null },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "FOLLOW_UP_EMAIL", status: "TODO",
      ownerRef: "owner-a", createdAt: "2026-09-24T10:00:00Z" }],
    duePolicies: { FOLLOW_UP_EMAIL: "NEXT_BUSINESS_DAY" } });
  assert.equal(taskAnchored.dueDate, "2026-09-25");
  assert.equal(taskAnchored.blocker, null);
});

test("legacy reference cases 16-20, 29, 45, 69, 71: owner due follow-up outranks customer wait", () => {
  const followup = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
    dueDate: "2026-10-02", waitingOn: "CUSTOMER" } });
  assert.equal(followup.state, "SCHEDULED");
  assert.equal(projectWorkViews([followup], context.today).today.length, 0);
  assert.equal(projectWorkViews([followup], context.today).followUps.length, 1);
  const due = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
    dueDate: context.today, waitingOn: "CUSTOMER" } });
  assert.equal(due.state, "NEEDS_ACTION");
  assert.equal(projectWorkViews([due], context.today).today.length, 1);
  const wait = one({ conversation: { ...base().conversation, action: "NO_ACTION",
    dueDate: null, state: "WAITING_FOR_REPLY", waitingOn: "CUSTOMER" } });
  assert.equal(wait.state, "WAITING");
  assert.equal(projectWorkViews([wait], context.today).today.length, 0);
  const snoozed = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
    snoozedUntil: "2026-10-01" } });
  assert.equal(snoozed.state, "SCHEDULED");
  assert.equal(projectWorkViews([snoozed], context.today).today.length, 0);
  const dueSnooze = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
    snoozedUntil: context.today } });
  assert.equal(dueSnooze.state, "NEEDS_ACTION");
  const taskSnooze = one({ conversation: { ...base().conversation, action: null },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "FOLLOW_UP_EMAIL", status: "TODO",
      ownerRef: "owner-a", snoozedUntil: "2026-10-01" }] });
  assert.equal(taskSnooze.state, "SCHEDULED");
  assert.equal(projectWorkViews([taskSnooze], context.today).today.length, 0);
  const overdue = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
    dueDate: "2026-09-20", priority: "HIGH", lastActivityAt: "2026-09-20" } });
  const recent = one({ conversation: { ...base().conversation, priority: "LOW",
    lastActivityAt: "2026-09-25" } });
  assert.equal([recent, overdue].sort(compareWorkAttention)[0], overdue);
  const taskWait = one({ conversation: { ...base().conversation, action: null },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "FOLLOW_UP_EMAIL", status: "WAITING",
      ownerRef: "owner-a" }] });
  assert.equal(taskWait.state, "WAITING");
});

test("legacy reference cases 9, 33, 72-76, 90-94, 114-128: commercial exclusion and identity authority", () => {
  const outbound = { ...base().conversation, action: "FOLLOW_UP_EMAIL", dueDate: context.today };
  const dnc = one({ conversation: outbound, contactDnc: true });
  assert.equal(dnc.nextAction, "NO_ACTION");
  assert.equal(dnc.state, "REVIEW");
  assert.equal(dnc.autonomyLevel, "A5_NEVER_AUTO");
  assert.equal(projectWorkViews([dnc], context.today).followUps.length, 0);
  const dncOverRed = one({ conversation: outbound, contactDnc: true,
    account: { ...base().account, exclusion: "RED" } });
  assert.equal(dncOverRed.blocker, "HARD_STOP");
  for (const exclusion of ["RED", "HOLD"]) {
    const item = one({ conversation: outbound, account: { ...base().account, exclusion } });
    assert.equal(item.nextAction, "NO_ACTION");
    assert.equal(item.autonomyLevel, "A5_NEVER_AUTO");
    assert.ok(item.reasonCodes.includes(exclusion === "RED" ?
      "COMMERCIAL_EXCLUSION_EXISTING_ACCOUNT" : "COMMERCIAL_EXCLUSION_HOLD"));
  }
  const unknownDue = one({ conversation: outbound,
    account: { ...base().account, exclusion: "UNKNOWN" } });
  assert.equal(unknownDue.state, "REVIEW");
  assert.equal(unknownDue.blocker, "EXCLUSION_RECONCILIATION");
  assert.equal(unknownDue.autonomyLevel, "A1_SUGGEST");
  assert.equal(projectWorkViews([unknownDue], context.today).followUps.length, 1);
  const unknownOverdue = one({ conversation: { ...outbound, dueDate: "2026-09-20" },
    account: { ...base().account, exclusion: "UNKNOWN" } });
  assert.equal(unknownOverdue.state, "REVIEW");
  assert.equal(unknownOverdue.attentionClass, "OVERDUE");
  const unknownFuture = one({ conversation: { ...outbound, dueDate: "2026-10-02",
    waitingOn: "CUSTOMER" }, account: { ...base().account, exclusion: "UNKNOWN" } });
  assert.equal(unknownFuture.state, "SCHEDULED");
  assert.equal(unknownFuture.autonomyLevel, "A2_PREPARE");
  assert.equal(unknownFuture.humanReviewRequired, true);
  assert.equal(projectWorkViews([unknownFuture], context.today).today.length, 0);
  const noIdentity = one({ conversation: outbound, account: undefined });
  assert.equal(noIdentity.state, "REVIEW");
  assert.equal(noIdentity.blocker, "MISSING_CRITICAL_IDENTITY");
  assert.equal(noIdentity.autonomyLevel, "A1_SUGGEST");
  assert.equal(noIdentity.reasonCodes.includes("EXCLUSION_RECONCILIATION"), false);
  const missingContact = one({ conversation: { ...outbound, action: "SEND_INFORMATION" },
    contactRef: null });
  assert.equal(missingContact.state, "BLOCKED");
  assert.equal(missingContact.blocker, "MISSING_CONTACT");
  assert.equal(missingContact.autonomyLevel, "A1_SUGGEST");
  const parent = one({ conversation: outbound,
    terminalParentRefs: ["Accounts:synthetic-a1"] });
  assert.equal(parent.state, "REVIEW");
  assert.equal(parent.blocker, "PARENT_TERMINAL_CONFLICT");
  assert.equal(projectWorkViews([parent], context.today).followUps.length, 0);
  const parentUnknown = one({ conversation: outbound,
    account: { ...base().account, exclusion: "UNKNOWN" },
    terminalParentRefs: ["Accounts:synthetic-a1"] });
  assert.equal(parentUnknown.blocker, "PARENT_TERMINAL_CONFLICT");
  assert.deepEqual(compileWorkCase(context, { ...base(), conversation: undefined,
    account: { ...base().account, exclusion: "AMBER" } }), []);
});

test("legacy reference action sets: outbound exclusions and follow-up projection use proven vocabulary", () => {
  for (const action of ["FOLLOW_UP_PROPOSAL", "RECONTACT_AT_DATE"]) {
    const blocked = one({ conversation: { ...base().conversation, action, dueDate: "2026-10-02" },
      account: { ...base().account, exclusion: "RED" } });
    assert.equal(blocked.nextAction, "NO_ACTION");
    assert.equal(blocked.autonomyLevel, "A5_NEVER_AUTO");
  }
  for (const action of ["FOLLOW_UP_PROPOSAL", "RECONTACT_AT_DATE",
    "MONITOR_FUTURE_SOLICITATIONS", "REVIEW_REACTIVATION"]) {
    const scheduled = one({ conversation: { ...base().conversation, action,
      dueDate: "2026-10-02", waitingOn: "DATE" } });
    assert.equal(projectWorkViews([scheduled], context.today).followUps.length, 1);
  }
  const call = one({ conversation: { ...base().conversation, action: "CALL" } });
  assert.equal(projectWorkViews([call], context.today).followUps.length, 0);
});

test("legacy reference cases 21-26, 40, 48, 53, 106-107: Task/core/Shadow precedence and conflict audit", () => {
  const withTask = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL" },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "VERIFY_CONTACT", status: "TODO",
      ownerRef: "owner-a" }], shadows: [shadow(["SEND_INFORMATION"])] });
  assert.equal(withTask.nextAction, "VERIFY_CONTACT");
  assert.equal(withTask.state, "REVIEW");
  assert.ok(withTask.reasonCodes.includes("CORE_TASK_CONFLICT"));
  assert.ok(withTask.reasonCodes.includes("SHADOW_CONFLICT_CORE_WINS"));
  assert.deepEqual(withTask.sourceRefs.filter(ref => ref.startsWith("Tasks:")), ["Tasks:t1"]);
  const noShadow = one({ conversation: { ...base().conversation, action: "QUALIFY_CONVERSATION" } });
  assert.equal(noShadow.nextAction, "QUALIFY_CONVERSATION");
  const multiple = one({ conversation: { ...base().conversation, action: null },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "VERIFY_CONTACT", status: "TODO",
      dueDate: context.today, ownerRef: "owner-a", priority: "LOW" },
    { id: "t2", ref: "Tasks:t2", action: "FOLLOW_UP_EMAIL", status: "TODO",
      dueDate: "2026-10-02", ownerRef: "owner-b", priority: "HIGH" }] });
  assert.equal(multiple.nextAction, "REVIEW_WORK_STATE");
  assert.equal(multiple.state, "REVIEW");
  assert.equal(multiple.blocker, "MULTIPLE_ACTIVE_TASKS");
  assert.equal(multiple.priority, "HIGH");
  for (const code of ["TASK_DUE_CONFLICT", "TASK_PRIORITY_CONFLICT",
    "TASK_OWNER_CONFLICT", "TASK_ACTION_CONFLICT"]) assert.ok(multiple.reasonCodes.includes(code));
  assert.ok(multiple.sourceRefs.includes("Tasks:t1"));
  assert.ok(multiple.sourceRefs.includes("Tasks:t2"));
  const coreConflict = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL" },
    pursuit: { ref: "Pursuits:p1", action: "VERIFY_CONTACT" } });
  assert.equal(coreConflict.nextAction, "REVIEW_WORK_STATE");
  assert.equal(coreConflict.state, "REVIEW");
  assert.ok(coreConflict.reasonCodes.includes("CORE_ACTION_CONFLICT"));
});

test("legacy reference cases 64-68: attributable link precedence and ambiguous link fail closed", () => {
  const links = { pursuitRef: "PURSUIT:p1",
    reverseConversationRefs: ["CONVERSATION:c1"],
    threadConversationRefs: ["CONVERSATION:c2"],
    accountContactConversationRefs: ["CONVERSATION:c3"] };
  assert.deepEqual(resolvePursuitWorkAnchor({ ...links,
    acceptedConversationRef: "CONVERSATION:explicit" }),
    { anchorRef: "CONVERSATION:explicit", ambiguousConversationLink: false });
  assert.deepEqual(resolvePursuitWorkAnchor(links),
    { anchorRef: "CONVERSATION:c1", ambiguousConversationLink: false });
  const ambiguous = resolvePursuitWorkAnchor({ ...links,
    reverseConversationRefs: ["CONVERSATION:c1", "CONVERSATION:c2"] });
  assert.deepEqual(ambiguous, { anchorRef: "PURSUIT:p1", ambiguousConversationLink: true });
  const work = one({ anchorRef: ambiguous.anchorRef,
    ambiguousConversationLink: ambiguous.ambiguousConversationLink });
  assert.equal(work.state, "REVIEW");
  assert.equal(work.blocker, "AMBIGUOUS_CONVERSATION_LINK");
  const grouped = { ...base(),
    conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
      dueDate: "2026-10-02", waitingOn: "CUSTOMER" },
    pursuit: { ref: "Pursuits:p1", action: "FOLLOW_UP_EMAIL" },
    tasks: [{ id: "t1", ref: "Tasks:t1", action: "FOLLOW_UP_EMAIL",
      status: "TODO", ownerRef: "owner-a", dueDate: "2026-10-02" }] };
  const current = compileWork(context, [grouped]);
  assert.equal(current.length, 1);
  assert.equal(current[0].state, "SCHEDULED");
  for (const ref of ["Accounts:synthetic-a1", "Conversations:synthetic-c1",
    "Pursuits:p1", "Tasks:t1"]) assert.ok(current[0].sourceRefs.includes(ref));
  assert.equal(compileWork({ ...context, today: "2026-10-02" }, [grouped])[0].workKey,
    current[0].workKey);
});

test("legacy reference cases 21-24, 43, 77-78: stable replay, changed fingerprint and supersession", () => {
  const first = one({});
  assert.equal(first.workKey, one({}).workKey);
  const initial = reconcileWork([first], [], context.runId, context.at);
  assert.equal(initial.audit[0].operation, "CREATE");
  const replay = reconcileWork([one({})], initial.rows, "run-2", at2);
  assert.equal(replay.audit[0].operation, "NOOP");
  assert.equal(replay.rows[0].recordedAt, context.at);
  const changed = one({ conversation: { ...base().conversation, priority: "HIGH" } });
  const updated = reconcileWork([changed], initial.rows, "run-3", at2);
  assert.equal(updated.audit[0].operation, "UPDATE");
  assert.notEqual(updated.rows[0].fingerprint, initial.rows[0].fingerprint);
  const replacement = one({ conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL" } });
  const replaced = reconcileWork([replacement], initial.rows, "run-4", at2);
  assert.equal(replaced.rows.find(row => row.nextAction === "REVIEW_REPLY").state, "SUPERSEDED");
  assert.equal(replaced.rows.find(row => row.nextAction === "FOLLOW_UP_EMAIL")
    .supersedesWorkItemId, initial.rows[0].id);
  assert.equal(replaced.audit.some(entry => entry.operation === "SUPERSEDE"), true);
  const supersedeAudit = replaced.audit.find(entry => entry.operation === "SUPERSEDE");
  assert.notEqual(supersedeAudit.previousFingerprint, supersedeAudit.newFingerprint);
  const gone = reconcileWork([], initial.rows, "run-5", at2);
  assert.ok(gone.rows[0].reasonCodes.includes("SOURCE_NO_LONGER_ACTIVE"));
  assert.equal(reconcileWork([], gone.rows, "run-6", at2).audit.length, 0);
  const reappeared = reconcileWork([one({})], gone.rows, "run-7", at2);
  assert.equal(reappeared.audit[0].operation, "UPDATE");
  assert.equal(reappeared.rows[0].workKey, first.workKey);
});

test("legacy reference cases 95-102, 104-109: terminal Task history and new cycle remain attributable", () => {
  const task = { id: "t1", ref: "Tasks:t1", action: "FOLLOW_UP_EMAIL", status: "DONE",
    completedAt: "2026-09-25T10:00:00Z", createdAt: "2026-09-24T10:00:00Z",
    completionOutcome: "SYNTHETIC_DONE" };
  const stale = compileWorkCase(context, { ...base(),
    conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
      lastActivityAt: "2026-09-24T09:00:00Z" }, tasks: [task] });
  assert.equal(stale[0].state, "DONE");
  assert.equal(stale[0].completionOutcome, "SYNTHETIC_DONE");
  const renewed = compileWorkCase(context, { ...base(),
    conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
      lastActivityAt: "2026-09-26T09:00:00Z" }, tasks: [task] });
  assert.equal(renewed.length, 2);
  assert.notEqual(renewed.find(row => row.state === "NEEDS_ACTION").workKey, stale[0].workKey);
  assert.equal(renewed.find(row => row.state === "DONE").taskId, "t1");
  const dateOnly = compileWorkCase(context, { ...base(),
    conversation: { ...base().conversation, action: "FOLLOW_UP_EMAIL",
      lastActivityAt: "2026-09-25T18:00:00Z" },
    tasks: [{ ...task, completedAt: "2026-09-25" }] });
  assert.equal(dateOnly[0].state, "DONE");
  const active = compileWorkCase(context, { ...base(),
    conversation: { ...base().conversation, action: "VERIFY_CONTACT" },
    tasks: [task, { ...task, id: "t2", ref: "Tasks:t2", action: "VERIFY_CONTACT",
      status: "TODO", createdAt: "2026-09-26T09:00:00Z" }] });
  assert.equal(active.find(row => row.taskId === "t2").state, "NEEDS_ACTION");
  assert.equal(active.find(row => row.taskId === "t1").state, "DONE");
  const orderedTerminal = compileWorkCase(context, { ...base(),
    conversation: { ...base().conversation, action: null },
    tasks: [{ ...task, completedAt: "2026-09-25T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z" },
    { ...task, id: "t2", ref: "Tasks:t2", status: "CANCELLED",
      completedAt: "2026-09-26T10:00:00Z", updatedAt: "2026-09-26T10:00:00Z" }] });
  assert.ok(orderedTerminal.find(row => row.taskId === "t1").sourceRefs.includes("Tasks:t2"));
  assert.equal(orderedTerminal.find(row => row.taskId === "t2").state, "CANCELLED");
});

test("legacy reference cases 30, 42, 50-52: missing identity, date and contact fail closed", () => {
  assert.equal(one({ account: { ...base().account, ownerRef: null } }).state, "REVIEW");
  const orphan = one({ anchorRef: "TASK:orphan", account: undefined,
    conversation: undefined, tasks: [{ id: "orphan", ref: "Tasks:orphan",
      action: "VERIFY_CONTACT", status: "TODO" }] });
  assert.equal(orphan.state, "REVIEW");
  assert.equal(orphan.blocker, "MISSING_CRITICAL_IDENTITY");
  const missingDate = one({ conversation: { ...base().conversation, action: "RECONTACT_AT_DATE",
    dueDate: null, waitingOn: "DATE" } });
  assert.equal(missingDate.state, "REVIEW");
  assert.equal(missingDate.evidenceNeeded, "SOURCE_DATE");
  const missingSnooze = one({ conversation: { ...base().conversation, state: "SNOOZED",
    snoozedUntil: null } });
  assert.equal(missingSnooze.state, "REVIEW");
  assert.equal(missingSnooze.blocker, "MISSING_SNOOZE_DATE");
});

test("static authority sensor: deterministic compiler has no model or Gmail writer dependency", () => {
  const source = readFileSync(new URL("../src/work.ts", import.meta.url), "utf8");
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(packageJson.dependencies, { "@drowk/contracts": "workspace:*" });
  assert.doesNotMatch(source, /(?:JEV|callJev|UrlFetchApp|GmailApp|MailApp|googleapis|createDraft|sendEmail|addLabel|removeLabel|ActionAttempt)/);
  for (const item of compileWork(context, [base()])) {
    assert.ok(["A0_OBSERVE", "A1_SUGGEST", "A2_PREPARE", "A5_NEVER_AUTO"]
      .includes(item.autonomyLevel));
  }
});
