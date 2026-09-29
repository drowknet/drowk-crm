# Post-foundation release provider-selection checkpoint — 2026-09-28

Status: COMPLETE  
Inspected main: `99c3900aa2e9aa074c2d9f97ccce811557be922f`

## Foundation release closure

The accumulated foundation release candidate was merged into `main` through PR #1.

Release evidence:
- PR #1 merged after dedicated deep release review and explicit owner authorization;
- reviewed release head: `c0a2b9ceff01dbda5308d15b76eb1db1e77aa9c7`;
- merge commit on `main`: `99c3900aa2e9aa074c2d9f97ccce811557be922f`;
- exact release-head CI `36515107336`: SUCCESS;
- exact release-head PR validation `36515110766`: SUCCESS;
- post-merge main CI `36519721659`: SUCCESS;
- `verify`: SUCCESS;
- `postgres-foundation`: SUCCESS.

The source-code foundation is therefore released to `main`.

This does **not** authorize deployment, live Gmail, live providers, provider WRITE,
outbound or higher autonomy.

## Next roadmap dependency

DCRM-05A proved the synthetic provider-neutral lab but did not validate an external
provider.

The next gate is:

**DCRM-05B — Provider Selection & Live Validation Readiness**

This is a planning/research gate, not a live-call authorization.

Before any external request is made, DCRM-05B must name exactly:
- one capability/workload cell;
- one provider/fabric path;
- one operation/endpoint;
- interface: direct API / AIsa API / AIsa MCP / other;
- READ access class;
- authentication mechanism;
- rights/retention classification;
- provider/source data allowed to be persisted;
- approved max cost per call and ResearchRun;
- rate/availability constraints;
- normalized request schema;
- exact result/error/empty semantics;
- source-native IDs/provenance available;
- retrievedAt/observedAt semantics;
- adapter version/fingerprint plan;
- credential injection/storage boundary;
- rollback/kill mechanism.

## Selection rules

The first live validation must optimize for **evidence about the provider/capability
cell**, not for production coverage.

Prefer a small bounded case that can prove:
- network adapter boundary;
- actual provider result semantics;
- actual cost-known versus cost-unknown handling;
- provenance/rights retention;
- request/response fingerprints;
- failure/empty/partial behavior;
- no direct CRM truth mutation.

Do not select a universal provider winner.

A provider/capability cell may become `LIVE_VALIDATED_CAPABILITY` only after an
actual bounded live run satisfies the evaluation protocol.

## Candidate families already in the roadmap

Candidate provider/capability families include:
- AIsa-mediated provider discovery/operation;
- Apollo company/person research;
- DataForSEO facility/location/business research;
- Similarweb/company web intelligence;
- Exa/Tavily web discovery;
- Firecrawl controlled web extraction;
- Jina retrieval/reranking when a measured need exists;
- direct deterministic extraction challengers for `EXTRACT_WEB_PAGE`.

No candidate is selected by this checkpoint.

## Gate ownership

Until selection is complete:
- ChatGPT owns public provider research, architecture comparison and GitHub planning;
- Codex has no active implementation branch;
- no credential is committed to Git;
- no external provider request is authorized;
- no live provider state is written;
- no capability state may become `LIVE_VALIDATED_CAPABILITY`.

After a provider/cell is selected, the owner must explicitly authorize the live
READ-only validation work package before Codex receives an implementation handoff.

## Still closed

- provider WRITE capabilities;
- canonical CRM promotion from provider output;
- live Gmail/OAuth;
- Gmail draft/send;
- outbound;
- A3/A4;
- deployment.
