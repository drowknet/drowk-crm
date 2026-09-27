import assert from "node:assert/strict";
import test from "node:test";

import {
  canAdvanceCursor,
  classifyTechnicalDirection,
  compareHistoryIds,
  mayEnterPromotionEvaluation,
  spamDoesNotDecideRelevance,
} from "../dist/index.js";

test("history IDs compare as arbitrary precision decimal strings", () => {
  assert.equal(compareHistoryIds("9", "10"), -1);
  assert.equal(compareHistoryIds("18446744073709551616", "18446744073709551615"), 1);
  assert.equal(compareHistoryIds("00042", "42"), 0);
});

test("draft overrides owned sender and never becomes sent", () => {
  const direction = classifyTechnicalDirection({
    messageId: "m1",
    threadId: "t1",
    labels: ["DRAFT"],
    fromOwnedIdentity: true,
    toOwnedIdentity: false,
  });

  assert.equal(direction, "DRAFT");
  assert.equal(mayEnterPromotionEvaluation(direction), false);
});

test("owned From without SENT remains unconfirmed", () => {
  assert.equal(
    classifyTechnicalDirection({
      messageId: "m2",
      threadId: "t2",
      labels: ["INBOX"],
      fromOwnedIdentity: true,
      toOwnedIdentity: false,
    }),
    "OUTBOUND_UNCONFIRMED",
  );
});

test("SENT is positive outbound technical evidence", () => {
  assert.equal(
    classifyTechnicalDirection({
      messageId: "m3",
      threadId: "t3",
      labels: ["SENT"],
      fromOwnedIdentity: true,
      toOwnedIdentity: false,
    }),
    "OUTBOUND_SENT",
  );
});

test("spam label alone never decides commercial irrelevance", () => {
  assert.equal(spamDoesNotDecideRelevance(["SPAM"]), "UNKNOWN");
});

test("cursor advances only from a PASS checkpoint with a proposed cursor", () => {
  assert.equal(
    canAdvanceCursor({
      connectorRef: "gmail",
      mailboxRef: "box",
      cursorBefore: "100",
      cursorAfter: "101",
      state: "PASS",
      reason: null,
    }),
    true,
  );

  assert.equal(
    canAdvanceCursor({
      connectorRef: "gmail",
      mailboxRef: "box",
      cursorBefore: "100",
      cursorAfter: "101",
      state: "PREPARED",
      reason: null,
    }),
    false,
  );
});
