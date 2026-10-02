# Prospecting Open-Source Harvest — 2026-10-01

Status: RESEARCH RECORDED / NO IMPLEMENTATION AUTHORITY

Purpose: preserve the exact open-source prospecting/enrichment findings that may reduce DROWK/reference-tenant dependence on LinkedIn Sales Navigator and Evaboot without turning browser automation, provider marketing claims or external repository schemas into DROWK authority.

This document is a source/architecture harvest. It does not authorize:
- installing a dependency in production;
- live Apollo/AIsa/LinkedIn/provider calls;
- authenticated LinkedIn scraping;
- browser/session-cookie automation against LinkedIn;
- outbound messaging;
- schema/runtime changes;
- EF-03 live actions.

## Decision frame

The target is not to clone LinkedIn.

The target is to replace the commercial workflow that would otherwise require Sales Navigator + Evaboot:

```text
facility/account discovery
-> buyer candidate discovery
-> public professional/profile evidence
-> company/person enrichment
-> professional-email candidate
-> email verification
-> employment/procurement evidence
-> relationship/history reconstruction
-> human-reviewed commercial work
```

LinkedIn's proprietary relationship graph, private/non-indexed data, InMail and some LinkedIn-native filters are not assumed replaceable by open source.

## Pinned external sources inspected

Repository popularity is context only, never an adoption criterion.

| Repository | Inspected default-branch SHA | License observed | Disposition |
|---|---|---|---|
| `unclecode/crawl4ai` | `e5d2e786d1a101225f3f6a3e6fd344d76eeb13af` | Apache-2.0 | `ADOPT_CANDIDATE` as bounded web-extraction service/library; LinkedIn scraping demos excluded |
| `searxng/searxng` | `a9d99003344ac3879ec45c56c661283482a92a39` | AGPL-3.0 | `SEPARATE_SERVICE_CANDIDATE`; approved engines only |
| `clawnify/OpenProspector` | `4f18809a15b609bc6420d23003d15a7149d540d7` | MIT | `CODE_HARVEST_CANDIDATE`; Sales Navigator/browser-agent surface excluded |
| `masteranime/enrichment-kit` | `6998898c038a1f61c900aa8d96290b93049d0b84` | MIT | `CODE_HARVEST_CANDIDATE` for confidence/cost-aware waterfall patterns |
| `eliasstravik/rowbound` | `1756a51083faa2d47a4400b32e4290c7e5118c84` | MIT | `CODE_HARVEST_CANDIDATE` for action DAG, incremental execution and URL/SSRF guard patterns |
| `openenrich/openenrich` | `570042c8b5db008aeb9026e4c2cfbd7f90712b82` | AGPL-3.0 | `CAPABILITY_LAB_CANDIDATE`; algorithm/pattern harvest only until license/security review |
| `debpalash/opengtm` | `9fe0b57689230335aceceac691de42f620365b0f` | repository LICENSE text = GNU AGPLv3; GitHub metadata returned NOASSERTION | `ARCHITECTURE_HARVEST_ONLY` |
| `Atum246/keelead` | `a846e2b6c19f781d44073f2e651c1ac8de52cf4a` | MIT | `SELECTIVE_SOURCE_HARVEST_ONLY`; not trusted as email-verification authority |
| `m8sec/crosslinked` | `2ae8d7bd5b1e9378f45cbf6ed38a3e79ded3acaf` | GPL-3.0 | `CONCEPT_HARVEST_ONLY`; search-index discovery concept, not dependency |

Any later adoption must revalidate the exact candidate version, license, security posture and behavior. A newer upstream SHA does not inherit this disposition.

## Harvested engineering patterns

### Crawl4AI

Useful:
- structured extraction from public company/web pages;
- bounded crawl/extract API;
- deterministic regex/schema extraction before LLM use where possible;
- MCP/API support;
- mature test/security surface.

DROWK candidate use:
- company/team/leadership pages;
- facility/location pages;
- vendor/procurement/supplier-registration pages;
- public contact/role evidence;
- public job/hiring evidence.

Excluded:
- authenticated LinkedIn profile/session scraping;
- saved browser identity profiles for LinkedIn;
- arbitrary user-supplied hooks/JS as business authority.

If adopted, run behind DROWK egress, timeout, content-size, scheme/host and auth controls. External content remains Evidence input, not CRM Truth.

### SearXNG

Useful:
- self-hosted metasearch substrate;
- multiple search engines behind one adapter;
- source/result URL preservation;
- no required LinkedIn login.

DROWK candidate use:
- facility/account discovery;
- public buyer-profile discovery;
- procurement/vendor-route search;
- source diversification.

Required boundary:
- own instance;
- approved-engine allowlist;
- rights/terms review per enabled engine;
- no assumption that an engine being technically supported authorizes DROWK use;
- preserve source URLs and search provenance.

### OpenProspector

