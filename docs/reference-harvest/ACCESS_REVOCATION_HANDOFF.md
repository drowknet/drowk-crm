# GitHub Access Revocation Handoff

Status: READY FOR OWNER ACCESS NARROWING

## Objective

The owner intends to remove broad GitHub access and leave future CRM work scoped to:

`drowknet/drowk-crm`

This document records what was harvested before that access is narrowed.

## What is now preserved inside DROWK CRM

The target repository now contains CRM-local summaries of transferable knowledge from the other accessible repositories:

### From drowknet/drowk-platform
Preserved locally:
- canonical PostgreSQL / Domain API principle;
- deterministic-vs-AI authority boundary;
- framework/runtime neutrality;
- identity claims vs verified evidence vs canonical identity;
- Account != Facility;
- event envelope design inputs;
- original evidence/signal/agent/eval/tool-policy schema families;
- source-native-ID / source-truth separation;
- external-data rights/retention/governance principles;
- provider workload-role separation;
- documented-capability vs live-validated-capability distinction;
- provider benchmark cost/freshness/provenance semantics;
- Agent Harness Guides/Sensors/Human Gates model;
- cross-runtime Actor/Agent/Session/Tenant separation;
- memory classes and bounded retrieval;
- proof-carrying agent work;
- durable event/receipt pattern;
- trace lineage;
- capability routing;
- PostgreSQL CI/static-analysis/migration discipline.

Detailed source paths and blob SHAs are pinned in:
`source-manifest-2026-09-27.json`.

### Relevant unmerged branch captured from drowknet/drowk-platform

Branch `wp-osci-01-stage0-offline` was 13 commits ahead of main at harvest and contained a synthetic open-source commercial-intelligence benchmark.

Preserved conclusions include:
- dlt 1.30.0 measured as PATTERN_ONLY for the tested acquisition workload;
- same-run duplicate semantics remained a gap in the tested dlt configuration;
- Splink and libpostal remained unmeasured challengers rather than adopted/rejected components;
- Overture Maps/OpenAddresses remained source/rights candidates without Stage-0 live reads;
- deterministic routing gated rights/availability before authority/freshness/information-gain/latency/cost.

See `docs/reference-harvest/osci-stage0-transfer.md`.

Branch audit also found only dependency-maintenance branches ahead of main in the platform, and an invoice-builder feature branch limited to renderer/UI refactoring.

### From drowknet/invoice-builder
Preserved locally:
- explicit data ownership/exportability lesson;
- session/workspace isolation pattern;
- critical warning that session isolation is not authentication;
- HttpOnly/Secure cookie + HTTPS/reverse-proxy lesson;
- explicit per-request context/resource ownership;
- serialized setup/failure-isolation/cleanup patterns;
- executable testing of isolation/security invariants.

No invoice-specific domain design was adopted.

### From drowknet/hds
The repository was empty at harvest time. There was no implementation content to preserve.

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

DROWK CRM retained only the engineering consequences needed to continue independently.

## PWM_CRM dependency after GitHub narrowing

PWM_CRM is not a GitHub source in this harvest.

Its live repository and project evidence remain on the owner's portable D: workspace:

`D:\Workspace\Projects\PWM\PWM_CRM`

Future CRM extraction from PWM_CRM therefore still requires one of:
1. owner-authorized read-only inspection on the machine with D:;
2. owner-supplied snapshots/files;
3. a controlled Codex audit whose result is brought into DROWK CRM.

The write boundary remains: DROWK CRM only, unless the owner explicitly opens a separate gate.

## External/current information after narrowing

The following should always be researched fresh rather than frozen from this harvest:
- AIsa catalog/tools/pricing/terms;
- Google/Gmail/Gemini APIs and OAuth behavior;
- Cloudflare Workers/Access/platform behavior;
- model/provider availability/pricing;
- third-party open-source versions/licenses/security;
- LinkedIn/provider API availability/terms.

Their current behavior is not preserved as permanent truth in this repository.

## Files created by the harvest

- `docs/reference-harvest/README.md`
- `docs/reference-harvest/source-manifest-2026-09-27.json`
- `docs/reference-harvest/drowk-platform-transfer.md`
- `docs/reference-harvest/invoice-builder-transfer.md`
- `docs/reference-harvest/ACCESS_REVOCATION_HANDOFF.md`
- `docs/architecture/ENGINEERING_HARNESS_MODEL.md`
- `docs/architecture/PROVIDER_EVALUATION_PROTOCOL.md`
- `docs/architecture/MEMORY_AGENT_TRACE_MODEL.md`
- `docs/adr/0003-proof-carrying-engineering.md`
- `docs/adr/0004-provider-neutral-intelligence.md`

## Readiness statement

After this harvest, DROWK CRM does not require ongoing read access to the other GitHub repositories in order to understand the architectural and engineering patterns identified as relevant during this pass.

Revoking broad GitHub access will remove the ability to inspect later changes in those repositories. That is acceptable for the CRM boundary: future cross-project knowledge must be deliberately reintroduced by the owner if it becomes relevant.
