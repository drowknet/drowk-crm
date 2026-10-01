# DCRM-05D — Prospecting Open-Source Harvest & Capability Qualification

Status: PLANNED / Q0 HARVEST DOCUMENTED / NO IMPLEMENTATION OR LIVE AUTHORITY

Owner outcome:
reduce dependence on LinkedIn Sales Navigator / Evaboot by qualifying a DROWK-owned, provider-neutral prospecting path based on public-web discovery, open-source extraction/orchestration patterns, existing DROWK Evidence/ProviderRun contracts and replaceable commercial providers.

## Why this exists

DCRM-05C validated one exact AIsa/DataForSEO facility-discovery cell. It did not validate:
- web search generally;
- web extraction generally;
- buyer/person discovery;
- professional-email finding;
- email verification;
- Employment verification;
- procurement-route research;
- Apollo;
- LinkedIn.

The product roadmap now needs these capabilities for DCRM-06 and DCRM-07 without turning Sales Navigator, Evaboot, Apollo or any one open-source project into a platform dependency.

The source harvest is:
[Prospecting Open-Source Harvest — 2026-10-01](../reference-harvest/PROSPECTING_OSS_HARVEST_2026-10-01.md).

## Authority boundary

This package does not authorize:
- EF-03 live provider inspection or staging actions;
- new production dependencies;
- provider credentials;
- Apollo/AIsa/provider live calls;
- LinkedIn login/session/cookie use;
- authenticated LinkedIn scraping;
- browser automation against LinkedIn;
- outbound send;
- database migrations;
- runtime deployment.

Q0 is documentation/research only.

## Product invariants

1. Evidence before CRM Truth.
2. Provider output != accepted Account/Person/Employment/BuyerRole truth.
3. Indexed public LinkedIn snippet != verified Employment.
4. Email pattern candidate != verified mailbox.
5. MX existence != mailbox existence.
6. UNKNOWN != VALID.
7. Search result absence != universal absence.
8. READ != WRITE.
9. Provider login != sending identity.
10. No source may generate synthetic contact facts and pass them as observed evidence.
11. No capability may depend on authenticated LinkedIn scraping.
12. Cost optimization may never override evidence quality or rights/security gates.

## Capability cells in scope

- `SEARCH_WEB`
- `EXTRACT_WEB_PAGE`
- `DISCOVER_COMPANIES`
- `DISCOVER_PUBLIC_PROFESSIONAL_PROFILE`
- `FIND_BUYER_CANDIDATES`
- `ENRICH_COMPANY`
- `FIND_PROFESSIONAL_EMAIL`
- `VERIFY_PROFESSIONAL_EMAIL`
- `VERIFY_EMPLOYMENT`
- `FIND_PROCUREMENT_ROUTE`

No cell inherits `LIVE_VALIDATED_CAPABILITY` from DCRM-05C.

## Candidate roles

### Dependency/service candidates

- Crawl4AI — bounded public-web extraction candidate.
- SearXNG — separate self-hosted search-fabric candidate.

### Code/pattern harvest candidates

- OpenProspector — provider contract, waterfall attempts, deferred provider semantics, cache/freshness, attribution/cost.
- enrichment-kit — cost/hit-rate ordering, confidence gating, canonical cache, validation.
- Rowbound — action DAG, reconciliation, URL/SSRF guard, incremental execution.

### Lab/architecture-only candidates

- OpenEnrich — professional-email pattern/verification lab candidate; AGPL boundary.
- OpenGTM — architecture/evaluation/source-health harvest only; AGPL and prohibited LinkedIn/stealth surfaces.
- KeeLead — public-source inventory only; current verification/synthetic-helper behavior is not acceptable authority.
- CrossLinked — public-search discovery concept only; no runtime dependency.

Exact upstream SHAs and license observations are pinned in the harvest document.

## Execution plan

### Q0 — Canonical source/license harvest

Deliverables:
- pinned upstream SHAs;
- observed licenses;
- candidate disposition;
- explicit prohibited surfaces;
- capability-cell map;
- no-live authority statement.

Q0 is satisfied only when this package and harvest are merged to protected `main` with CI green.

### Q1 — Offline contracts and evaluation fixtures

Separate owner-authorized work package/branch.

Required outputs:
- normalized input/output contract per selected cell;
- deterministic result states;
- provenance/freshness contract;
- security/rights classification;
- cost/time/tool-call budget semantics;
- cache identity + staleness contract;
- synthetic/public fixture set;
- Sensors for UNKNOWN/ERROR/PARTIAL/PENDING behavior;
- no network execution.

Q1 should reuse existing DROWK ResearchRun/ProviderRun semantics rather than create provider-owned state.

### Q2 — Isolated candidate lab

Separate owner gate.

