import assert from "node:assert/strict";
import { test } from "node:test";
import {
  appendEmployment, appendIdentity, safePersonDecision, unlinkedContact,
  validEmploymentRange,
} from "../dist/index.js";

const person = "person-p";
const decision = (status, selectedEntityId = null, resolutionScope = "PERSON") =>
  ({ status, selectedEntityId, resolutionScope });

test("goldens 3-5: only a PERSON MATCHED_SAFE decision for exact target promotes", () => {
  assert.equal(safePersonDecision(decision("MATCHED_SAFE", person), person), true);
  for (const status of ["REVIEW_REQUIRED", "LINK_CONFLICT", "NO_MATCH",
    "INSUFFICIENT_STRONG_EVIDENCE", "BLOCKED_PARENT_REQUIRED"]) {
    assert.equal(safePersonDecision(decision(status, null), person), false);
  }
  assert.equal(safePersonDecision(decision("MATCHED_SAFE", "person-other"), person), false);
  assert.equal(safePersonDecision(decision("MATCHED_SAFE", person, "ACCOUNT"), person), false);
});

test("goldens 11-12: null Employment boundaries remain unknown; reversed known range fails", () => {
  assert.equal(validEmploymentRange({ startedOn: null, endedOn: null }), true);
  assert.equal(validEmploymentRange({ startedOn: null, endedOn: "2026-01-01" }), true);
  assert.equal(validEmploymentRange({ startedOn: "2026-01-01", endedOn: null }), true);
  assert.equal(validEmploymentRange({ startedOn: "2026-02-01", endedOn: "2026-01-01" }), false);
  assert.equal(validEmploymentRange({ startedOn: "2026-01-01", endedOn: "2026-01-01" }), true);
});

test("golden 2: Contact input projects no Person", () => {
  assert.deepEqual(unlinkedContact("tenant-a", {
    id: "contact-a", displayName: "Synthetic", recordedAt: "2026-09-27T00:00:00.000Z",
    supersedesId: null,
  }), {
    id: "contact-a", tenantId: "tenant-a", displayName: "Synthetic",
    recordedAt: "2026-09-27T00:00:00.000Z", supersedesId: null,
    personId: null, personMatchDecisionId: null,
  });
});

test("goldens 13-14: job change appends and preserves old Account and title", () => {
  const old = { id: "employment-old", tenantId: "tenant-a", personId: person,
    accountId: "account-a", title: "Former title", state: "FORMER",
    startedOn: null, endedOn: null, recordedAt: "2026-09-27T00:00:00.000Z",
    supersedesId: null };
  const next = { ...old, id: "employment-new", accountId: "account-b", title: null,
    state: "CURRENT" };
  const history = appendEmployment([old], next);
  assert.deepEqual(history, [old, next]);
  assert.notEqual(history, [old]);
  assert.equal(old.accountId, "account-a");
  assert.equal(next.title, null);
  assert.throws(() => appendEmployment([old], { ...next, personId: "other" }),
    /EMPLOYMENT_SUBJECT_MISMATCH/);
});

test("goldens 9-10: multiple identities keep history even with equal values", () => {
  const old = { id: "identity-old", tenantId: "tenant-a", personId: person,
    kind: "EMAIL", namespace: "synthetic:mail", normalizedValue: "shared@example.invalid",
    temporalState: "HISTORICAL", effectiveFrom: null, effectiveTo: null,
    matchDecisionId: "safe-a", recordedAt: "2026-09-27T00:00:00.000Z", supersedesId: null };
  const next = { ...old, id: "identity-new", temporalState: "CURRENT",
    matchDecisionId: "safe-b" };
  assert.deepEqual(appendIdentity([old], next), [old, next]);
  assert.equal(old.temporalState, "HISTORICAL");
  assert.throws(() => appendIdentity([old], { ...next, personId: "other" }),
    /IDENTITY_SUBJECT_MISMATCH/);
});
