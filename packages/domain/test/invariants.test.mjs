import assert from "node:assert/strict";
import test from "node:test";

import {
  actionAttemptRequiresReconciliation,
  evidenceApplicabilityAt,
  evidenceWasKnownAt,
  identityDecisionCanLink,
  policyAllowsExecution,
} from "../dist/index.js";

test("identity ambiguity never authorizes a canonical link", () => {
  assert.equal(
    identityDecisionCanLink({ status: "REVIEW_REQUIRED", selectedEntityId: null }),
    false,
  );

  assert.equal(
    identityDecisionCanLink({ status: "MATCHED_SAFE", selectedEntityId: "entity-1" }),
    true,
  );
});

test("future knowledge is excluded from point-in-time replay", () => {
  const evidence = {
    recordedAt: "2026-03-15T00:00:00.000Z",
    effectiveAt: "2026-01-05T00:00:00.000Z",
  };

  assert.equal(evidenceWasKnownAt(evidence, "2026-01-20T00:00:00.000Z"), false);
  assert.equal(evidenceWasKnownAt(evidence, "2026-03-16T00:00:00.000Z"), true);
  assert.equal(evidenceApplicabilityAt(evidence, "2026-01-20T00:00:00.000Z"), "YES");
});

test("unknown effective time remains unknown", () => {
  assert.equal(
    evidenceApplicabilityAt({ effectiveAt: null }, "2026-01-20T00:00:00.000Z"),
    "UNKNOWN",
  );
});

test("policy requires explicit allow plus evidence completeness", () => {
  assert.equal(policyAllowsExecution({ disposition: "ALLOW", evidenceComplete: true }), true);
  assert.equal(policyAllowsExecution({ disposition: "ALLOW", evidenceComplete: false }), false);
  assert.equal(policyAllowsExecution({ disposition: "REVIEW", evidenceComplete: true }), false);
});

test("uncertain external execution requires reconciliation", () => {
  assert.equal(actionAttemptRequiresReconciliation({ state: "UNKNOWN" }), true);
  assert.equal(actionAttemptRequiresReconciliation({ state: "DISPATCHING" }), true);
  assert.equal(actionAttemptRequiresReconciliation({ state: "ACCEPTED" }), false);
});
