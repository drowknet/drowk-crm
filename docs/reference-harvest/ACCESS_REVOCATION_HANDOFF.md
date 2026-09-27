# GitHub Access Revocation Handoff

Status: **READY FOR OWNER ACCESS NARROWING**

## Objective

The owner intends to remove broad GitHub access and leave future CRM work scoped to:

`drowknet/drowk-crm`

This document records what was harvested before that access is narrowed.

## Repositories inspected

At harvest time the accessible repositories were:
- `drowknet/drowk-crm` — authorized WRITE target;
- `drowknet/drowk-platform` — READ-ONLY engineering prior art;
- `drowknet/invoice-builder` — READ-ONLY application/runtime prior art;
- `drowknet/hds` — READ-ONLY and empty at harvest time.

No other repository was used as a write target.

## What is now preserved inside DROWK CRM

### From drowknet/drowk-platform

Preserved locally:
- canonical PostgreSQL / Domain API principle;
- deterministic-vs-AI authority boundary;
- framework/runtime neutrality;
- Account != Facility;
- Claim != Verified Evidence != Canonical Identity;
- event envelope/correlation/causation design inputs;
- source-native-ID / source-truth separation;
- external-data rights/retention/governance principles;
- provider workload-role separation;
- DOCUMENTED_CAPABILITY vs LIVE_VALIDATED_CAPABILITY;
- provider benchmark cost/freshness/provenance semantics;
- Agent Harness Guides/Sensors/Human Gates model;
- Actor/Agent/Session/Tenant separation;
- memory classes and bounded retrieval;
- proof-carrying agent work;
- durable event/receipt pattern;
- trace lineage;
- capability routing;
- PostgreSQL CI/static-analysis/migration discipline.

Implemented database/control patterns also preserved:
- migration 0003: durable idempotency claim using key digest + deferred canonical/event references;
- migration 0004: typed IdentityEvidence with CLAIMED/VERIFIED/REJECTED trust, verification provenance and supersession;
- migration 0005: deterministic EntityMatchDecision status/fingerprint/evidence/history model;
- migration 0006: Signal source namespace/native-ID/revision, temporal truth, ingestion key/input digest and SignalEvidence;
- migration 0007: immutable rule/hypothesis/trend/applicability/forecast lineage using fingerprints, snapshots and supersession;
- applied migration hashes 0001-0007 and forward-only migration discipline.

Detailed source paths and exact blob SHAs are pinned in:
`docs/reference-harvest/source-manifest-2026-09-27.json`.

### Relevant unmerged branch captured from drowknet/drowk-platform

Branch `wp-osci-01-stage0-offline` was 13 commits ahead of main and 0 behind at harvest.

It contained an offline/synthetic open-source commercial-intelligence benchmark.

Preserved conclusions:
- `dlt 1.30.0` measured as **PATTERN_ONLY** for the tested acquisition workload;
- cross-run replay suppression and late revisions worked in the measured dlt setup;
- same-run duplicate `(source_id, revision)` semantics did not match the DROWK thin baseline;
- Splink and libpostal remained unmeasured challengers, not adopted or rejected;
- Overture Maps and OpenAddresses remained rights/source candidates with no Stage-0 live read;
- deterministic enrichment routing gated rights/availability before authority/freshness/information gain/latency/cost.

See:
`docs/reference-harvest/osci-stage0-transfer.md`.

Branch audit additionally found:
- only dependency-maintenance branches ahead of main in `drowk-platform` besides OSCI;
- `invoice-builder/feature/3` ahead of main but limited to renderer/UI/RTK refactoring, with no unique CRM architecture worth transferring.

### From drowknet/invoice-builder

Preserved:
- explicit data ownership/exportability lesson;
- session/workspace isolation pattern;
- critical negative lesson: session isolation != authentication;
- HttpOnly/Secure cookie + HTTPS/reverse-proxy pattern;
- explicit per-request resource ownership;
- serialized setup/failure-isolation/cleanup;
- executable tests for session/database isolation.

