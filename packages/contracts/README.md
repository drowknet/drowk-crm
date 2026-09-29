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

## Human continuity compatibility

DCRM-04B adds tenant-scoped Person, canonical Identity and Employment contracts.
`Contact` now exposes nullable `personId` and `personMatchDecisionId`. Migration
`0005_human_continuity.sql` leaves existing Contacts valid and unlinked;
repository creation also starts unlinked. Consumers must allow both fields to
be null. An explicit link requires a `PERSON`-scoped `MATCHED_SAFE` decision
selecting that exact Person. IdentityEvidence and EntityMatchDecision remain
distinct from canonical Identity.

## Accepted interaction compatibility

DCRM-04C adds provider-neutral Conversation, Activity and ActivityParticipant
contracts without changing SourceObservation, Evidence or the Gmail candidate
boundary. A Conversation source ref and an unresolved participant ref both
require a namespace. `occurredAt` remains null when source time is unknown.
Activity Evidence IDs and a source-scoped `ACCEPT_INTERACTION` PolicyDecision are
required for accepted promotion. One stable `(tenant, source namespace, native ID)`
has one accepted Activity in this package; another source revision conflicts
instead of updating accepted history.
