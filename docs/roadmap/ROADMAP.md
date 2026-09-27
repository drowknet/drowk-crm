# DROWK CRM Roadmap

This roadmap is architecture-first and preservation-first.

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
- freshness-aware Work.

## DCRM-05 — AIsa Capability Lab
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

## DCRM-06 — Territory + Target Universe
- serviceable geography;
- facility/location discovery;
- ICP rules;
- company/account candidates;
- progressive intelligence budgets.

## DCRM-07 — Buyer + Procurement Graph
- buyer committee coverage;
- employment evidence;
- relationship evidence;
- procurement/vendor routes;
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
- policy learning inputs.

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
