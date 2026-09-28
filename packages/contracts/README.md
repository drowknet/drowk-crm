# Contracts

Stable cross-boundary contracts for DROWK CRM.

Candidate contents:
- IDs and tenant-scoped references;
- source/observation envelopes;
- evidence contracts;
- identity candidate/decision contracts;
- event envelopes;
- research/provider run contracts;
- policy/approval contracts;
- Work and Outcome contracts;
- connector/capability interfaces.

Contracts should be provider-neutral, versionable and serializable.

Do not place runtime clients, secrets, database handles or provider SDK objects
in this package.

## Work date compatibility

DCRM-04A adds `WorkItem.dueDate` as a date-only operational deadline while
retaining `dueAt` for genuine timestamp obligations. The addition is nullable in
PostgreSQL migration `0004_work_due_date.sql`; older rows remain valid with a
null `dueDate`. The deterministic Work compiler does not fabricate midnight in
`dueAt` from a calendar date.
