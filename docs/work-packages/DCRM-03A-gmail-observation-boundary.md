# DCRM-03A — Gmail Observation Boundary

Status: READY FOR CONTRACT / SYNTHETIC IMPLEMENTATION

## Objective

Extract the valid WP-03 source mechanics into a DROWK-native Gmail connector while
removing direct Gmail-to-Core authority.

## In scope

- Gmail source message contract;
- History ID decimal ordering;
- source labels/state preservation;
- deterministic direction evidence;
- Draft/SENT invariant;
- spam-neutral commercial relevance semantics;
- candidate-only promotion boundary;
- sync checkpoint contract;
- synthetic regression cases;
- no network access.

## Out of scope

- Gmail OAuth;
- live Gmail API;
- Apps Script writer execution;
- Core Conversation/Activity creation;
- JEV/model calls;
- outbound send;
- Cloud deployment.

## Required pipeline

```text
enumerate source
-> preserve source observation
-> normalize evidence
-> classify technical message state
-> relevance gate
-> identity/linkage candidates
-> policy-controlled promotion
```

No ingestion function may directly create accepted Conversation/Activity state.

## Direction evidence

- DRAFT label blocks SENT classification.
- SENT label is positive evidence of an outbound sent message.
- From=owned identity without SENT is not sufficient for OUTBOUND_SENT.
- non-owned sender to an owned mailbox may be an inbound candidate, subject to
  identity/relevance checks.
- ambiguous cases remain ambiguous/reviewable.

## Spam

SPAM is mailbox state evidence. It is not a commercial relevance decision.

A message in SPAM can still become commercially relevant after the relevance gate.

## Relevance

System/marketing/noise must not automatically enter semantic judgment.

The deterministic prefilter may identify known technical categories, but ambiguous
commercial cases are preserved for bounded review/judgment rather than discarded.

## Sync state

A connector checkpoint should preserve:
- mailbox/connector identity;
- cursor before;
- proposed cursor after;
- run/correlation;
- PREPARED/PASS/FAILED state;
- source counts/fingerprint where useful;
- failure/recovery reason.

Cursor advancement occurs only after the bounded observation transaction is proven.

Expired/invalid History cursor produces controlled recovery/full scan, never an
invented cursor.

## Acceptance sensors

Synthetic tests must prove:
1. decimal History IDs compare without Number precision loss;
2. Draft + owned From never becomes OUTBOUND_SENT;
3. owned From without SENT never becomes OUTBOUND_SENT;
4. SENT can establish outbound-sent technical state;
5. SPAM does not force NOT_RELEVANT;
6. duplicate source Message ID does not imply a second canonical source event;
7. direct Core mutation is absent from the connector contract;
8. cursor state has PREPARED/PASS/FAILED semantics.

## Legacy extraction

See `docs/reference-harvest/pwm-wp03-local-audit-2026-09-26.md`.
