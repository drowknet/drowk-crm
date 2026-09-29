# DROWK CRM Roadmap

This roadmap is architecture-first and preservation-first.

Read this roadmap together with:
- docs/product/PRODUCT_NORTH_STAR.md;
- docs/product/UX_OPERATING_MODEL.md.

The roadmap exists to produce a coherent Revenue & Relationship Operating System,
not an accumulation of infrastructure or disconnected modules. Material work
packages should name the operator outcome they unlock or protect.

## DCRM-00 — Foundation and extraction
- establish repository constitution;
- audit existing PWM_CRM;
- map domain vs Google-specific vs tenant-specific logic;
- define canonical data contracts;
- define security and migration gates.

## DCRM-01 — Core domain + PostgreSQL
- tenant/user;
- account/facility/contact/identity;
- conversation/activity/participants;
- pursuit/opportunity;
- evidence/signal;
- policy/audit primitives;
- migrations and contract tests.

## DCRM-02 — Authenticated operator shell
- drowk.net deployment path;
- owner/admin/operator roles;
- tenant context;
- secure session model;
- system health/admin views.

## DCRM-03 — Gmail evidence connector
- DCRM-03A contract/synthetic extraction may run in parallel with DCRM-01/02;
- OAuth connector only after the observation boundary is proven;
- history/source watermark and controlled recovery;
- observation ledger;
- SENT/Draft technical evidence;
- spam-neutral commercial relevance gate;
- identity/linkage candidates;
- policy-controlled promotion to accepted CRM projection;
- no automatic outbound execution.

## DCRM-04 — Work Engine parity
- port deterministic work compilation;
- compare against legacy golden snapshots;
- explain every delta;
- freshness-aware Work;
- keep Work distinct from Activity history, Task semantics and bilateral Commitment state;
- preserve the source/reason/commitment reference that caused work without silently rewriting it.

### Relationship-memory foundation checkpoint

After DCRM-04A parity is proven, inspect whether the executable core now has enough
temporal relationship memory before richer buyer/research UI proceeds. The minimum
canonical concepts are Person, Identity, Employment, Relationship, Buyer Role and
Commitment, with Contact remaining an operational representation.

This checkpoint must preserve:
- person continuity across employer/channel changes;
- historical organization context;
- observation coverage and permission uncertainty;
- significant interaction distinct from raw activity;
- Commitment distinct from internal Task/Work;
- no universal opaque relationship-trust score.

Do not turn this checkpoint into a giant social graph, omnichannel capture project
or learned-scoring program.

Selected relationship-memory foundation slices:
- **DCRM-04B — Durable Human Continuity Foundation**: Person + canonical Identity +
  temporal Employment + explicit Contact -> Person linkage. CLOSED/GREEN.
- **DCRM-04C — Accepted Interaction Foundation**: Conversation + Activity +
  ActivityParticipant + evidence/policy-controlled accepted interaction projection. CLOSED/GREEN.
- **DCRM-04D — Commitment Memory Foundation**: attributable request/promise/agreed-next-step
  memory, who owes the next move, date/condition, state and Activity/Evidence/Policy lineage. CLOSED/GREEN.
- **DCRM-04E — Interaction Continuity Hardening**: idempotent source Conversation claim plus
  append-only participant correction/retraction before Relationship consumes interaction history. CLOSED/GREEN.
- **DCRM-04F — Relationship Memory Foundation**: durable tenant-to-Person Relationship plus
  attributable Activity/reciprocal/meaningful interaction assertions and independent clocks. CLOSED/GREEN.
- Buyer Role remains aligned with DCRM-07.

The post-DCRM-04B checkpoint found Conversation/Activity/Participant missing from
the executable core. DCRM-04C closed that gap. The post-DCRM-04C checkpoint then
selected Commitment as the next smallest dependency because Work already exists but
cannot represent the bilateral fact of who promised/requested what and who owes the
next move. Relationship should consume attributable Activity + Commitment history
rather than absorb those semantics into a score or giant graph. Before that consumption,
DCRM-04E closed the source-Conversation idempotency and participant-correction gates
recorded at DCRM-04C closure. DCRM-04F can now add Relationship without compensating
for fragmented Conversation identity or stale participant links.

## DCRM-05 — AIsa Capability Lab

