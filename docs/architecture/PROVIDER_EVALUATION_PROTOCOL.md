# DROWK CRM Provider Evaluation Protocol

Status: FOUNDATION DESIGN

Purpose: evaluate AIsa capabilities and direct providers without letting provider schemas or marketing claims become CRM truth.

## Provider roles are workload-specific

Never produce one universal provider score.

Evaluate by capability cell, for example:
- discovery;
- person enrichment;
- company enrichment;
- facility/location discovery;
- external identity crosswalk;
- employment verification evidence;
- procurement-route research;
- change/news signals;
- reputation/review signals;
- web search;
- web extraction;
- route/operational evidence;
- model inference;
- reranking/embeddings;
- sandbox email.

A provider can be strong in one cell and UNKNOWN in another.

## Capability state

Use at least:
- DOCUMENTED_CAPABILITY
- LIVE_VALIDATED_CAPABILITY
- UNSUPPORTED
- UNASSESSED
- TEMPORARILY_UNAVAILABLE
- RIGHTS_BLOCKED

Do not convert a documentation claim into LIVE_VALIDATED.

## Request record

A benchmark request should preserve:
- provider;
- operation/endpoint;
- provider/tool version if exposed;
- interface (AIsa REST/MCP/direct/etc.);
- workload;
- exact normalized inputs;
- locale/geography;
- request fingerprint;
- parser/adapter version;
- tenant/run scope;
- rights/policy reference;
- approved max cost;
- estimated cost.

Never include secrets in fingerprints.

## Observation record

Preserve:
- source-native request/task ID;
- status;
- safe error category;
- source-native entity IDs;
- retrieved_at;
- observed_at if source supports it;
- latency;
- actual cost when known;
- actual-cost-known boolean;
- freshness;
- provenance;
- response/content fingerprint;
- rights/retention classification.

Unknown actual cost != zero.

## Result semantics

Distinguish:
- PRESENT
- EMPTY_WITHIN_RESPONSE
- UNKNOWN
- ERROR
- PENDING
- PARTIAL

An empty bounded response is not proof of universal absence.

## Evaluation gates

Before comparative preference for a capability cell, evaluate:

1. Rights
2. Identity quality
3. Coverage/completeness
4. Freshness
5. Reliability
6. Exportability
7. Economics/TCO
8. Security
9. Latency
10. Replacement cost
11. Evidence/provenance quality

Missing evidence remains UNKNOWN and blocks unsupported conclusions.

## Progressive intelligence

Research should stop when evidence completeness is sufficient.

```text
cheap deterministic filter
-> low-cost provider evidence
-> evidence completeness check
-> deeper provider / multi-source triangulation only if needed
-> human-reviewed commercial action
```

Each ResearchRun should define:
- objective;
- evidence gaps;
- allowed capabilities;
- max cost;
- max tool calls;
- max elapsed time;
- stop conditions;
- output evidence IDs.

## AIsa-specific consequence

AIsa is a major capability fabric, not canonical truth.

The DROWK CRM adapter should preserve:
- capability requested;
- selected AIsa tool/provider;
- operation metadata;
- price/ceiling;
- read/write classification;
- exact evidence provenance;
- call/result fingerprint.

Write-capabilities must be separately authorized from read-capabilities.

## Promotion

Provider output enters Observation/Evidence first.

It may become:
- IdentityCandidate;
- Signal;
- Research finding;
- candidate relationship;
- evidence gap closure.

It never silently becomes Account/Contact/Facility truth.


## Post-DCRM-04F executable consequence — 2026-09-28

The core CRM relationship-memory foundation is now executable through Relationship.

DCRM-05 begins with a synthetic provider-neutral harness rather than live credentials.
DCRM-05A must make ResearchRun/ProviderRun persistence, fingerprints, result states,
cost-known semantics and bounded stopping behavior executable.

Synthetic fixtures validate the DROWK lab, not the external provider. They must never
be labeled `LIVE_VALIDATED_CAPABILITY`.

Selected-provider live validation remains a later explicit DCRM-05 gate after rights,
credentials, security and cost boundaries are approved.


## Post-DCRM-05A release consequence — 2026-09-28

DCRM-05A is closed with post-merge CI green.

The synthetic lab now proves provider-neutral audit, result/cost semantics and
bounded stopping behavior. It still does not prove any external provider.

Before a live provider capability can be validated, the accumulated foundation
release candidate must pass the dedicated `foundation/drowk-crm-00 -> main`
release review and explicit owner merge gate already required by the execution
sequence.

No provider is live-validated by DCRM-05A.


## Post-foundation release consequence — 2026-09-28

The foundation through DCRM-05A is now released to `main`.

The next provider step is not an implementation branch. DCRM-05B must first select
one exact provider/capability cell and document the live READ-only envelope:
rights, retention, authentication, cost ceilings, timeouts, result semantics,
provenance and credential injection.

No external provider request is authorized until that selection receives a separate
owner gate.


## DCRM-05B selected first live-validation cell — 2026-09-28

Selected path:
`AIsa REST -> DataForSEO Business Listings Search Live`.

Selected workload cell:
`FACILITY_LOCATION_DISCOVERY`.

The selection is based on current public facts recorded in
`docs/research/DCRM-05B_PROVIDER_SELECTION_2026-09-28.md`.

Selection does not establish provider preference outside this capability cell and
does not establish `LIVE_VALIDATED_CAPABILITY`.

At selection time, the cell remained non-live pending the DCRM-05C owner gate.
The accepted result below supersedes that pre-live state.

## Post-DCRM-05C accepted live validation — 2026-09-29

`AIsa REST → DataForSEO Business Listings Search Live → FACILITY_LOCATION_DISCOVERY`
is now `LIVE_VALIDATED_CAPABILITY` following one owner-authorized request,
technical PASS and formal owner acceptance. The promotion is limited to:

- capabilityId: `DISCOVER_BUSINESS_LISTINGS`
- workloadCell: `FACILITY_LOCATION_DISCOVERY`
- provider: `dataforseo`
- transport: `aisa`
- operation: `POST /apis/v1/dataforseo/business_data/business_listings/search/live`
- interface: `AISA_REST`
- accessClass: `READ`
- geography/locale: `US` / `en-US`
- adapterVersion: `aisa-dataforseo-business-listings-v1`

[Accepted safe evidence](../research/DCRM-05C_LIVE_VALIDATION_EVIDENCE_2026-09-29.md) records the bounded fixture and audit.

`Provider output != CRM truth`.

Only this exact workload/tuple is promoted. This does not validate other AIsa tools,
providers or capability cells, or establish universal superiority for AIsa or
DataForSEO. No new live request is authorized. Merge requires a separate explicit
owner gate; post-merge CI remains pending. Deployment and DCRM-06 remain closed.
