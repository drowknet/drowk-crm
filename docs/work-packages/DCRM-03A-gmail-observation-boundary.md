# DCRM-03A — Gmail Observation Boundary

Status: CLOSED — MERGED + POST-MERGE CI GREEN
Parent: `foundation/drowk-crm-00`
Legacy reference: `docs/reference-harvest/pwm-wp03-local-audit-2026-09-26.md`

## Closure evidence

- PR #6 merged into `foundation/drowk-crm-00`.
- Feature head: `fd4ed763fa704546d906e3e619e3a2c74a01c0e5`.
- Merge commit: `24df7cece88048fe7dcbb036343d3943c97d59a8`.
- Exact-head CI `36338743226`: SUCCESS.
- Post-merge CI `36341467573`: SUCCESS.
- `verify`: SUCCESS.
- `postgres-foundation`: SUCCESS, including Gmail observation persistence boundary.
- No live Gmail/OAuth, outbound, JEV/model, Apps Script writer or deployment authority was opened.

Non-blocking later gates remain:
- durable Gmail cursor state must use CAS/serialization;
- multi-mailbox source identity scope must be revalidated before live ingestion;
- deterministic noise categories must remain narrow enough to preserve commercial review.

## Product outcome

This work protects the future Inbox, Today cockpit, relationship timeline and
signal/work surfaces from treating mailbox state as CRM truth.

After this package, DROWK must be able to accept a synthetic Gmail message,
preserve attributable source state, classify only technical message state,
persist/replay the observation safely and stop before canonical CRM promotion.

It does **not** make Gmail live.

## Objective

Close the remaining synthetic Gmail observation boundary proven by PWM WP-03:

`Gmail source state -> SourceObservation -> technical/relevance candidate -> promotion candidate boundary`

without allowing the connector to create accepted Conversation, Activity, Contact,
Pursuit, Opportunity or Work state.

## Existing verified behavior

Already present in `connectors/gmail`:
- arbitrary-precision decimal History ID ordering;
- DRAFT precedence over sent/outbound inference;
- SENT as positive outbound technical evidence;
- owned From without SENT -> `OUTBOUND_UNCONFIRMED`;
- SPAM-neutral relevance semantics;
- PREPARED/PASS/FAILED cursor advancement gate;
- connector depends only on `@drowk/contracts`.

Preserve these sensors.

## Canonical Gmail observation input

Add the smallest provider-shaped contract needed to preserve authoritative source
state before interpretation.

Synthetic inputs must be able to preserve at least:
- Gmail Message ID;
- Gmail Thread ID;
- provider message/history revision when supplied;
- message/internal date when supplied;
- observation/retrieval time;
- From;
- To;
- Cc;
- Subject;
- labels/state;
- mailbox/connector reference;
- source watermark/history cursor context;
- adapter/parser version;
- deterministic content/state fingerprint;
- optional raw artifact reference.

Do not commit real mailbox/customer/prospect content to the repository.

Provider source fields and derived judgments must remain distinguishable.

## Mapping to SourceObservation

The connector may produce a bounded observation draft suitable for the existing
`SourceObservation` contract.

Required semantics:
- `sourceSystem = "gmail"`;
- `sourceNativeId = Gmail Message ID`;
- `sourceRevision` uses a provider-observed message/history revision only when one
  is actually available; never invent a provider revision;
- `sourceWatermark` preserves the mailbox sync/history context;
- `sourceMetadata` preserves Gmail-specific source fields needed for replay/audit
  without turning provider schemas into core CRM contracts;
- technical direction/relevance state remains derived output, not source truth;
- fingerprint is deterministic for the preserved source state.

No connector function may directly create accepted CRM projection objects.

## Replay and conflict semantics

Prove replay at the connector -> observation persistence boundary.

Required behavior:
1. exact replay of the same source identity/revision with the same fingerprint is
   idempotent and returns the existing observation;
2. exact replay does not append a second canonical source observation;
3. the same source identity/revision with a different fingerprint is **not**
   silently treated as idempotent;
4. changed fingerprint for the same identity/revision fails closed as an explicit
   conflict/review condition and does not overwrite prior observation;
5. a new explicit provider revision for the same Gmail Message ID may append a new
   source revision when the source actually changed;
6. when provider revision is unavailable/null, a changed fingerprint must conflict
   rather than being silently collapsed.

If needed, harden the existing PostgreSQL append result so
`already_exists` means a true replay rather than merely a uniqueness collision.

## Direction evidence

Preserve:
- DRAFT label blocks SENT classification;
- SENT label is positive evidence of an outbound sent message;
- From=owned identity without SENT is not sufficient for `OUTBOUND_SENT`;
- non-owned sender to an owned mailbox may be `INBOUND_CANDIDATE`;
- ambiguous cases remain ambiguous/reviewable.

