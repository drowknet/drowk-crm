# DCRM-05A — Capability Lab Harness

Status: READY FOR HANDOFF — FEATURE BRANCH PENDING

## Why this work package exists

DCRM-04F completes the current relationship-memory foundation.

The roadmap now returns to DCRM-05: AIsa Capability Lab.

The repository already has provider-neutral ResearchRun / ProviderRun contracts,
foundation persistence tables and an evaluation protocol, but no executable
provider-neutral lab repository/harness.

DCRM-05A makes the lab executable **without live provider calls**.

## Operator / product outcome

DROWK can execute a bounded synthetic capability evaluation and preserve exactly:
- what capability was requested;
- which provider/operation/interface was evaluated;
- whether the path is READ or WRITE;
- deterministic request/response fingerprints;
- result semantics;
- estimated/actual cost and whether actual cost is known;
- retrieved/observed time;
- rights class;
- latency/provenance needed by the lab;
- ResearchRun objective/budget/stop state.

This creates a trustworthy substrate for later live provider comparison without
letting vendor schemas or marketing claims become CRM truth.

## Scope

Implement only:

1. typed provider-neutral capability request / lab case boundary;
2. ResearchRun persistence and deterministic lifecycle sensors;
3. ProviderRun append-only persistence;
4. deterministic request/response fingerprinting over normalized synthetic inputs/outputs;
5. synthetic READ-only capability adapter/harness;
6. bounded cost/tool-call/stop-condition enforcement;
7. factual per-capability-cell evaluation records/queries.

No live provider credential or network call is part of DCRM-05A.

## Canonical invariants

Preserve:

- AIsa/provider != CRM system of record;
- provider-native IDs remain namespaced evidence, never canonical entity IDs;
- capability request != provider selection;
- DOCUMENTED_CAPABILITY != LIVE_VALIDATED_CAPABILITY;
- synthetic fixture success != LIVE_VALIDATED_CAPABILITY;
- READ != WRITE;
- EMPTY_WITHIN_RESPONSE != universal absence;
- UNKNOWN != EMPTY;
- ERROR != UNKNOWN;
- actual cost unknown != zero;
- estimated cost != actual cost;
- provider/model output != accepted CRM truth;
- no universal provider score;
- evaluation is capability/workload-specific;
- no secret/credential material in fingerprints or persisted normalized fixtures.

## Capability request / lab case

Introduce the minimum typed boundary needed to run a deterministic lab case.

Expected fields/semantics:
- caseId;
- capabilityId;
- workload/capability cell;
- provider;
- operation;
- interface;
- accessClass;
- normalized synthetic input;
- locale/geography when relevant;
- maxCostUsdMicros;
- maxToolCalls;
- stopCondition;
- rightsClass;
- adapterVersion.

Rules:
- DCRM-05A accepts only `READ` execution;
- WRITE declarations may exist in capability metadata but cannot execute;
- normalized input must be deterministic;
- secrets/tokens/credentials are forbidden from normalized input and fingerprints;
- one identical lab case yields one deterministic request fingerprint.

Naming may vary; semantics may not.

## ResearchRun persistence

Use the existing canonical `ResearchRun` contract/table unless an enforcement gap
requires a forward-only migration.

Minimum repository behavior:
- create/get ResearchRun;
- move through a bounded deterministic lifecycle;
- record output Evidence IDs only as references; DCRM-05A does not need to create
  accepted CRM truth;
- enforce max cost/tool-call/stop condition at the lab boundary;
- terminal states remain:
  `SUFFICIENT | EXHAUSTED | BLOCKED | FAILED`.

Do not silently convert missing evidence into success.

## ProviderRun persistence

Use the existing canonical `ProviderRun` contract/table.

Minimum repository behavior:
- append ProviderRun;
- get/list by ResearchRun/correlation/capability/provider as useful for evaluation;
- preserve exact result state:
  `PRESENT | EMPTY_WITHIN_RESPONSE | UNKNOWN | ERROR | PENDING | PARTIAL`;
- preserve estimated cost;
- preserve actual cost and `actualCostKnown`;
- preserve retrievedAt/observedAt;
- preserve rightsClass;
- preserve deterministic request/response fingerprints.

ProviderRun history must be append-only/immutable.

Cost rule:
- if `actualCostKnown=false`, unknown actual cost must not be serialized as zero;
- a known legitimate zero cost may be represented only with
  `actualCostKnown=true`.

## Synthetic adapter / harness

Provide a deterministic fixture-driven READ-only adapter/harness.

It must:
- receive the typed capability request;
- return deterministic synthetic provider output;
- produce ProviderRun audit data;
- never perform network access;
- never read environment credentials;
- never call MCP/provider SDKs;
- never mutate Account/Facility/Person/Relationship/Commitment/Work;
- never mark itself as live validated.

