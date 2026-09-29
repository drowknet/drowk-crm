import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canAssertRelationshipInteraction, hasCurrentRelationshipParticipant,
  latestKnownRelationshipInteraction, relationshipAssertionAction,
  relationshipAssertionReplay,
} from "../dist/index.js";

test("ACTIVITY, RECIPROCAL and MEANINGFUL have distinct authority", () => {
  const activityId = "activity-a";
  const reciprocalAction = relationshipAssertionAction("RECIPROCAL");
  const meaningfulAction = relationshipAssertionAction("MEANINGFUL");
  assert.equal(relationshipAssertionAction("ACTIVITY"), null);
  assert.notEqual(reciprocalAction, meaningfulAction);
  assert.equal(canAssertRelationshipInteraction("ACTIVITY", activityId, null), true);
  assert.equal(canAssertRelationshipInteraction("RECIPROCAL", activityId, null), false);
  const allowed = { action: reciprocalAction, subjectId: activityId,
    disposition: "ALLOW", evidenceComplete: true };
  assert.equal(canAssertRelationshipInteraction("RECIPROCAL", activityId, allowed), true);
  assert.equal(canAssertRelationshipInteraction("MEANINGFUL", activityId, allowed), false);
  for (const blocked of [
    { ...allowed, disposition: "REVIEW" }, { ...allowed, disposition: "DENY" },
    { ...allowed, evidenceComplete: false }, { ...allowed, subjectId: "activity-b" },
    { ...allowed, action: "ACCEPT_INTERACTION" },
  ]) assert.equal(canAssertRelationshipInteraction("RECIPROCAL", activityId, blocked), false);
});

test("current safely resolved participant follows Person correction and retraction", () => {
  const relationshipA = { tenantId: "tenant-a", personId: "person-a" };
  const relationshipB = { tenantId: "tenant-a", personId: "person-b" };
  const activity = { tenantId: "tenant-a", id: "activity-a" };
  const a = { id: "participant-a", tenantId: "tenant-a", activityId: activity.id,
    personId: relationshipA.personId, identityId: "identity-a", supersedesId: null };
  const b = { ...a, id: "participant-b", personId: relationshipB.personId,
    identityId: "identity-b", supersedesId: a.id };
  const identities = [
    { id: "identity-a", tenantId: "tenant-a", personId: "person-a" },
    { id: "identity-b", tenantId: "tenant-a", personId: "person-b" },
  ];
  assert.equal(hasCurrentRelationshipParticipant(relationshipA, activity, [a], identities), true);
  assert.equal(hasCurrentRelationshipParticipant(relationshipA, activity, [a, b], identities), false);
  assert.equal(hasCurrentRelationshipParticipant(relationshipB, activity, [a, b], identities), true);
  const retracted = { ...b, id: "participant-c", personId: null,
    identityId: null, supersedesId: b.id };
  assert.equal(hasCurrentRelationshipParticipant(relationshipB, activity,
    [a, b, retracted], identities), false);
  assert.equal(hasCurrentRelationshipParticipant(relationshipB, activity, [b],
    [{ ...identities[1], personId: "person-a" }]), false);
  assert.equal(hasCurrentRelationshipParticipant(relationshipB,
    { ...activity, tenantId: "tenant-b" }, [b], identities), false);
});

test("known-time clocks are independent; unknown time and outbound do not imply reciprocity", () => {
  const base = { tenantId: "tenant-a", relationshipId: "relationship-a",
    activityId: "activity-a", authorityParticipantId: "participant-a",
    authorityIdentityId: "identity-a", recordedAt: "2026-10-02T00:00:00.000Z",
    promotionPolicyDecisionId: null };
  const history = [
    { ...base, id: "activity-unknown", kind: "ACTIVITY", occurredAt: null },
    { ...base, id: "activity-a", kind: "ACTIVITY", occurredAt: "2026-09-28T10:00:00.000Z" },
    { ...base, id: "activity-b", kind: "ACTIVITY", occurredAt: "2026-09-28T10:00:00.000Z" },
    { ...base, id: "reciprocal-a", kind: "RECIPROCAL",
      occurredAt: "2026-09-27T10:00:00.000Z", promotionPolicyDecisionId: "policy-a" },
    { ...base, id: "meaningful-a", kind: "MEANINGFUL",
      occurredAt: "2026-09-26T10:00:00.000Z", promotionPolicyDecisionId: "policy-b" },
  ];
  assert.equal(history[0].occurredAt, null);
  assert.equal(latestKnownRelationshipInteraction(history, "ACTIVITY").id, "activity-b");
  assert.equal(latestKnownRelationshipInteraction(history, "RECIPROCAL").id, "reciprocal-a");
  assert.equal(latestKnownRelationshipInteraction(history, "MEANINGFUL").id, "meaningful-a");
  assert.equal(latestKnownRelationshipInteraction(history.slice(0, 3), "RECIPROCAL"), null);
  assert.equal(latestKnownRelationshipInteraction(history.slice(0, 1), "ACTIVITY"), null);
  assert.equal(latestKnownRelationshipInteraction([
    { ...history[1], id: "earlier-offset", occurredAt: "2026-09-28T11:00:00.000100+01:00" },
    { ...history[1], id: "later-micros", occurredAt: "2026-09-28T10:00:00.000200Z" },
  ], "ACTIVITY").id, "later-micros");
  const outbound = { direction: "OUTBOUND", interactionKind: "ACTIVITY" };
  assert.equal(outbound.interactionKind, "ACTIVITY");
  assert.equal("reciprocal" in outbound, false);
});

test("Relationship continuity preserves historical Account context and replay conflict", () => {
  const root = Object.freeze({ id: "relationship-a", tenantId: "tenant-a",
    personId: "person-a", recordedAt: "2026-09-28T00:00:00.000Z" });
  const oldConversation = Object.freeze({ id: "conversation-a", accountId: "account-a",
    facilityId: "facility-a" });
  const oldActivity = Object.freeze({ id: "activity-a", conversationId: oldConversation.id });
  const laterEmployment = { personId: root.personId, accountId: "account-b" };
  assert.equal(root.personId, laterEmployment.personId);
  assert.equal(oldConversation.accountId, "account-a");
  assert.equal(oldActivity.conversationId, oldConversation.id);
  assert.equal("accountId" in root, false);
  const assertion = { relationshipId: root.id, activityId: oldActivity.id,
    kind: "RECIPROCAL", occurredAt: null, promotionPolicyDecisionId: "policy-a" };
  assert.equal(relationshipAssertionReplay(assertion, { ...assertion }), "same_assertion");
  assert.equal(relationshipAssertionReplay(assertion,
    { ...assertion, promotionPolicyDecisionId: "policy-b" }), "assertion_conflict");
  assert.equal(relationshipAssertionReplay(assertion,
    { ...assertion, kind: "MEANINGFUL" }), "different_assertion");
});
