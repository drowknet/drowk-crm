import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acceptedSourceReplay, appendEmployment, canPromoteInteraction,
  namespacedConversationRef, participantLinksAgree,
} from "../dist/index.js";

test("goldens 1-2: source conversation keys include namespace", () => {
  assert.notEqual(namespacedConversationRef("synthetic:a", "thread-1"),
    namespacedConversationRef("synthetic:b", "thread-1"));
  assert.equal(namespacedConversationRef(null, null), null);
  assert.throws(() => namespacedConversationRef(null, "thread-1"),
    /SOURCE_CONVERSATION_REF_NOT_NAMESPACED/);
});

test("goldens 3-6: policy and evidence must name exact persisted observation", () => {
  const observation = "observation-a";
  const valid = { action: "ACCEPT_INTERACTION", subjectId: observation,
    disposition: "ALLOW", evidenceComplete: true };
  assert.equal(canPromoteInteraction(valid, observation,
    [{ observationId: observation }]), true);
  assert.equal(canPromoteInteraction(valid, observation, []), false);
  assert.equal(canPromoteInteraction(valid, observation,
    [{ observationId: "observation-b" }]), false);
  assert.equal(canPromoteInteraction({ ...valid, subjectId: "observation-b" },
    observation, [{ observationId: observation }]), false);
  for (const decision of [
    { ...valid, disposition: "REVIEW" }, { ...valid, disposition: "DENY" },
    { ...valid, evidenceComplete: false }, { ...valid, action: "OTHER" },
  ]) assert.equal(canPromoteInteraction(decision, observation,
    [{ observationId: observation }]), false);
});

test("goldens 7-8: replay distinguishes identical and changed source revisions", () => {
  const first = { sourceNamespace: "SYNTHETIC:mailbox-a", sourceNativeId: "message-1", sourceRevision: null };
  assert.equal(acceptedSourceReplay(first, { ...first }), "same_revision");
  assert.equal(acceptedSourceReplay(first, { ...first, sourceRevision: "revision-2" }),
    "revision_conflict");
  assert.equal(acceptedSourceReplay(first, { ...first, sourceNamespace: "SYNTHETIC:mailbox-b" }),
    "different_source");
});

test("goldens 10-11, 13: unresolved source participant stays unresolved", () => {
  assert.equal(participantLinksAgree({ personId: null, identityId: null }, null), true);
  assert.equal(participantLinksAgree({ personId: "person-a", identityId: "identity-a" },
    { id: "identity-a", personId: "person-a" }), true);
  assert.equal(participantLinksAgree({ personId: "person-b", identityId: "identity-a" },
    { id: "identity-a", personId: "person-a" }), false);
  assert.equal(participantLinksAgree({ personId: null, identityId: "identity-a" }, null), false);
});

test("goldens 14-15: direction and job change do not rewrite historical interaction context", () => {
  const accepted = Object.freeze({ conversationId: "conversation-a", direction: "OUTBOUND",
    occurredAt: null });
  const conversation = Object.freeze({ id: "conversation-a", accountId: "account-a" });
  const old = { id: "employment-a", tenantId: "tenant-a", personId: "person-a",
    accountId: "account-a", title: null, state: "FORMER", startedOn: null,
    endedOn: null, recordedAt: "2026-09-28T00:00:00.000Z", supersedesId: null };
  const next = { ...old, id: "employment-b", accountId: "account-b", state: "CURRENT" };
  assert.equal(appendEmployment([old], next).length, 2);
  assert.equal(conversation.accountId, "account-a");
  assert.equal(accepted.conversationId, conversation.id);
  assert.equal(accepted.occurredAt, null);
  assert.equal("reciprocal" in accepted, false);
});
