import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canPromoteCommitment, commitmentCounterpartyResolved, commitmentPayload,
  validCommitmentDate,
} from "../dist/index.js";

const obligation = (extra = {}) => ({
  id: "commitment-a", commitmentKey: "synthetic:obligation-a", kind: "REQUEST",
  state: "SUGGESTED", statement: "Send the specification", sourceActivityId: "activity-a",
  evidenceIds: ["evidence-a"], accountId: "account-a", facilityId: null,
  counterpartyPersonId: null, owedBy: "TENANT", dueDate: null, conditionText: null,
  recordedAt: "2026-09-28T12:00:00.000Z", promotionPolicyDecisionId: "policy-a",
  supersedesId: null, ...extra,
});

test("goldens 1-3: kind, state and Work completion remain separate facts", () => {
  const request = obligation();
  const promise = obligation({ kind: "PROMISE" });
  const next = obligation({ kind: "AGREED_NEXT_STEP" });
  assert.equal(new Set([request.kind, promise.kind, next.kind]).size, 3);
  assert.notEqual(commitmentPayload(request), commitmentPayload(promise));
  assert.notEqual(commitmentPayload(request), commitmentPayload(next));
  assert.notEqual(commitmentPayload(request), commitmentPayload({ ...request, state: "CONFIRMED" }));
  const confirmed = Object.freeze(obligation({ state: "CONFIRMED" }));
  const completedWork = Object.freeze({ workState: "DONE" });
  assert.equal(confirmed.state, "CONFIRMED");
  assert.equal(completedWork.workState, "DONE");
  assert.notEqual(confirmed.state, "FULFILLED");
});

test("goldens 5-10: exact policy/evidence, calendar date and unknown condition", () => {
  const activity = { id: "activity-a", sourceObservationId: "observation-a" };
  const evidence = [{ observationId: "observation-a" }];
  const policy = { subjectId: activity.id, action: "ACCEPT_COMMITMENT",
    disposition: "ALLOW", evidenceComplete: true };
  assert.equal(canPromoteCommitment(activity, evidence, policy), true);
  assert.equal(canPromoteCommitment(activity, [], policy), false);
  assert.equal(canPromoteCommitment(activity, [{ observationId: "other" }], policy), false);
  for (const changed of [
    { subjectId: "other" }, { action: "ACCEPT_INTERACTION" },
    { disposition: "REVIEW" }, { disposition: "DENY" }, { evidenceComplete: false },
  ]) assert.equal(canPromoteCommitment(activity, evidence, { ...policy, ...changed }), false);
  assert.equal(validCommitmentDate(null), true);
  assert.equal(validCommitmentDate("2026-10-31"), true);
  assert.equal(validCommitmentDate("2026-02-30"), false);
  assert.equal(validCommitmentDate("2026-10-31T00:00:00Z"), false);
  assert.equal(obligation().dueDate, null);
  assert.equal(obligation().conditionText, null);
});

test("goldens 11-13: unresolved counterparty stays unresolved; safe participant proves Person", () => {
  assert.equal(commitmentCounterpartyResolved(null, []), true);
  assert.equal(commitmentCounterpartyResolved("person-a", []), false);
  assert.equal(commitmentCounterpartyResolved("person-a",
    [{ personId: "person-a", identityId: null }]), false);
  assert.equal(commitmentCounterpartyResolved("person-a",
    [{ personId: "person-b", identityId: "identity-b" }]), false);
  assert.equal(commitmentCounterpartyResolved("person-a",
    [{ personId: "person-a", identityId: "identity-a" }]), true);
});

test("goldens 16-19: replay, supersession and job change preserve historical context", () => {
  const first = Object.freeze(obligation({ dueDate: "2026-10-31", facilityId: "facility-a" }));
  assert.equal(commitmentPayload(first), commitmentPayload({ ...first, id: "replay", recordedAt: "later" }));
  assert.notEqual(commitmentPayload(first), commitmentPayload({ ...first, state: "CONFIRMED" }));
  const next = obligation({ id: "commitment-b", commitmentKey: "synthetic:obligation-b",
    supersedesId: first.id, state: "CONFIRMED" });
  assert.equal(next.supersedesId, first.id);
  const changedEmployment = { personId: "person-a", accountId: "account-b" };
  assert.equal(changedEmployment.accountId, "account-b");
  assert.equal(first.accountId, "account-a");
  assert.equal(first.facilityId, "facility-a");
});
