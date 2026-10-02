# DCRM-04A — Work Engine Contract Parity

Status: CLOSED — MERGED + POST-MERGE CI GREEN

## Closure evidence

- PR #8 merged into `foundation/drowk-crm-00`.
- Feature head: `966764fbc802459895c8c7eb15236aeaf851ce46`.
- Merge commit: `79594c5377d779685466c591aab8c0f5200cca12`.
- Exact-head CI `36363387085`: SUCCESS.
- Post-merge push CI `36364058535`: SUCCESS.
- Foundation/PR validation CI `36364061427`: SUCCESS.
- `verify`: SUCCESS.
- `postgres-foundation`: SUCCESS.
- No live Gmail/OAuth, outbound, JEV/model execution, Apps Script writer, deployment or higher-autonomy authority was opened.

Non-blocking later gate:
- `reconcileWork` is intentionally pure; a durable Work persistence writer must preserve atomic reconciliation and attributable history before any real writer is enabled.

## Objective

Port the proven deterministic Legacy Work Engine semantics into DROWK TypeScript
without carrying Sheet/App Script implementation details.

## Product/research guardrails

DCRM-04A remains a deterministic parity package. The 2026-09-27 market/relationship
research changes the boundaries around Work, but does not authorize a broad
Relationship Intelligence implementation inside this WP.

Preserve:
- Work != Activity history;
- Work != Commitment;
- Task != Commitment;
- seller effort != buyer-confirmed progress;
- observation/coverage gaps fail closed instead of becoming negative facts;
- no relationship-strength score or inferred trust belongs in deterministic Work compilation.

A future Commitment may cause Work, but this compiler must not fabricate a
Commitment from ambiguous communication or mark external fulfillment merely because
an internal WorkItem/Task completed.

If a legacy reference golden case proves an obligation/follow-up source, preserve its source,
reason, timing and authority semantics in Work without inventing a richer relationship
object than the fixture proves.

## First contract

Preserve:
- WorkState;
- AttentionClass;
- AutonomyLevel;
- source precedence;
- deterministic Work Key/fingerprint;
- supersession;
- human/core-over-Shadow conflict behavior;
- Commercial Exclusion hard stops;
- due-date non-invention;
- source watermark/policy version.

## Required golden cases

Extract the Legacy WP-02 regression suite into synthetic DROWK fixtures, including:
- inbound reply -> REVIEW_REPLY;
- vendor registration ordering;
- future known date -> SCHEDULED;
- required missing date -> REVIEW;
- acknowledgement -> NO_ACTION;
- DNC -> A5_NEVER_AUTO;
- hard bounce -> verify alternate channel;
- OOO return date -> scheduled recontact;
- future follow-up absent from TODAY;
- overdue work outranks recent low-priority work;
- customer wait -> WAITING;
- duplicate rerun -> same logical work;
- replaced action -> SUPERSEDED;
- core/human conflict with Shadow -> core wins + reason;
- missing Shadow still compiles;
- missing critical identity -> REVIEW;
- no JEV call path inside deterministic Work compilation;
- no Gmail write path inside Work compilation.

## Subagents

Use one writer plus:
- **work-parity-critic** — compare state/reason/action semantics;
- **golden-test-critic** — ensure old regressions are represented;
- **authority-critic** — verify A0-A5 and approvals do not broaden silently.

## Not a blocker for DCRM-01A

Contract/golden extraction can proceed in parallel. Full parity waits until the
canonical persistence layer is runnable.


## Current extraction status

Already preserved in DROWK contracts/schema:
- WorkState;
- AttentionClass;
- AutonomyLevel A0-A5;
- work key/source/fingerprint/supersession fields;
- source watermark and policy version.

Still required before DCRM-04A can close:
- deterministic Work compiler implementation;
- explicit source-precedence/conflict behavior;
- Legacy WP-02 golden fixture extraction;
- idempotency/supersession behavioral sensors;
- proof that deterministic compilation has no JEV/model or Gmail-write path.

## Post-parity architecture checkpoint

After DCRM-04A is green, re-inspect the executable canonical model before opening
richer buyer/research UI. The product canon now expects temporal Person, Identity,
Employment, Relationship, Buyer Role and Commitment semantics, but DCRM-04A must not
silently broaden itself to implement all of them.

The next package after parity should be chosen from repository state and measured
dependencies, not from feature-count pressure.
