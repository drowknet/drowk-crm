import assert from "node:assert/strict";
import { test } from "node:test";
import {
  currentParticipantHeads, namespacedConversationRef, participantCorrectionPreservesLineage,
  participantLinksAgree, sourceConversationReplay,
} from "../dist/index.js";

test("source Conversation identity includes channel and namespace, while context stays immutable", () => {
  const base = { channel: "EMAIL", sourceNamespace: "synthetic:mailbox-a",
    sourceConversationRef: "thread-1", accountId: "account-a", facilityId: "facility-a",
    supersedesId: null };
  assert.equal(sourceConversationReplay(base, { ...base }), "same_context");
  assert.equal(sourceConversationReplay(base, { ...base, sourceNamespace: "synthetic:mailbox-b" }),
    "different_source");
  assert.equal(sourceConversationReplay(base, { ...base, channel: "CHAT" }), "different_source");
  assert.equal(sourceConversationReplay(base, { ...base, accountId: "account-b" }),
    "context_conflict");
  assert.equal(sourceConversationReplay(base, { ...base, facilityId: "facility-b" }),
    "context_conflict");
  assert.equal(sourceConversationReplay(
    { ...base, sourceNamespace: null, sourceConversationRef: null },
    { ...base, sourceNamespace: null, sourceConversationRef: null }), "different_source");
  assert.notEqual(namespacedConversationRef("a:b", "c"),
    namespacedConversationRef("a", "b:c"));
});

test("participant correction preserves lineage; safe replacement and retraction are explicit", () => {
  const root = { id: "participant-a", tenantId: "tenant-a", activityId: "activity-a",
    role: "FROM", sourceParticipantNamespace: "synthetic:mailbox-a",
    sourceParticipantRef: "sender@example.invalid", personId: null, identityId: null,
    supersedesId: null };
  const resolved = { ...root, id: "participant-b", personId: "person-a",
    identityId: "identity-a", supersedesId: root.id };
  const corrected = { ...root, id: "participant-c", personId: "person-b",
    identityId: "identity-b", supersedesId: resolved.id };
  const retracted = { ...root, id: "participant-d", supersedesId: corrected.id };
  assert.equal(participantCorrectionPreservesLineage(root, resolved), true);
  assert.equal(participantCorrectionPreservesLineage(resolved, corrected), true);
  assert.equal(participantCorrectionPreservesLineage(corrected, retracted), true);
  for (const changed of [
    { ...resolved, tenantId: "tenant-b" }, { ...resolved, activityId: "activity-b" },
    { ...resolved, role: "TO" }, { ...resolved, sourceParticipantNamespace: "other" },
    { ...resolved, sourceParticipantRef: "other@example.invalid" },
  ]) assert.equal(participantCorrectionPreservesLineage(root, changed), false);
  assert.equal(participantLinksAgree(resolved,
    { id: "identity-a", personId: "person-a" }), true);
  assert.equal(participantLinksAgree({ ...resolved, identityId: null }, null), false);
  assert.equal(participantLinksAgree(corrected,
    { id: "identity-b", personId: "person-b" }), true);
  assert.equal(participantLinksAgree(retracted, null), true);
  assert.deepEqual(currentParticipantHeads([root, resolved, corrected, retracted]), [retracted]);
  const independent = { ...root, id: "participant-independent" };
  assert.deepEqual(currentParticipantHeads([root, resolved, corrected, retracted, independent]),
    [retracted, independent]);
  assert.throws(() => currentParticipantHeads([root, resolved,
    { ...retracted, supersedesId: root.id }]), /PARTICIPANT_HISTORY_INVALID_SUCCESSOR/);
  assert.throws(() => currentParticipantHeads([
    { id: "a", supersedesId: "b" }, { id: "b", supersedesId: "a" },
  ]), /PARTICIPANT_HISTORY_CYCLE/);
});