Useful implementation patterns:
- provider registry and per-field eligibility;
- explicit `unconfigured`, `ineligible`, `error`, `unmapped`, `pending`, `hit` semantics;
- provider-attempt ledger with latency/cost/detail;
- deferred/callback provider continuation;
- cross-run cache with freshness cap;
- provider attribution;
- bounded push destination safety;
- no implicit cold-email sender in the core enrichment path.

Excluded:
- Sales Navigator browser-agent export;
- any assumption that a provider hit is canonical contact truth.

DROWK consequence:
`HTTP 200 != accepted evidence`.
A hit without a mappable value must remain a mapping/error state, not a success.

### enrichment-kit

Useful patterns:
- cost/hit-rate-aware provider ordering;
- confidence-gated early exit;
- best-of-N rather than first-non-empty;
- canonical cross-provider cache identity;
- semantic validation before accepting a waterfall result.

DROWK consequence:
confidence thresholds must be capability/workload specific; no universal `0.85` threshold is adopted.

### Rowbound

Useful patterns:
- typed per-row actions;
- dependency DAG;
- incremental/idempotent reruns;
- reconciliation/run tracking;
- rate limiting;
- URL/SSRF guard;
- shared command/action definitions usable through CLI/MCP.

DROWK consequence:
harvest execution-safety primitives only; DROWK Work/Policy remains authority.

### OpenEnrich

Useful patterns:
- company-site email-pattern inference;
- deterministic candidate generation;
- MX checks;
- SMTP RCPT verification;
- catch-all handling;
- per-domain pattern memory;
- deterministic batch/waterfall;
- cost cap and dry-run;
- provider fallback only after free/local evidence is insufficient;
- explicit degradation to unverified/unknown when SMTP cannot prove mailbox existence.

Boundary:
- project is young;
- AGPL;
- direct code incorporation into proprietary core is not authorized by this harvest;
- port-25 availability and sender reputation/network policy are environmental constraints.

### OpenGTM

Useful architecture patterns:
- source health;
- provider accounting;
- field provenance;
- job-change continuity;
- entity/identity continuity;
- queue lease/recovery/reconciliation;
- RLS/tenant tests;
- MCP read/write scope tests;
- capability/workflow eval suites;
- waterfall validation;
- source reliability.

Excluded:
- LinkedIn Chrome extraction;
- LinkedIn session-cookie support;
- stealth/patched-browser or TLS-impersonation patterns for LinkedIn;
- direct adoption of the AGPL application into DROWK core.

### KeeLead

Useful:
- public-source inventory;
- SEC EDGAR, OpenCorporates, Companies House, USASpending, Census, SAM.gov, USPTO, OSM and related adapter ideas;
- search-engine discovery of indexed LinkedIn profile URLs without logging into LinkedIn.

Rejected as authority:
- current "SMTP" layer mostly proves mail infrastructure, not mailbox existence;
- current catch-all path assumes rather than proves;
- some network failures degrade to assumed-valid states;
- base source helpers include synthetic phone/domain generators.

No generated/synthetic contact data may enter DROWK Evidence as observed fact.

### CrossLinked

Useful concept only:
`organization -> search-engine indexed linkedin.com/in results -> employee-name candidates`.

Do not make it a DROWK runtime dependency. Reimplement the bounded discovery concept over the approved search fabric if the capability is selected.

## Explicit LinkedIn boundary

The following are rejected for the DROWK canonical prospecting path:

- automated authenticated scraping of LinkedIn;
- browser automation using the owner's LinkedIn session;
- storage/use of LinkedIn session cookies such as `li_at`;
- selector-based Sales Navigator extraction;
- automated connection/message/InMail actions;
- CAPTCHA/rate-limit circumvention;
- treating indexed snippets as verified Employment or BuyerRole truth.

Allowed candidate pattern:

```text
approved web-search capability
-> indexed public profile/company URL/snippet
-> low-authority EvidenceCandidate
-> triangulate against company site / provider / prior evidence
-> human or policy-controlled acceptance
```

## Capability cells created for qualification

The harvest feeds these provider-neutral cells:

