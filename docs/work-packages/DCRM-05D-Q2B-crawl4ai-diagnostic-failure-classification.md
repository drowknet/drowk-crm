# DCRM-05D-Q2B — Crawl4AI Diagnostic Failure Classification

Status: Q2B-PREP ACTIVE / DOCS ONLY / NO EXECUTION AUTHORITY

Parent: [DCRM-05D capability qualification](DCRM-05D-prospecting-oss-harvest-capability-qualification.md).
Historical observation: [Q2A isolated lab](DCRM-05D-Q2A-crawl4ai-extract-web-page-isolated-lab.md).
Dispositions: [Q0 OSS harvest](../reference-harvest/PROSPECTING_OSS_HARVEST_2026-10-01.md).

## Purpose and checkpoint

Design a bounded diagnostic follow-up for Q2A's exit-1 / `ERROR` observation without weakening the frozen runtime or security boundary. This work package is not lab evidence.

Q2A engineering/process is CLOSED/GREEN at protected-main merge `175c23e78033aa6705783371cf858044460178f8`. Candidate outcome remains `LAB_BLOCKED`.

Observed candidate: Crawl4AI 0.9.4, capability `EXTRACT_WEB_PAGE`, exact image:

```text
unclecode/crawl4ai:0.9.4@sha256:9021b3cb5c6f12570bbcd5395638495e0a06969b3148e377b953d174af2ebc9b
```

Recorded Q2A facts: platform `linux/amd64`; validated plan `true`; network `none`; pull policy `never`; host ports `0`; three read-only bind mounts; exit code `1`; timeout `false`; executor error `none`; normalized result `ERROR`; selected facts `{}`. Raw stderr was deliberately discarded. Root cause remains unresolved; no internal cause is inferred. No successful Q2A lab evidence document exists.

## Stages and authority

| Stage | Scope and gate |
|---|---|
| Q2B-PREP | Current docs/canon-only stage; zero Docker execution. |
| Q2B-STATIC | Later bounded diagnostic instrumentation and deterministic static sensors; no candidate execution. Requires a separate reviewed implementation stage. |
| Q2B-DIAGNOSTIC-RUN | Separate explicit owner authorization; maximum one isolated execution, frozen boundary, safe classification only. |
| Q2B-DECISION | Later evidence review; no outcome selected in PREP. |

PREP authorizes no Docker commands, Crawl4AI execution, image pulls, public-web access, provider/model calls, credential use, LinkedIn, Gmail, Apollo, AIsa, runtime/tooling/application changes, successful lab evidence, PR creation or merge.

## Candidate diagnostic taxonomy

These are possible future allowlisted classes only. None is an observed Q2A fact or a selected root cause. Q2B-STATIC must review deterministic mappings before execution.

| Candidate code | Intended classification boundary |
|---|---|
| `IMPORT_FAILURE` | Explicitly instrumented import failure. |
| `DEPENDENCY_INITIALIZATION_FAILURE` | Explicitly instrumented dependency initialization failure. |
| `BROWSER_START_FAILURE` | Explicitly instrumented browser startup failure. |
| `RAW_INPUT_FAILURE` | Explicitly instrumented synthetic raw-input failure. |
| `EXTRACTION_STRATEGY_FAILURE` | Explicitly instrumented extraction-strategy failure. |
| `RESULT_SERIALIZATION_FAILURE` | Explicitly instrumented result serialization failure. |
| `RESOURCE_LIMIT_FAILURE` | Safe explicit evidence establishes a resource-limit failure; exit 1 alone is insufficient. |
| `UNKNOWN_CANDIDATE_FAILURE` | No supported unambiguous allowlisted classification is available. |

A boundary classification must not claim an underlying cause beyond the evidence. Missing, ambiguous or malformed diagnostics fail closed without guessing or inventing facts.

## Frozen observability boundary

- Raw stderr and raw diagnostic logs are never persisted or printed into transcripts/artifacts.
- No environment dump or secret/token/cookie/session logging.
- No sensitive host-path persistence.
- Deterministic allowlisted failure code only for diagnostic classification.
- Optional bounded safe diagnostic detail only if explicitly allowlisted before execution; PREP authorizes no free-text detail.
- Exception messages, tracebacks and arbitrary logs are not safe merely because they are truncated or redacted.
- Diagnostic observation != CRM truth; no accepted CRM mutation or successful lab claim follows from a failure code.

Q2B-STATIC must define the exact schema, mappings, size limits and rejection behavior. Deterministic synthetic sensors must cover recognized and unknown/ambiguous failures, malformed/oversized output, forbidden detail rejection, raw-output non-persistence, unchanged runtime controls and no retries. Static doubles are not candidate execution evidence.

## Frozen runtime boundary

Future diagnostic execution must preserve:

- exact pinned Crawl4AI image/digest above and validated platform identity;
- synthetic raw HTML only; no external fetch;
- `--network none`, `--pull never`, zero host ports and no host network;
- the same three read-only mounts as Q2A, exactly; Q2B grants no authority to substitute, add or broaden mounts;
- `--cap-drop ALL` and `--security-opt no-new-privileges`;
- no privileged mode, Docker socket or SSH agent;
- no browser profile/user-data/session/cookies or credential directories;
- no provider/model credentials;
- existing timeout/resource/content limits and bounded temporary storage;
- no DB writes, LinkedIn action or public-web crawl;
- no automatic retry; maximum one diagnostic execution after a separate explicit owner gate.

