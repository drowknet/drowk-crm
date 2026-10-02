# PWM WP-02 -> DCRM-04A deterministic parity

Source oracle (read only): `<owner-controlled legacy source workspace>` at
`main` / `775e0a52ceed63c9be9b756a2735e031265358a6`.
The PWM runtime closure records 131/131 synthetic behavior checks and a 93-item
read-only runtime verification. DCRM-04A does not invoke Apps Script or reproduce
Sheet writer/view-header mechanics.

The synthetic DROWK goldens in `packages/domain/test/work-golden.test.mjs` cover
the DCRM-04A work-package list: inbound reply, vendor ordering, future/missing
dates, acknowledgement, DNC, hard bounce, OOO, Today/Follow Ups attention,
customer wait, stable rerun, changed fingerprint, supersession, Task/core/Shadow
conflict, missing Shadow, missing identity, and static no-model/no-Gmail-writer
authority. Additional cases exercise commercial exclusion UNKNOWN/RED/HOLD,
terminal Task cycles, active Task conflict, parent terminal conflict and
attributable pursuit/conversation link precedence.

The domain boundary accepts normalized, attributable source candidates. It does
not parse PWM Sheet rows or infer an identity from a Gmail thread or shared
domain. `resolvePursuitWorkAnchor` uses upstream link candidates and fails
closed on ambiguous matches.

One intentional semantic difference is authority: PWM treated a Shadow-only
`DNC_SIGNAL` as a hard DNC state. DROWK keeps that model-derived label as a
review candidate; only accepted Contact/Conversation/Pursuit DNC can grant the
hard stop. It still suppresses outbound work while under review. This follows
the repository's Observation/Evidence-before-accepted-state invariant.

PWM due policies produce calendar dates. DCRM-04A adds `dueDate` and migration
`0004_work_due_date.sql`; `dueAt` is not populated with an invented midnight.
The compiler and reconciliation are pure candidates. A later persistence writer
must make reconciliation atomic and preserve audit history under the existing
unique work key constraint.
