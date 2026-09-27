# DCRM-04A — Work Engine Contract Parity

Status: CONTRACT EXTRACTED — COMPILER / GOLDEN PARITY PENDING

## Objective

Port the proven deterministic PWM Work Engine semantics into DROWK TypeScript
without carrying Sheet/App Script implementation details.

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

Extract the PWM WP-02 regression suite into synthetic DROWK fixtures, including:
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
- PWM WP-02 golden fixture extraction;
- idempotency/supersession behavioral sensors;
- proof that deterministic compilation has no JEV/model or Gmail-write path.