If later evidence suggests a different mount set is required, STOP. Any such change requires a separate reviewed owner gate before the change; no such change is authorized by Q2B-PREP, Q2B-STATIC or the currently defined Q2B-DIAGNOSTIC-RUN boundary.

No boundary weakening merely to make Crawl4AI pass. An unavailable pinned image or unsafe observability requirement is a blocker, not authority to pull images or add privileges, mounts, credentials or network access.

## Eventual decision definitions

| Outcome | Meaning |
|---|---|
| `DIAGNOSED_RETRY_ELIGIBLE` | Observed cause is understood and correction is possible without weakening the frozen boundary. Eligibility does not authorize correction or another execution. |
| `LAB_BLOCKED` | Cause remains unresolved or cannot be safely diagnosed inside the approved observability boundary. |
| `LAB_REJECT` | Evidence establishes that the candidate cannot satisfy required capability/security semantics without unacceptable relaxation. |

No Q2B-DECISION outcome is selected in PREP. Q2A's existing `LAB_BLOCKED` remains historical candidate status.

## Preserved candidate universe

Crawl4AI is one researched candidate. Qualification routes differ; no uniform installation/runtime-lab requirement is introduced.

| OSS candidate | Exact Q0 disposition | Current authority / next gate |
|---|---|---|
| Crawl4AI | `ADOPT_CANDIDATE` | Bounded extraction, `EXTRACT_WEB_PAGE`; Q2A `LAB_BLOCKED`, Q2B diagnostic prep active. No adoption. |
| SearXNG | `SEPARATE_SERVICE_CANDIDATE` | Primary cell `SEARCH_WEB`; Q2 not yet executed. Its own independent future Q2 gate may follow resolution or explicit stopping of the current Crawl4AI diagnostic. |
| OpenEnrich | `CAPABILITY_LAB_CANDIDATE` | Algorithm/pattern harvest only until license/security review. Dedicated license/security gate prerequisite before runtime qualification or adoption; not immediately runtime-lab-ready. |
| OpenProspector | `CODE_HARVEST_CANDIDATE` | Code/pattern harvest; no presumed installation/runtime lab. |
| enrichment-kit | `CODE_HARVEST_CANDIDATE` | Code/pattern harvest; no presumed installation/runtime lab. |
| Rowbound | `CODE_HARVEST_CANDIDATE` | Code/pattern harvest; no presumed installation/runtime lab. |
| OpenGTM | `ARCHITECTURE_HARVEST_ONLY` | No promotion to runtime candidate. |
| KeeLead | `SELECTIVE_SOURCE_HARVEST_ONLY` | No promotion to runtime candidate or verification authority. |
| CrossLinked | `CONCEPT_HARVEST_ONLY` | No promotion to runtime candidate. |

Exact source pins, license observations and exclusions remain owned by Q0.

## Separate challenger universe and closed gates

The OSS harvest is not the entire future evaluation universe. Apollo, DataForSEO, Similarweb, Exa, Tavily, Firecrawl, Jina, AIsa-routed capabilities and research/model providers remain separate provider/challenger categories. They do not inherit OSS dispositions or Q2 qualification. PREP authorizes none of them; historical DCRM-05C exact-cell validation does not generalize.

Q3 remains CLOSED. Separately authorized future comparisons already contemplate:

- Crawl4AI vs Firecrawl/AIsa challenger for `EXTRACT_WEB_PAGE`;
- SearXNG vs approved search challenger for `SEARCH_WEB`;
- public-web buyer path vs Apollo READ for `FIND_BUYER_CANDIDATES`.

No provider/public comparative READ is authorized here.

Q4 remains CLOSED. No adoption/promotion is authorized. Possible later outcomes remain `ADOPT_AS_DEPENDENCY`, `ADOPT_AS_SEPARATE_SERVICE`, `DROWK_REIMPLEMENTED_PATTERN`, `LAB_ONLY` and `REJECT`.

EF-03 remains separate: OPEN / LIVE STAGING GATE PENDING. Q2B grants zero authority for DigitalOcean, Neon, Cloudflare, GHCR, DNS, staging, deployment, live-provider calls, Gmail or outbound.

## PREP write scope and validation

Only these documentation files may change:

- `docs/work-packages/DCRM-05D-Q2B-crawl4ai-diagnostic-failure-classification.md`;
- `docs/work-packages/DCRM-05D-prospecting-oss-harvest-capability-qualification.md`;
- `docs/roadmap/ROADMAP.md`;
- `docs/engineering/CURRENT_EXECUTION_SEQUENCE.md`;
- `docs/index.md`.

Run `git diff --check` and verify all changed/untracked paths against this exact allowlist before staging. Stop on a scope violation. Tooling, packages, apps/services, capabilities/connectors, infra, CI, manifests/lockfiles and DB/migrations must remain unchanged. No Q2A file or evidence document is created or modified. Docker executions, provider calls and LinkedIn actions must each remain zero.

Affected objects are documentation/work-package routing only. Migration, dependency, runtime, provider and security-control changes: none. Rollback is a later reviewed documentation reversal; it cannot erase Q2A observations or grant execution authority.

The writer may commit the five validated docs with `docs(dcrm-05d): define Q2B Crawl4AI diagnostic gate` and push only the already-current `feat/dcrm-05d-q2b-crawl4ai-diagnostic-lab` branch. No PR or merge. PREP completion does not open STATIC, DIAGNOSTIC-RUN, Q3, Q4 or EF-03 live gates.
