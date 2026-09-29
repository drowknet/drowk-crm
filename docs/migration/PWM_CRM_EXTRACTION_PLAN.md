# PWM_CRM Extraction and Migration Plan

Status: PRESERVATION-FIRST

## Objective

Use the existing PWM_CRM implementation as a reference implementation and source system while extracting reusable domain logic into DROWK CRM.

This is not a rewrite-from-memory project.

## Preserve first

Before migration or replacement:
- preserve Git history of the existing PWM_CRM repo;
- preserve current Apps Script source;
- preserve schemas and column semantics;
- preserve source IDs;
- preserve audit records;
- preserve runtime evidence/checkpoints;
- preserve known regressions and golden cases;
- preserve configuration semantics;
- preserve Work Engine behavior and fingerprints where valid.

Do not delete or reset the source project as part of extraction.

## Known reusable domain concepts

The migration should evaluate and preserve, where still valid:
- Accounts
- Contacts
- Conversations
- Pursuits
- Activities
- Activity Participants
- Tasks
- Opportunities
- Commercial Exclusion
- Work/Next Action Engine
- JEV Decision Layer
- Confidence Gate
- domain lexicon
- audit model
- Gmail source identity
- idempotency rules
- source watermarks/freshness
- human review semantics
- autonomy levels
- Golden Set / regression cases

## Architecture corrections learned from PWM

DROWK CRM should encode these lessons from the start:
- Draft != Sent.
- Sent != Delivered.
- Spam state does not automatically mean commercial irrelevance.
- Inbox is not source truth.
- From=owner is insufficient evidence of SENT.
- technical Gmail eligibility != commercial relevance.
- source observation should be preserved before promotion to Core.
- marketing/system noise should not automatically reach semantic judgment.
- external enrichment should not silently overwrite CRM truth.
- identity cannot be inferred from domain alone.
- source freshness must be observable.
- cursor/recovery/concurrency behavior must fail closed.

## Migration phases

### Phase A — Inventory
Produce a machine-readable inventory of source modules, sheets, globals, runtime functions, policies and tests.

### Phase B — Domain extraction
Classify each source element:
- reusable domain logic;
- Google-specific connector logic;
- tenant/PWM-specific configuration;
- migration-only artifact;
- obsolete/superseded logic.

### Phase C — Contract tests
Create golden tests that reproduce known good behavior before replacing implementation.

### Phase D — Evidence-first Gmail connector
Port Gmail synchronization as a source/evidence connector before Core promotion.

The 2026-09-26 PWM checkpoint is authoritative over the older direct Gmail-to-Core WP-03 draft where they conflict.

Preserve/adapt from the local WP-03 draft:
- decimal History cursor comparison;
- complete pagination;
- duplicate/replay collapse;
- source-key uniqueness;
- single-run lock/failure handling;
- PREPARED/PASS cursor audit;
- controlled cursor recovery.

Do not port unchanged:
- direct Gmail -> Conversation/Activity writes;
- SPAM exclusion as a relevance rule;
- From=owned identity as proof of SENT.

See `docs/reference-harvest/pwm-wp03-local-audit-2026-09-26.md`.

### Phase E — CRM truth migration
Migrate canonical entities preserving source IDs and lineage.

### Phase F — Work Engine parity
Reproduce Work Engine outputs and compare deterministic fingerprints.

### Phase G — Tenant configuration
Move PWM-specific:
- service taxonomy;
- lexicon;
- commercial exclusion policies;
- voice profile;
into tenant-scoped configuration.

### Phase H — Controlled cutover
Run legacy and DROWK CRM in parallel until parity/freshness gates pass.

## Data ownership

Platform code and DROWK intellectual property must remain separate from tenant-owned business data.

Migration of employer/customer/prospect data must respect applicable ownership, contractual and privacy requirements.

## Success criteria

No cutover until:
- source history preserved;
- entity counts reconciled;
- IDs mapped;
- evidence lineage intact;
- Work parity explained;
- no duplicate identities;
- no silent Core mutation;
- audit coverage complete;
- rollback path tested.
