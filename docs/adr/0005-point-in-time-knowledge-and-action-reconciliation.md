# ADR 0005 — Point-in-Time Knowledge and External Action Reconciliation

Status: ACCEPTED FOR FOUNDATION

## Context

DROWK must evaluate historical decisions using only information that was known at
the time. It must also survive ambiguous external side effects such as a Gmail
request being accepted immediately before a worker crashes.

## Decision

1. Material evidence/derived state distinguishes:
   - `effective_at`: when the statement applied in the source world, if known;
   - `recorded_at`: when DROWK learned/recorded it;
   - `retrieved_at`: when DROWK retrieved the source, where applicable.
2. Unknown source time remains unknown.
3. Historical evaluation excludes evidence whose `recorded_at` is after the
   decision timestamp.
4. Accepted CRM state is a current projection over attributable evidence/history.
5. Risky actions fail closed on ambiguity, but evidence collection/research may
   continue.
6. External execution is represented by `ActionAttempt`.
7. If an external side effect cannot be proven successful or failed after a crash,
   timeout or ambiguous response, the attempt enters `UNKNOWN` and must be
   reconciled. A retry is not automatically authorized.

## Consequences

- Outcome learning can avoid future-information leakage.
- Corrections do not require rewriting what DROWK knew previously.
- Queue/workflow engines remain replaceable implementation details.
- Exactly-once database/job claims do not become exactly-once external effects.
- Gmail and future provider writes require receipt/reconciliation semantics.