Selected slices:
- **DCRM-05A — Capability Lab Harness**: provider-neutral synthetic READ-only ResearchRun/ProviderRun harness, deterministic fingerprints, budgets, cost/result semantics and evaluation facts before live provider validation. CLOSED/GREEN.
- **DCRM-05B — Provider Selection & Live Validation Readiness**: selected `AIsa REST -> DataForSEO Business Listings Search Live` for `FACILITY_LOCATION_DISCOVERY`; bounded READ-only envelope documented. CLOSED/SELECTED, NO LIVE CALL.
- **DCRM-05C — AIsa/DataForSEO Business Listings Live READ Validation**: one bounded owner-authorized call completed, exact cell promoted to `LIVE_VALIDATED_CAPABILITY`, merged to `main`, post-merge CI green. CLOSED/GREEN.

The accumulated foundation through DCRM-05C is released to `main`. Broader AIsa capability
discovery/evaluation remains workload-specific and does not inherit authority from the single
validated cell.

Read-only evaluation of:
- Apollo
- LinkedIn
- DataForSEO
- Similarweb
- Exa
- Tavily
- Firecrawl
- Jina
- research/model providers

Measure:
- accuracy
- coverage
- freshness
- latency
- cost
- failure modes
- evidence quality

## Execution Foundation — cross-cutting prerequisite before DCRM-06 expansion

Execution Foundation is deliberately outside the DCRM product numbering so DCRM-06 remains
Territory + Target Universe.

Selected sequence:
- **EF-01A — Executable Engineering Harness, Reproducible CI & Secret Safety**:
  executable harness modes, real lint gate, frozen lockfile CI, immutable action pins and
  redacted secret sensors. CLOSED/GREEN; merged through PR #18 with post-merge CI green; no deploy.
- **EF-01B — Repository Governance & Branch Protection**:
  required checks, protected `main`, merge governance and repository-admin enforcement.
  CLOSED/GREEN; merged through protected `main` with post-merge CI green. `main` remains
  protected with exact required checks; no deploy.
- **EF-02 — Reproducible Runtime Packaging**:
  non-root API/worker containers, runtime config validation, graceful shutdown, local Compose,
  immutable image identity. PLANNED.
- **EF-03 — Staging Boundary**:
  Cloudflare Access/Tunnel, managed PostgreSQL, runtime secret injection and explicit rollback.
  PLANNED; deployment requires a separate owner gate.
- **EF-04 — Durable Execution**:
  PostgreSQL-first vs Cloudflare Workflows bounded spike, ActionAttempt
  PREPARED -> DISPATCHING -> ACCEPTED|FAILED|UNKNOWN -> RECONCILED semantics. PLANNED.
- **EF-05 — Observability & Recovery**:
  structured correlation/tenant/run telemetry, data minimization, backup/PITR/restore drill,
  operator runbooks. PLANNED.
- **EF-06 — Bounded Agent Runtime Integration**:
  read-only Hermes x DROWK MCP/API spike behind DROWK policy/identity, no direct DB authority.
  PLANNED.

No later EF package is implicitly authorized by EF-01A.

## DCRM-06 — Territory + Target Universe
- serviceable geography;
- facility/location discovery;
- ICP rules;
- company/account candidates;
- progressive intelligence budgets.

## DCRM-07 — Buyer + Procurement Graph
- buyer committee coverage;
- temporal Employment and Buyer Role evidence;
- relationship evidence and responsible owner;
- introduction paths with availability/permission distinct from mere connection;
- procurement/vendor routes by Account/Facility/region/service scope;
- committee continuity and coverage gaps after job changes;
- unresolved evidence gaps.

## DCRM-08 — Signal Fusion
- Signal Ledger;
- signal stacking;
- explainable account readiness;
- source diversity/freshness;
- deterministic actionability gates.

## DCRM-09 — Intelligence Briefs + Cadences
- Account Brief;
- Research Brief;
- cadence definitions/enrollment/steps;
- Work integration;
- prepare-only communication actions.

## DCRM-10 — Anderson Voice + Evaluation
- tenant/user voice profiles;
- model tournament;
- golden datasets;
- style/factuality/policy evals;
- human edit capture.

## DCRM-11 — Outcome Intelligence
- response/outcome attribution;
- signal usefulness;
- buyer-role performance;
- cadence/message performance;
- introduction outcomes;
- commitment fulfillment and unresolved commitments;
- relationship reactivation outcomes;
- seller-effort vs buyer-progress measurement;
- policy learning inputs;
- no causal claim merely from temporal association.

## DCRM-12 — Higher autonomy
Only after evidence supports it:
- approval-bound execution;
- isolated executor capability;
- strict policy enforcement;
- rollback/kill switch;
- continuous safety evals.

## Explicit non-goals for early phases
- autonomous mass outbound;
- unrestricted multi-agent meshes;
- fuzzy auto-merge;
- provider-owned canonical schemas;
- standalone graph/vector databases without demonstrated need;
- replacing deterministic policy with model judgment.
