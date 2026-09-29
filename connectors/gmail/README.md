# Gmail Connector

Gmail is a source/evidence connector, not the DROWK system of record.

Required behavior:
- initial/full sync and incremental history sync;
- durable mailbox watermark/history cursor;
- recovery when history expires;
- exact source IDs and message/thread references;
- observation before CRM promotion;
- commercial relevance gating;
- idempotent processing;
- reconciliation after uncertain external actions.

Non-negotiable semantics:
- Draft != Sent;
- Sent != Delivered;
- From=owner is not sufficient proof of SENT;
- Spam != commercial irrelevance;
- Gmail thread != universal cross-channel conversation identity.

Initial execution authority remains read/observe/prepare-oriented until policy and
approval gates explicitly expand it.


## Legacy WP-03 extraction

The local PWM WP-03 draft is a source of tested mechanics, not the target authority model.

Reusable mechanics:
- decimal History cursor ordering;
- pagination;
- replay/deduplication;
- lock/failure handling;
- PREPARED/PASS cursor evidence.

Superseded mechanics:
- direct source-to-Core reconciliation;
- SPAM as an exclusion decision;
- owned From as sufficient SENT evidence.

The first DROWK Gmail implementation is observation-only and synthetic. Live Gmail
and Core promotion are later, separately gated capabilities.

## DCRM-03A synthetic boundary

`toSourceObservation` maps provider-shaped message fields to the canonical
`SourceObservation` draft. The Gmail Message ID is the source native ID; a
provider revision is used only when supplied. Message date and internal date
remain separate optional source times. Retrieval/ingestion/recording times,
watermark, adapter version, raw artifact reference, mailbox and connector
references remain attributable. The fingerprint hashes message state, not the
retrieval time or cursor, so an unchanged message replays across sync runs.
Provider fields live under `sourceMetadata.gmail`; direction and relevance do not.

The caller persists the observation before interpreting it. The repository returns
`already_exists` only for an exact fingerprint replay and
`fingerprint_conflict` for changed state at the same source revision. A new
provider revision can append. No revision is fabricated when Gmail supplies none.

`classifyTechnicalDirection`, `deterministicRelevance` and
`evaluatePromotionCandidate` return derived technical and candidate states only.
The caller supplies ownership, deterministic noise evidence, linkage and policy
decisions; the connector does not grant those authorities. Promotion eligibility
means a downstream candidate, never accepted CRM state.

`planHistorySync` requests a full scan for initial, expired or invalid history
without inventing a replacement cursor. `finalizeHistoryCheckpoint` accepts only
PASS with a proposed decimal cursor and detects stale or replayed completion.
The eventual durable checkpoint writer must apply the returned transition with a
compare-and-swap on the committed cursor. No live Gmail or cursor writer exists in
this package.

See:
- `docs/reference-harvest/pwm-wp03-local-audit-2026-09-26.md`
- `docs/work-packages/DCRM-03A-gmail-observation-boundary.md`