One candidate and one cell at a time.

Required controls:
- exact version/digest pin;
- isolated local/container runtime;
- no LinkedIn authenticated session;
- no production data by default;
- no outbound;
- secrets external to source if a key is later authorized;
- bounded egress;
- timeout/resource/content limits;
- failure/retry/reconciliation evidence;
- uninstall/rollback path.

### Q3 — Bounded comparative READ validation

Separate owner gate per cell.

Examples:
- SearXNG vs an approved search challenger for `SEARCH_WEB`;
- Crawl4AI vs an approved extraction challenger for `EXTRACT_WEB_PAGE`;
- public-web buyer discovery vs Apollo READ for `FIND_BUYER_CANDIDATES`;
- local email inference/verification vs an approved provider for email cells.

Each comparison must use the Provider Evaluation Protocol and record:
- exact normalized input;
- exact versions/adapters;
- request/result fingerprints;
- coverage/identity correctness;
- UNKNOWN/PARTIAL/ERROR behavior;
- freshness/provenance;
- actual/known cost;
- latency;
- rights/security notes.

No universal provider score or winner.

### Q4 — Adoption/promotion

Separate architecture/owner decision.

Allowed outcomes:
- `ADOPT_AS_DEPENDENCY`
- `ADOPT_AS_SEPARATE_SERVICE`
- `DROWK_REIMPLEMENTED_PATTERN`
- `LAB_ONLY`
- `REJECT`

A promotion requires an exact version/digest, ownership/maintenance plan, replacement plan and security/license review.

## DROWK contract direction

A future implementation should fit:

```text
DROWK Capability
    -> policy/budget
    -> provider/search/extraction adapter
    -> external/open-source service
    -> ProviderRun/ResearchRun
    -> Observation/Evidence
    -> identity/buyer/procurement candidate
    -> deterministic/human acceptance
```

It must not fit:

```text
external tool
    -> direct Contact/BuyerRole truth
    -> automatic outbound
```

## Waterfall rules to qualify

Future offline design should explicitly test:

- cheapest source is not automatically first;
- first non-empty response is not automatically accepted;
- verified/high-quality evidence may stop the chain;
- low-confidence evidence may be retained while deeper providers continue;
- provider failure degrades the row/run, not the whole batch;
- unconfigured/ineligible/unmapped/pending/error are visible attempt states;
- duplicate provider spend is prevented by canonical cache where safe;
- freshness is field/capability specific;
- unverified fallback is not cached as verified truth;
- deferred providers resume deterministically;
- actual cost unknown != zero.

## Email-specific rules

`FIND_PROFESSIONAL_EMAIL` and `VERIFY_PROFESSIONAL_EMAIL` remain distinct.

Preferred progressive sequence to qualify:

```text
published company email evidence
-> company pattern inference
-> deterministic candidate generation
-> syntax/domain/MX
-> mailbox/catch-all verification when technically reliable
-> optional approved provider fallback
-> UNKNOWN when proof is insufficient
```

No SMTP/network limitation may be converted into `VALID`.

## LinkedIn-specific rules

DROWK may qualify public/indexed professional-profile discovery as EvidenceCandidate.

DROWK will not qualify:
- `li_at`/session-cookie based access;
- authenticated browser scraping;
- Sales Navigator selector extraction;
- CAPTCHA/rate-limit bypass;
- automated connect/message/InMail actions.

The current owner LinkedIn identity remains governed by the External Identity and Dependency Boundary and must not become an infrastructure credential.

## Relationship to roadmap

This package is a capability prerequisite/input, not a new product surface.

Downstream dependencies:
- DCRM-06 consumes company/facility/search capabilities.
- DCRM-07 consumes buyer/employment/procurement capabilities.
- DCRM-08 may consume public-web/job/procurement signals.
- future Prospecting Cockpit consumes Evidence/attempt/gap visibility.

DCRM-06/07 remain responsible for product/domain behavior; this package must not absorb BuyerRole, ProcurementRoute, Relationship or outbound authority into provider adapters.

## Relationship to active EF-03 stream

EF-03 remains the active Execution Foundation live-staging gate.

DCRM-05D Q0 documentation may be merged independently because it has no live/runtime effect.
Q1+ implementation/lab work is not implicitly authorized and must not be confused with EF-03 Gate A/B.

## Closure conditions for Q0

Q0 closes only when:
1. harvest document exists with exact upstream SHAs;
2. license/disposition table exists;
3. prohibited LinkedIn surfaces are explicit;
4. capability cells are named;
5. Q1-Q4 gates are explicit;
6. Roadmap/Capability/Provider Evaluation/Index reference the package;
7. docs-only PR exact-head CI is green;
8. protected-main post-merge CI is green.

Closing Q0 does not close DCRM-05D overall.