Fixtures should exercise at least:
- PRESENT;
- EMPTY_WITHIN_RESPONSE;
- UNKNOWN;
- ERROR;
- PARTIAL;
- known cost;
- unknown cost;
- known zero cost;
- rights-blocked or blocked execution before provider invocation;
- budget exhaustion;
- tool-call exhaustion.

## Evaluation semantics

Expose deterministic facts/queries by capability cell.

At minimum make it possible to compare factual observations such as:
- result-state counts;
- latency;
- cost-known coverage;
- known cost totals;
- freshness/observed-time availability;
- rights availability;
- evidence/provenance completeness.

Do not compute or persist a universal provider winner/score.

A provider can be strong in one capability cell and unknown/blocked in another.

## Capability state boundary

The protocol vocabulary remains:
- `DOCUMENTED_CAPABILITY`;
- `LIVE_VALIDATED_CAPABILITY`;
- `UNSUPPORTED`;
- `UNASSESSED`;
- `TEMPORARILY_UNAVAILABLE`;
- `RIGHTS_BLOCKED`.

DCRM-05A synthetic execution may support documentation/harness validation but must
not promote any provider/capability cell to `LIVE_VALIDATED_CAPABILITY`.

If capability-state persistence is added, this rule must be enforced and sensor-backed.

## Persistence / migration

Existing `research_runs` and `provider_runs` tables are the preferred starting point.

Add the next forward-only migration after `0012_relationship_memory.sql` only if
needed to enforce DCRM-05A invariants such as:
- immutable ProviderRun history;
- cost-known consistency;
- nonnegative cost;
- deterministic lineage/lookup constraints.

Do not redesign unrelated foundation tables.

## Required synthetic golden cases

At minimum:

1. deterministic normalized request produces stable request fingerprint;
2. materially changed normalized input changes request fingerprint;
3. credential-like fields are rejected or excluded before fingerprint persistence;
4. READ synthetic case executes;
5. WRITE execution fails closed;
6. no network/provider SDK/MCP call exists in harness;
7. PRESENT persists distinctly;
8. EMPTY_WITHIN_RESPONSE persists distinctly from UNKNOWN;
9. ERROR persists distinctly from UNKNOWN;
10. PARTIAL persists distinctly;
11. actualCostKnown=false does not become zero;
12. known zero cost requires actualCostKnown=true;
13. negative known/estimated cost fails closed;
14. ResearchRun max cost is enforced;
15. ResearchRun max tool calls is enforced;
16. stop condition can terminate as SUFFICIENT without extra calls;
17. unresolved evidence may terminate EXHAUSTED/BLOCKED without fabricated success;
18. ProviderRun history is immutable;
19. same capability may have independent provider observations;
20. same provider may have different results in different capability cells;
21. synthetic fixture never produces LIVE_VALIDATED_CAPABILITY;
22. no universal provider score/winner is persisted;
23. no canonical CRM mutation occurs;
24. no live Gmail/provider/model/outbound/deploy authority occurs.

## Explicit non-goals

Not in DCRM-05A:
- live Apollo;
- live LinkedIn/API scraping;
- live DataForSEO/Similarweb/Exa/Tavily/Firecrawl/Jina;
- live AIsa REST/MCP;
- provider credentials/secrets;
- provider purchasing/enablement decision;
- universal provider ranking;
- canonical enrichment promotion;
- BuyerRole/procurement graph;
- Signal creation/fusion;
- model/JEV business judgment;
- live Gmail/OAuth;
- Work persistence writer;
- outbound/draft/send;
- A3/A4;
- deployment;
- UI.

## Completion contract

DCRM-05A may close only when:
- provider-neutral lab contracts/harness compile;
- ResearchRun/ProviderRun persistence is sensor-backed;
- ProviderRun immutability is proven;
- result-state distinctions are proven;
- cost-known/unknown semantics are proven;
- budget/tool-call/stop-condition behavior is deterministic;
- synthetic adapters cannot perform network/provider calls;
- synthetic execution cannot become LIVE_VALIDATED_CAPABILITY;
- no canonical CRM mutation exists;
- no universal provider score exists;
- exact-head GitHub CI is green;
- ChatGPT deep review has no blocking finding;
- owner explicitly authorizes merge;
- post-merge CI is green.

## Writer / authority boundary

Once handed off on a dedicated feature branch:
- Codex is sole implementation writer;
- ChatGPT reviews GitHub and does not edit implementation surfaces;
- PWM_CRM remains read-only unless a concrete legacy question requires inspection;
- no live provider, merge, deploy or outbound action without explicit owner gate.
