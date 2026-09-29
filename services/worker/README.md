# Worker Service

Background execution surface for DROWK CRM.

Expected responsibilities:
- Gmail synchronization and reconciliation;
- research and provider jobs;
- enrichment and evidence normalization;
- freshness/refresh jobs;
- Work compilation;
- scheduled jobs;
- recovery/reconciliation of uncertain execution state.

Rules:
- business authority remains in DROWK domain/policy contracts;
- every job is tenant-scoped;
- retries must not imply business exactly-once semantics;
- external side effects require durable idempotency/reconciliation;
- pg-boss is the current queue baseline candidate;
- DBOS remains a benchmark challenger for durable multi-step workflows.

This directory is an execution boundary, not a second business domain.
