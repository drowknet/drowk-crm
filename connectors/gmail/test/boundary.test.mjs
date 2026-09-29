import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  deterministicRelevance,
  evaluatePromotionCandidate,
  finalizeHistoryCheckpoint,
  gmailSourceFingerprint,
  planHistorySync,
  toSourceObservation,
} from "../dist/index.js";

test("connector production imports expose only the contracts boundary", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  assert.deepEqual(packageJson.dependencies, { "@drowk/contracts": "workspace:*" });
  const sourceDirectory = fileURLToPath(new URL("../src/", import.meta.url));
  for (const name of readdirSync(sourceDirectory).filter((value) => value.endsWith(".ts"))) {
    const sourceText = readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8");
    assert.doesNotMatch(sourceText, /from ["'](?:@drowk\/(?:db|domain)|(?:googleapis|gmail))/, name);
  }
});

const source = {
  messageId: "synthetic-message-1", threadId: "synthetic-thread-1",
  providerRevision: null,
  messageDate: "2026-09-25T09:00:00.000Z",
  internalDate: "2026-09-25T09:00:01.000Z",
  retrievedAt: "2026-09-27T10:00:00.000Z",
  from: "sender@example.invalid", to: ["mailbox@example.invalid"], cc: [],
  subject: "Synthetic inquiry", labels: ["INBOX", "SPAM"],
  mailboxRef: "synthetic-mailbox", connectorRef: "synthetic-connector",
  sourceWatermark: "18446744073709551616", adapterVersion: "synthetic-v1",
  rawArtifactRef: "synthetic-artifact-ref",
};
const lineage = {
  id: "00000000-0000-4000-8000-000000000001",
  runId: "00000000-0000-4000-8000-000000000002",
  correlationId: "00000000-0000-4000-8000-000000000003",
  ingestedAt: "2026-09-27T10:00:01.000Z",
  recordedAt: "2026-09-27T10:00:02.000Z",
};

test("authoritative Gmail fields survive observation mapping without derived state", () => {
  const observation = toSourceObservation(source, lineage);
  assert.equal(observation.sourceSystem, "gmail");
  assert.equal(observation.sourceNativeId, source.messageId);
  assert.equal(observation.sourceMetadata.sourceNamespace,
    `gmail:${Buffer.byteLength(source.connectorRef, "utf8")}:${source.connectorRef}:${Buffer.byteLength(source.mailboxRef, "utf8")}:${source.mailboxRef}`);
  assert.equal(observation.sourceRevision, null);
  assert.equal(observation.sourceWatermark, source.sourceWatermark);
  assert.equal(observation.observedAt, source.messageDate);
  assert.equal(observation.effectiveAt, source.internalDate);
  assert.equal(observation.retrievedAt, source.retrievedAt);
  assert.equal(observation.rawArtifactRef, source.rawArtifactRef);
  assert.equal(observation.adapterVersion, source.adapterVersion);
  assert.deepEqual(observation.sourceMetadata.gmail, {
    messageId: source.messageId, threadId: source.threadId,
    providerRevision: null, messageDate: source.messageDate,
    internalDate: source.internalDate, from: source.from,
    to: source.to, cc: source.cc, subject: source.subject, labels: source.labels,
    mailboxRef: source.mailboxRef, connectorRef: source.connectorRef,
  });
  assert.match(observation.fingerprint, /^sha256:[a-f0-9]{64}$/);
  assert.equal("direction" in observation.sourceMetadata, false);
  assert.equal("relevance" in observation.sourceMetadata, false);
});

test("fingerprint changes with source state, not retrieval context", () => {
  assert.equal(gmailSourceFingerprint(source), gmailSourceFingerprint({
    ...source, retrievedAt: "2026-09-28T10:00:00.000Z",
    sourceWatermark: "18446744073709551617", labels: ["SPAM", "INBOX"],
  }));
  assert.notEqual(gmailSourceFingerprint(source), gmailSourceFingerprint({
    ...source, subject: "Changed synthetic inquiry",
  }));
  assert.notEqual(gmailSourceFingerprint(source), gmailSourceFingerprint({
    ...source, providerRevision: "revision-2",
  }));
});

test("relevance, linkage and policy stop at candidate boundary", () => {
  assert.equal(deterministicRelevance(null), "REVIEW");
  assert.equal(deterministicRelevance("AUTOMATED_TECHNICAL"), "NOT_RELEVANT");
  assert.deepEqual(evaluatePromotionCandidate("DRAFT", "RELEVANT", "CANDIDATE", "ALLOW_CANDIDATE"),
    { state: "BLOCKED", reason: "DRAFT" });
  assert.deepEqual(evaluatePromotionCandidate("INBOUND_CANDIDATE", "REVIEW", "CANDIDATE", "ALLOW_CANDIDATE"),
    { state: "REVIEW", reason: "RELEVANCE" });
  assert.deepEqual(evaluatePromotionCandidate("OUTBOUND_SENT", "RELEVANT", "UNRESOLVED", "ALLOW_CANDIDATE"),
    { state: "REVIEW", reason: "LINKAGE" });
  assert.deepEqual(evaluatePromotionCandidate("OUTBOUND_SENT", "RELEVANT", "CANDIDATE", "REVIEW"),
    { state: "REVIEW", reason: "POLICY" });
  assert.deepEqual(evaluatePromotionCandidate("OUTBOUND_SENT", "RELEVANT", "CANDIDATE", "ALLOW_CANDIDATE"),
    { state: "ELIGIBLE_CANDIDATE" });
});

test("expired and invalid history require controlled full scan with no invented cursor", () => {
  assert.deepEqual(planHistorySync("100"), { state: "INCREMENTAL", cursorBefore: "100" });
  assert.deepEqual(planHistorySync("100", "EXPIRED_HISTORY"), {
    state: "FULL_SCAN_REQUIRED", cursorBefore: "100", reason: "EXPIRED_HISTORY",
  });
  assert.deepEqual(planHistorySync("bad"), {
    state: "FULL_SCAN_REQUIRED", cursorBefore: "bad", reason: "INVALID_HISTORY",
  });
  assert.deepEqual(planHistorySync(null), {
    state: "FULL_SCAN_REQUIRED", cursorBefore: null, reason: "INITIAL_SCAN",
  });
});

test("only PASS with proposed cursor commits, stale completion conflicts, replay is stable", () => {
  const checkpoint = {
    connectorRef: "synthetic-connector", mailboxRef: "synthetic-mailbox",
    cursorBefore: "100", cursorAfter: "101", state: "PASS", reason: null,
  };
  assert.deepEqual(finalizeHistoryCheckpoint("100", checkpoint),
    { status: "committed", committedCursor: "101" });
  assert.deepEqual(finalizeHistoryCheckpoint("101", checkpoint),
    { status: "replayed", committedCursor: "101" });
  assert.deepEqual(finalizeHistoryCheckpoint("102", checkpoint),
    { status: "conflict", committedCursor: "102" });
  for (const state of ["PREPARED", "FAILED"]) {
    assert.deepEqual(finalizeHistoryCheckpoint("100", { ...checkpoint, state }),
      { status: "not_ready", committedCursor: "100" });
  }
  assert.deepEqual(finalizeHistoryCheckpoint("100", { ...checkpoint, cursorAfter: null }),
    { status: "not_ready", committedCursor: "100" });
  assert.deepEqual(finalizeHistoryCheckpoint("100", { ...checkpoint, cursorAfter: "99" }),
    { status: "conflict", committedCursor: "100" });
  assert.deepEqual(finalizeHistoryCheckpoint("100", { ...checkpoint, cursorAfter: "bad" }),
    { status: "conflict", committedCursor: "100" });
});
