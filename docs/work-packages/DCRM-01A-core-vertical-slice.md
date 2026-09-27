# DCRM-01A — Core Vertical Slice

Status: READY FOR IMPLEMENTATION / REVIEW

## Objective

Turn the DROWK-native architecture into a tested executable core without selecting
web/auth/workflow frameworks prematurely.

## In scope

- workspace builds from a clean install;
- contracts for Tenant, Account, Facility, Contact, SourceObservation, Evidence,
  identity decisions, ResearchRun/ProviderRun, PolicyDecision/Approval, WorkItem,
  ActionAttempt, Outcome and Event;
- PostgreSQL migration for the first persistence slice;
- point-in-time knowledge helpers;
- deterministic domain invariants;
- tenant-consistent foreign keys;
- synthetic tests only.

## Out of scope

- production deployment;
- production credentials/data;
- Gmail network calls;
- AIsa network calls;
- outbound messaging;
- auth-provider selection;
- queue/workflow-engine selection;
- ORM selection;
- UI framework selection beyond the existing direction.

## Acceptance sensors

1. Clean workspace build/typecheck succeeds.
2. Domain tests prove:
   - ambiguous identity cannot link;
   - future knowledge is excluded from historical replay;
   - unknown effective time stays unknown;
   - policy REVIEW/DENY cannot execute;
   - UNKNOWN/DISPATCHING external action requires reconciliation.
3. Database review proves tenant-owned foreign keys cannot cross tenant boundaries
   where relational targets are known.
4. Migration applies to a disposable PostgreSQL instance and rolls forward cleanly.
5. No secrets or production data enter fixtures.

## Codex workcell

Use one active writer. Spawn independent subagents when useful:

- **schema-critic**: migration integrity, temporal model, indexes, FK isolation;
- **security-critic**: tenant boundary, authority, secret exposure;
- **test-critic**: missing failure/replay cases.

Subagents should report findings rather than editing the writer's files concurrently.

## Next gate

After this slice is green, choose the smallest HTTP/runtime shell and PostgreSQL
migration runner needed to expose one real application use case. pg-boss vs DBOS,
auth provider and UI acceleration remain parallel bounded benchmarks, not blockers.
