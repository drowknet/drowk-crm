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
