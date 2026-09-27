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

See:
- `docs/reference-harvest/pwm-wp03-local-audit-2026-09-26.md`
- `docs/work-packages/DCRM-03A-gmail-observation-boundary.md`