`Draft != Sent`.
`Sent != Delivered`.
`From owner != Sent`.

## Spam and relevance

SPAM is mailbox state evidence, not commercial relevance.

Required boundary behavior:
- SPAM alone never forces `NOT_RELEVANT`;
- known deterministic technical/noise categories may be bounded before semantic
  judgment;
- ambiguous commercial cases remain `REVIEW`/`UNKNOWN`;
- no JEV/model call belongs in this package;
- relevance output may create only a promotion **candidate**, never accepted CRM
  state.

## Promotion boundary

Expose an explicit candidate-only decision boundary.

The connector may say that an observation is:
- blocked from promotion evaluation;
- requires relevance/human review;
- eligible to become a downstream promotion candidate.

It may not:
- create/update Conversation;
- create/update Activity;
- create/update Contact/Account;
- create/update Pursuit/Opportunity;
- create Work;
- send/draft mail;
- perform identity merge.

A candidate is not accepted projection authority.

## History cursor and controlled recovery

Model recovery semantics without network access.

Required states:
- valid cursor -> bounded incremental plan;
- expired/invalid History cursor -> explicit recovery/full-scan-required state;
- recovery reason is preserved;
- no invented replacement cursor;
- a proposed cursor may become committed only after the bounded observation work is
  proven PASS;
- PREPARED/FAILED checkpoints cannot advance the committed cursor;
- concurrent/replayed completion cannot produce contradictory committed state.

This package may define pure planning/finalization functions and synthetic
checkpoint contracts. It must not call Gmail.

## Required pipeline

```text
enumerate source candidate
-> preserve source observation
-> persist/replay source observation
-> classify technical message state
-> deterministic relevance boundary
-> identity/linkage candidate boundary
-> policy-controlled promotion candidate
```

The arrow after promotion candidate is outside DCRM-03A.

## Acceptance sensors

Deterministic/synthetic tests must prove at least:

1. History IDs compare without JavaScript Number precision loss;
2. Draft + owned From never becomes `OUTBOUND_SENT`;
3. owned From without SENT remains `OUTBOUND_UNCONFIRMED`;
4. SENT can establish outbound-sent technical state;
5. SPAM does not force `NOT_RELEVANT`;
6. authoritative Gmail source fields survive mapping into the observation boundary;
7. exact same-message/revision/fingerprint replay is idempotent;
8. exact replay produces no second observation row;
9. same identity/revision with changed fingerprint fails closed as conflict;
10. a true new provider revision can be represented separately;
11. null/unknown provider revision plus changed fingerprint does not silently merge;
12. expired/invalid history produces recovery-required, not an invented cursor;
13. cursor advancement requires PASS and a proposed cursor;
14. FAILED/PREPARED recovery cannot advance cursor;
15. DRAFT is blocked from promotion evaluation;
16. ambiguous relevance remains reviewable rather than discarded;
17. connector output stops at candidate boundary;
18. no Gmail connector import/path exposes accepted CRM mutation authority;
19. existing PostgreSQL persistence/tenant-isolation/migration sensors remain green;
20. all prior DCRM-03A synthetic sensors remain green.

## Out of scope

- Gmail OAuth;
- live Gmail API/network access;
- Cloudflare/Google configuration;
- real mailbox credentials or real tenant data;
- Apps Script writer execution;
- `clasp push`;
- Gmail draft/send;
- JEV/model calls;
- accepted Conversation/Activity/Contact creation;
- automatic identity merge;
- Work compilation;
- deployment.

## Completion contract

Codex must:
- work only on the dedicated DCRM-03A feature branch;
- read root and nearest scoped AGENTS instructions before edits;
- keep `connectors/gmail` provider-specific while reusing canonical
  `@drowk/contracts`/persistence boundaries;
- use only synthetic fixtures committed to the repo;
- run workspace verify plus all available synthetic/PostgreSQL sensors;
- use GitHub Actions as the authoritative clean-install/PostgreSQL sensor when the
  local Windows/exFAT environment cannot reproduce it;
- do not use Docker, Docker Desktop, WSL or local containers for this WP;
- do not repair Docker/Windows/node_modules/Corepack/WMIC/filesystem permissions as
  part of this WP;
- commit and push;
- report branch, final SHA, files changed, tests/sensors and unresolved findings;
- do not merge, deploy or enable live Gmail.

## Closure gate

DCRM-03A closes only when the source-observation, replay/conflict,
history-recovery and candidate-only promotion boundaries are all proven.

Live Gmail/OAuth is a later explicit owner gate.