Not adopted:
- invoice/quote business model;
- Electron assumptions;
- SQLite-first architecture;
- session-only pseudo-auth;
- frontend stack by inheritance.

### From drowknet/hds

The repository was empty at harvest time. No implementation content existed to preserve.

## Owner-approved decisions preserved in DROWK CRM

The repository now also records:
- `drowk.com` as DROWK public/corporate brand namespace;
- `drowk.net` as DROWK systems namespace;
- `crm.drowk.net` as the intended DROWK CRM production namespace;
- `hds.drowk.net` as HDS internal-system namespace;
- future `admin.drowk.net` as a possible DROWK Control Plane;
- `highdustingservice.com` as the public HDS commercial site.

Cloudflare checkpoint preserved:
- drowk.net DNS shown as Full in owner-supplied dashboard;
- no DROWK CRM Worker/app deployed yet;
- Cloudflare Workers & Pages GitHub App scoped specifically to `drowknet/drowk-crm`;
- Cloudflare can see the CRM repository;
- deployment/runtime selection remains intentionally open.

## What was intentionally NOT copied

Not copied:
- raw source code merely for convenience;
- unrelated vertical logic;
- customer/prospect data;
- Gmail or LinkedIn exports;
- PWM operational datasets;
- secrets or connection strings;
- Drive documents;
- third-party proprietary content;
- production credentials;
- private provider payloads.

DROWK CRM retained engineering consequences and pinned provenance, not repository clones.

## PWM_CRM dependency after GitHub narrowing

PWM_CRM is not a GitHub source in this harvest.

Its live repository and project evidence remain on the owner-controlled portable D: workspace:

`D:\Workspace\Projects\PWM\PWM_CRM`

Future extraction still requires one of:
1. owner-authorized read-only inspection on the machine with D:;
2. owner-supplied snapshots/files;
3. a controlled Codex audit whose result is brought into DROWK CRM.

The write boundary remains: **DROWK CRM only**, unless the owner explicitly opens a separate gate.

## Information that must remain fresh

Do not freeze these as permanent truths:
- AIsa catalog/tools/pricing/terms;
- Google/Gmail/Gemini APIs and OAuth behavior;
- Cloudflare Workers/Access behavior;
- model/provider availability/pricing;
- third-party open-source versions/licenses/security;
- LinkedIn/provider API availability/terms.

Revalidate when used.

## Harvest artifacts now owned by DROWK CRM

Reference:
- `docs/reference-harvest/README.md`
- `docs/reference-harvest/source-manifest-2026-09-27.json`
- `docs/reference-harvest/drowk-platform-transfer.md`
- `docs/reference-harvest/invoice-builder-transfer.md`
- `docs/reference-harvest/open-source-patterns-transfer.md`
- `docs/reference-harvest/osci-stage0-transfer.md`
- `docs/reference-harvest/ACCESS_REVOCATION_HANDOFF.md`

Architecture extracted/promoted:
- `docs/architecture/CANONICAL_DATA_MODEL.md`
- `docs/architecture/ENGINEERING_HARNESS_MODEL.md`
- `docs/architecture/PROVIDER_EVALUATION_PROTOCOL.md`
- `docs/architecture/MEMORY_AGENT_TRACE_MODEL.md`
- `docs/architecture/AUTH_TENANCY_BOUNDARY.md`
- `docs/architecture/DROWK_DOMAIN_TOPOLOGY.md`

Infrastructure/context:
- `docs/index.md`
- `infra/CLOUDFLARE_CHECKPOINT.md`

ADRs:
- `docs/adr/0003-proof-carrying-engineering.md`
- `docs/adr/0004-provider-neutral-intelligence.md`

## Readiness statement

After this harvest, DROWK CRM does not require ongoing read access to the other currently accessible GitHub repositories in order to understand the architectural and engineering patterns identified as relevant during this pass.

Revoking broad GitHub access will prevent inspection of later changes in those repositories. That is acceptable for the CRM boundary: future cross-project knowledge must be deliberately reintroduced by the owner if relevant.