| Capability cell | Candidate open-source path | Required output semantics |
|---|---|---|
| `SEARCH_WEB` | SearXNG | source URL, engine/source provenance, retrieved_at, query fingerprint, result state |
| `EXTRACT_WEB_PAGE` | Crawl4AI | URL, content fingerprint, extracted facts, retrieved_at, extraction/parser version |
| `DISCOVER_COMPANIES` | search + public datasets + Crawl4AI | AccountCandidate/Evidence only |
| `DISCOVER_PUBLIC_PROFESSIONAL_PROFILE` | approved search queries over indexed public pages | URL/snippet candidate; never Employment truth |
| `FIND_BUYER_CANDIDATES` | search + public web + Apollo READ challenger | Person/Employment/BuyerRole candidates with evidence gaps |
| `ENRICH_COMPANY` | public datasets/company web/provider waterfall | per-field provenance/freshness |
| `FIND_PROFESSIONAL_EMAIL` | published email -> pattern inference -> provider fallback | candidate + source/method + verification state |
| `VERIFY_PROFESSIONAL_EMAIL` | syntax/MX/SMTP/catch-all + optional provider challenger | VERIFIED/REJECTED/CATCH_ALL/UNKNOWN/ERROR; unknown never coerced to valid |
| `VERIFY_EMPLOYMENT` | company site + public profile snippet + Apollo/provider evidence | evidence set; no fuzzy auto-promotion |
| `FIND_PROCUREMENT_ROUTE` | search + Crawl4AI on supplier/vendor/procurement pages | attributable route candidate + source URL/freshness |

These cells do not inherit the existing DCRM-05C `LIVE_VALIDATED_CAPABILITY` status.

## Qualification sequence

### Q0 — source and license pin

Complete in this document:
- exact upstream SHAs recorded;
- observed licenses recorded;
- disposition recorded;
- prohibited LinkedIn surfaces recorded.

Q0 is documentation evidence only.

### Q1 — offline contract/eval design

Future owner-authorized docs/test work:
- define normalized fixtures for each selected cell;
- define result states;
- define evidence/provenance fields;
- define freshness and cache rules per field;
- define cost/latency accounting;
- define expected UNKNOWN behavior;
- define security/rights gate;
- no network calls.

### Q2 — bounded local/self-hosted lab

Only after explicit authorization:
- install/pin one candidate at a time in isolated lab;
- no production dependency;
- no LinkedIn authenticated session;
- no real outbound;
- no secrets in repo;
- run deterministic public/synthetic fixtures;
- capture resource footprint, failure modes, logs and security posture.

### Q3 — comparative READ validation

Only after a separate owner gate:
- compare one exact capability cell at a time;
- open-source path vs existing approved provider challenger where applicable;
- preserve provider/source evidence separately;
- bounded cost/tool/time budget;
- no universal provider winner score.

Examples:
- SearXNG vs approved search capability for `SEARCH_WEB`;
- Crawl4AI vs Firecrawl/AIsa extraction challenger for `EXTRACT_WEB_PAGE`;
- public-web buyer candidate path vs Apollo READ for `FIND_BUYER_CANDIDATES`;
- local email inference/verification vs Apollo/other approved verifier for email cells.

### Q4 — adoption decision

A candidate may be promoted only after:
- rights/license review;
- security review;
- capability-cell quality evidence;
- TCO/resource evidence;
- failure/recovery semantics;
- observability;
- replacement/exit plan;
- exact version/digest pin;
- explicit owner approval.

Promotion choices remain:
- `ADOPT_AS_DEPENDENCY`;
- `ADOPT_AS_SEPARATE_SERVICE`;
- `DROWK_REIMPLEMENTED_PATTERN`;
- `LAB_ONLY`;
- `REJECT`.

## Success measures

Measure per capability cell, not as one tool score:
- precision / identity correctness;
- useful coverage;
- UNKNOWN rate;
- freshness;
- source/provenance completeness;
- operator time saved;
- latency;
- per-resolved-field cost;
- failed/partial/pending rate;
- duplicate provider spend avoided;
- false-positive rate;
- rights/security burden;
- replacement cost.

A low-cost source that invents certainty fails.

## Product integration dependency

This harvest is a dependency input to:
- DCRM-06 Territory + Target Universe: company/facility discovery and progressive research;
- DCRM-07 Buyer + Procurement Graph: buyer candidates, Employment evidence, procurement-route research;
- DCRM-08 Signal Fusion: public-web/company/job/procurement signals;
- later Prospecting Cockpit: source/evidence/provider-attempt visibility.

It does not authorize those slices.

## Relationship to Apollo, AIsa, JEV and tenant Gmail

- Apollo remains an independent provider binding and potential READ challenger; this harvest does not authorize Apollo calls.
- AIsa remains a capability fabric and may route approved search/extraction/provider operations; one validated DataForSEO cell does not validate these new cells.
- JEV remains judgment-only and may later classify bounded research findings; it is not a crawler, identity authority or sender.
- tenant Gmail remains a business-channel adapter and future evidence/outbound surface; it is not required for search/enrichment infrastructure.

## No loose-end rule

Before any implementation based on this harvest, the work must name:
1. exact capability cell;
2. exact source SHA/version;
3. legal/license disposition;
4. normalized input/output contract;
5. result/failure/UNKNOWN semantics;
6. evidence/provenance mapping;
7. cost/time/tool budget;
8. credential/read-write class;
9. security/egress boundary;
10. eval fixture and pass criteria;
11. rollback/removal path;
12. owner gate.

Missing items remain explicit blockers, not assumptions.
