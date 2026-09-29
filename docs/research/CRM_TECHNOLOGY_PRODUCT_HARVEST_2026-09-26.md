# DROWK CRM Technology & Product Harvest — 2026-09-26

Status: RESEARCH / ARCHITECTURE RECOMMENDATION — NOT YET AN ADR

## Executive conclusion

Do **not** restart DROWK CRM on top of a generic CRM such as EspoCRM, Frappe CRM,
Twenty, SuiteCRM, Odoo, or NocoBase.

DROWK already owns differentiated semantics that generic CRMs do not:
Observation -> Evidence -> Identity -> Signal -> Judgment -> Policy -> CRM Truth ->
Work -> Outcome.

The best path is a **DROWK-native canonical core**, while selectively harvesting
open-source components, UI patterns, infrastructure, and commodity services.

Generic CRM products should be treated as:
- UX/product prior art;
- source of reusable permissively-licensed components where legally clean;
- optional external/projection systems;
- future integration targets.

They should not become DROWK's canonical data model or authority layer.

## Product thesis

DROWK CRM should become a Revenue Intelligence & Prospecting Operating System, not
a clone of HubSpot/Salesforce and not a wrapper around Apollo.

Its differentiated assets are:

1. Account + Facility hierarchy.
2. Evidence Ledger with provenance/freshness.
3. IdentityEvidence + deterministic resolution.
4. Buyer / Procurement Route Graph.
5. Signal Ledger and readiness.
6. Progressive Intelligence with bounded provider spend.
7. Commercial Exclusion / relationship safety.
8. Deterministic Work Engine.
9. Gmail-native evidence/history.
10. AI judgment separated from authority.
11. Outcome Intelligence and replayable learning.
12. Provider-neutral AIsa capability fabric.
13. Human-governed bounded execution.

## Classification vocabulary

- ADOPT — use directly when implementation reaches the relevant phase.
- ADAPT — use selectively behind DROWK-owned contracts.
- PATTERN_ONLY — learn from it; do not make it a dependency.
- DEFER — valuable later; do not add operational surface now.
- REJECT_CORE — may be useful elsewhere, but not as DROWK CRM foundation.

# 1. CRM/platform candidates

## EspoCRM — REJECT_CORE / PATTERN_ONLY

Current facts:
- AGPLv3.
- PHP REST backend + custom SPA frontend.
- Supports PostgreSQL.
- Mature CRM concepts and native jobs.

What to harvest:
- activity timeline UX;
- record-level/field-level permission concepts;
- metadata-driven entities;
- job/admin operational patterns;
- mature CRM navigation.

Why not the core:
- would force DROWK's Evidence/Identity/Signal/Policy/Work semantics into an
  extension/sidecar;
- creates impedance mismatch between Espo's canonical CRM model and DROWK truth;
- PHP/custom frontend introduces a stack that does not otherwise advance DROWK;
- AGPL/core branding obligations matter if DROWK becomes a proprietary product;
- advanced workflow/Google features may introduce commercial extension dependency.

Conclusion:
EspoCRM is useful prior art, not the system we should build on.

Sources:
- https://github.com/espocrm/espocrm
- https://docs.espocrm.com/

## Twenty — ADAPT / PATTERN_ONLY, with selective MIT packages

Current facts:
- core is mostly AGPLv3;
- some files are Enterprise licensed;
- published SDKs, twenty-ui, and application packages are explicitly MIT-licensed;
- supports custom objects, server-side logic, UI components, REST/GraphQL,
  webhooks, OAuth and self-hosting.

What to harvest/adapt:
- object-centric CRM UX;
- modern command/navigation patterns;
- object views and configurable fields;
- application/extension model;
- MIT twenty-ui/SDK packages if dependency review confirms fit.

Why not the canonical core:
- DROWK's evidence and authority model is deeper than a configurable CRM object
  model;
- modifying the AGPL core would create licensing/product-strategy obligations;
- we do not need another product's application runtime to own DROWK semantics.

Sources:
- https://github.com/twentyhq/twenty
- https://github.com/twentyhq/twenty/blob/main/LICENSE

## Atomic CRM — ADAPT aggressively as UI/product acceleration

Current facts:
- MIT;
- React + react-admin + shadcn/ui + Supabase;
- explicitly designed for source-level customization;
- includes user management, import/export and inbound-email patterns.

Best use:
- strongest candidate in the supplied list for harvesting UI/application structure;
- evaluate page shell, record views, list filtering, activity UX, forms, responsive
  patterns, and testing structure;
- potentially reuse selected MIT code after provenance/dependency review.

Do not inherit blindly:
- its CRM schema;
- direct frontend-to-database authority;
- Supabase coupling;
- inbound-email truth semantics.

Source:
- https://github.com/marmelab/atomic-crm

## Frappe CRM — PATTERN_ONLY / DEFER for ERP bridge

Current facts:
- AGPL-3.0;
- Frappe Framework backend + Vue-based Frappe UI;
- standalone CRM;
- built-in ERPNext integration;
- ERPNext's older CRM module is scheduled for removal in favor of Frappe CRM.

What to harvest:
- Deal UX;
- integrated communication/call timeline;
- sales-to-quotation handoff;
- product/quotation integration patterns.

Strategic future use:
If DROWK later needs accounting, inventory, work orders, equipment, purchasing or
billing, ERPNext can be evaluated as an **external operations/ERP system** behind
DROWK connectors rather than replacing DROWK CRM.

Sources:
- https://github.com/frappe/crm
- https://docs.frappe.io/crm/erpnext

## Krayin — PATTERN_ONLY

Current facts:
- MIT;
- Laravel + Vue;
- modular CRM with custom attributes.

Positive:
Permissive license and modularity.

Negative:
Adds Laravel/PHP/MySQL-centric architecture without unique leverage over the
DROWK-native design.

Source:
- https://github.com/krayin/laravel-crm

## Corteza — PATTERN_ONLY

Current facts:
- Apache-2.0;
- low-code platform in Go/JavaScript/Vue;
- intended for CRM/business-process/data apps.

Useful:
- role/process builder ideas;
- low-code admin UX patterns.

Not core:
DROWK should not move policy, Evidence, Work or identity rules into a generic
low-code schema/runtime.

Source:
- https://github.com/cortezaproject/corteza

## NocoBase — REJECT_CORE

Current license is no longer a simple permissive Apache-2.0 story. The 2026 license
adds supplementary terms including branding restrictions and restrictions around
public no-code/low-code/AI platform products.

This is unnecessary product/licensing risk for DROWK's foundation.

Source:
- https://github.com/nocobase/nocobase/blob/main/LICENSE.txt

## SuiteCRM / Odoo / Dolibarr / Axelor / ERPNext as CRM foundation — REJECT_CORE

These products are broad business suites. They can become future integration
targets where DROWK needs accounting, ERP, order, contract or support workflows.

Do not subordinate DROWK's Revenue Intelligence model to their schemas.

# 2. Canonical data and backend

## PostgreSQL — ADOPT

Confirmed as the DROWK canonical business datastore.

Reasons:
- relational integrity for Tenant/Account/Facility/Contact;
- append/supersede evidence/history;
- JSONB for bounded snapshots;
- transactionally consistent event/idempotency state;
- row-level and application-level tenant controls;
- mature backup ecosystem;
- queue/durable-work options can reuse the same datastore.

## Supabase — ADAPT as managed PostgreSQL platform, not system of record semantics

Supabase can accelerate:
- managed PostgreSQL;
- connection pooling;
- backups;
- object storage;
- optionally authentication.

Current Pro list price: $25/month and daily backups with 7-day retention.

Boundary:
- DROWK Domain API owns canonical mutations;
- do not let frontend PostgREST writes bypass policy/audit;
- keep SQL portable;
- keep export/backup capability;
- treat Auth/Storage as replaceable platform services.

Source:
- https://supabase.com/pricing
- https://github.com/supabase/supabase

## pgvector — DEFER

Do not add vector retrieval because an AI system "should have vectors".

First use:
- PostgreSQL metadata filters;
- exact lookup;
- FTS.

Add pgvector only when a measured retrieval/eval workload benefits.

# 3. Background work and durable execution

## pg-boss — ADOPT if primary backend is Node/TypeScript

High-fit component.

Current facts:
- MIT;
- PostgreSQL-backed queue;
- retries/backoff;
- cron/RRULE;
- priorities;
- dead-letter queues;
- singleton/debounce/throttle;
- job dependencies;
- can create jobs inside an existing database transaction.

Important nuance:
pg-boss documents exactly-once job delivery, but retries can still cause a handler
to process more than once. DROWK must retain its own idempotency/receipt rules.

Best workloads:
- Gmail sync;
- AIsa research runs;
- enrichment;
- evidence normalization;
- refresh/freshness jobs;
- Work compilation;
- scheduled cadences;
- cleanup/reconciliation.

Source:
- https://github.com/timgit/pg-boss

## DBOS — ADAPT / BENCHMARK for long durable workflows

DBOS provides durable TypeScript/Python workflows that resume after interruption.

Potential future workloads:
- multi-step research with exact resume;
- approval-paused workflows;
- long-running procurement-route research;
- bounded action orchestration.

Do not run DBOS + pg-boss as overlapping generic job systems on day one.

Initial recommendation:
pg-boss for queue/scheduling; benchmark DBOS when DROWK has real durable multi-step
workflow requirements.

Source:
- https://docs.dbos.dev/

## Activepieces — DEFER / edge automation only

Current licensing:
- core MIT;
- enterprise directories commercially licensed.

Potential use:
operator-configurable edge integrations and notifications.

Hard boundary:
No canonical state, Commercial Exclusion, identity merge, policy authority or
durable side-effect truth inside Activepieces.

Source:
- https://www.activepieces.com/docs/about/license

## n8n — DEFER / PATTERN_ONLY

Useful workflow prior art. Do not duplicate the same business rule in DROWK,
Apps Script, Activepieces and n8n.

# 4. Gmail / Google

## Gmail API — ADOPT first-class connector

Official sync model matches DROWK's existing WP-03 lessons:
- full sync on first connection/recovery;
- partial sync through history.list;
- persist recent historyId;
- history range can expire;
- HTTP 404 on old startHistoryId requires full recovery sync;
- push notifications can trigger partial sync.

DROWK additions:
- source Observation before Core;
- exact message ID identity;
- thread conversation grouping;
- relevance gate;
- SENT evidence semantics;
- Draft != Sent;
- Spam != irrelevance;
- source watermark/freshness;
- idempotent promotion.

Source:
- https://developers.google.com/workspace/gmail/api/guides/sync

## Apps Script — TRANSITIONAL CONNECTOR ONLY

Keep existing PWM value during extraction.

Do not add new canonical business logic there. Apps Script quotas are per-user,
can change, and throw execution exceptions when exceeded.

Source:
- https://developers.google.com/apps-script/guides/services/quotas

# 5. AIsa intelligence fabric

## AIsa Builder — ADOPT strategically

Current official facts checked 2026-09-26:
- Builder: $39/month;
- includes $50/month API credits;
- all plans can use the full API catalog;
- one AIsa account/key replaces separate provider accounts for the catalog;
- MCP and direct API are both supported.

Current catalog examples:
- DataForSEO: 445 endpoints;
- Apollo: 54 endpoints;
- Similarweb: 23;
- Semrush: 19;
- Tavily: 4;
- Firecrawl: 6;
- Exa: 4;
- LinkedIn: 8;
- Agent Mail: 51;
- Jina embeddings/rerank: 2.

The MCP currently exposes:
- 5 meta-tools;
- 26 servers;
- 578 reachable tools;
- get_details exposes schema/read-only/availability/price;
- use/batch_use supports max_price_usd caps.

Sources:
- https://www.aisa.one/api
- https://www.aisa.one/mcp
- https://aisa.one/solutions/go-to-market

## Production integration rule

Use AIsa in two modes:

### MCP — exploration / agent research / capability discovery
Use for:
- Codex/agent-assisted research;
- schema discovery;
- ad-hoc investigations;
- capability lab.

### Direct API — production deterministic calls
Use for:
- repeatable provider operations;
- bounded cost;
- typed adapters;
- stable auditing;
- precise retries and idempotency.

AIsa remains the capability fabric, never CRM truth.

## Highest-leverage first capabilities

1. DataForSEO Business Data / location discovery.
2. Apollo company/person research.
3. LinkedIn as employment/relationship evidence, not truth.
4. Firecrawl for controlled site extraction.
5. Exa/Tavily for discovery.
6. grounded research (Perplexity/OpenAI/Anthropic) only when cheaper evidence
   cannot close the gap.
7. Jina reranking only after a measured retrieval need.
8. Agent Mail only as a sandbox/test surface before Gmail outbound authority.

# 6. Documents, reporting and analytics

## Gotenberg — DEFER, likely ADOPT later

MIT, containerized document/PDF API.

Good future fit for:
- Account Brief PDF;
- proposal packet;
- research packet;
- audit export.

Source:
- https://github.com/gotenberg/gotenberg

## DocuSeal — DEFER

AGPLv3 plus attribution additional terms.

Useful when signature workflow is truly required. Integrate as a separate service
rather than embedding its code into DROWK.

Sources:
- https://github.com/docusealco/docuseal
- https://github.com/docusealco/docuseal/blob/master/LICENSE_ADDITIONAL_TERMS

## Metabase — DEFER / internal BI

Open-source edition is AGPL. Commercial terms apply to Enterprise and some
embedding scenarios.

Good for internal analysis once the warehouse/data model stabilizes:
- conversion;
- response rates;
- research spend;
- account readiness;
- outcome attribution.

DROWK's operator cockpit should remain native product UI.

Source:
- https://www.metabase.com/license

# 7. Deployment, continuity and operations

## Cloudflare — ADOPT as edge/control surface

Use for:
- DNS/TLS;
- frontend/edge;
- Access for alpha/admin/staging;
- WAF/rate controls;
- previews.

Do not make Cloudflare configuration the canonical business state.

## Coolify — DEFER / strong self-host option

Current repo: Apache-2.0.
Current self-hosted product: free; Coolify Cloud control plane starts at $5/month
for two connected servers.

Use when DROWK chooses to operate its own application servers.

Do not introduce it before we actually need server orchestration.

Sources:
- https://github.com/coollabsio/coolify
- https://www.coolify.io/pricing

## restic — ADOPT when self-managed backup layer exists

BSD-2-Clause; encrypted/deduplicated backup tool.

Use for independent encrypted backups to an external location when self-hosting or
when exporting managed-database backups.

Source:
- https://github.com/restic/restic

## Uptime Kuma — DEFER

MIT and useful self-host monitoring.

Add when DROWK owns enough services that independent uptime monitoring is justified.

# 8. AI observability, security and policy — missing from the supplied list

These are strategically more important to DROWK than several generic CRM options.

## OpenTelemetry — ADOPT

Vendor-neutral traces/metrics/logs.

DROWK should propagate:
- tenant;
- correlation;
- run;
- provider;
- capability;
- policy;
- work/action IDs

through traces without placing sensitive raw payloads into telemetry by default.

Source:
- https://opentelemetry.io/

## Langfuse — ADAPT / likely ADOPT for AI trace + eval

Core is MIT; enterprise folders are commercially licensed.

Useful for:
- model/provider traces;
- prompt versions;
- eval results;
- latency/token/cost;
- model comparison.

Boundary:
DROWK Evidence/ProviderRun/Audit stay canonical. Langfuse is an observability/eval
projection, not the business ledger.

Source:
- https://github.com/langfuse/langfuse

## Promptfoo — ADOPT for CI security/evals when generative features start

MIT.
Useful for:
- prompt/model regression;
- red teaming;
- prompt-injection tests;
- tool-abuse tests;
- RAG/agent evaluation.

Security note:
Promptfoo itself documents that some custom config paths execute local code and are
not a sandbox. Treat third-party eval artifacts as untrusted.

Source:
- https://github.com/promptfoo/promptfoo

## OPA — DEFER until policy complexity triggers it

Apache-2.0, general-purpose context-aware policy engine.

Potential future fit:
- agent capability authorization;
- environment/tenant/action policies;
- high-impact action gates.

Do not externalize the DROWK policy engine before current deterministic rules become
hard to manage in application code.

Source:
- https://github.com/open-policy-agent/opa

## Better Auth — ADAPT / strong DCRM-02 candidate if TypeScript is selected

MIT, TypeScript, framework-agnostic, with 2FA and multi-tenant capabilities.

Potential advantage over making Supabase Auth the product identity root:
- more application-owned identity semantics;
- less backend-provider coupling;
- clean fit with Tenant/User/Session separation.

Must still be benchmarked against managed-auth operational simplicity.

Source:
- https://github.com/better-auth/better-auth

# 9. Recommended architecture candidates

## Architecture A — DROWK Native / TypeScript + PostgreSQL (recommended direction)

Web:
- React application; harvest Atomic/Twenty UX patterns and permissive components.

Domain API:
- TypeScript service with explicit business contracts.

Canonical state:
- PostgreSQL.

Async:
- pg-boss.

Auth:
- Better Auth or managed auth behind a DROWK identity adapter.

Artifact storage:
- S3-compatible object storage (Supabase Storage or Cloudflare R2 candidate).

AI / external data:
- AIsa Capability Adapter.
- direct API for production;
- MCP for agent/research development.

Gmail:
- dedicated evidence connector.

Observability:
- OpenTelemetry;
- Langfuse projection for AI traces/evals.

CI security:
- Promptfoo when generative features activate.

Deployment:
- Cloudflare edge/frontend;
- managed PostgreSQL;
- API/worker on a container/managed runtime;
- self-host/Coolify later if economics justify.

Why:
Maximum reuse of DROWK intellectual property with a small operational surface and
one primary application language.

## Architecture B — DROWK Core + Atomic-derived UI + Supabase managed platform

Same DROWK Domain API and canonical contracts, but use:
- Supabase managed Postgres;
- selected Atomic CRM UI structure/components;
- optional Supabase Auth/Storage.

Why:
Fastest path to a polished operator application.

Risk:
Must prevent Supabase convenience APIs from bypassing Domain API authority.

## Architecture C — Generic CRM shell + DROWK Intelligence sidecar

Examples:
EspoCRM or Frappe CRM as operator CRM, DROWK as intelligence service.

Why it is not preferred:
- two competing truth models;
- duplicate audit/workflow logic;
- mapping overhead;
- harder identity/evidence semantics;
- licensing/runtime coupling;
- DROWK's core differentiation becomes a sidecar.

Use only if future evidence shows UI/time-to-market savings dominate the ongoing
integration cost.

# 10. What should move forward now

## Immediate ADOPT / build track

1. DROWK canonical PostgreSQL model.
2. DROWK Domain API.
3. Tenant/User/Actor/Agent/Session/Run boundary.
4. SourceObservation + Evidence + IdentityEvidence + EntityMatchDecision.
5. Event + Idempotency + ProviderRun + ResearchRun.
6. Gmail connector with historyId/full-recovery semantics.
7. AIsa capability adapter + cost/provenance controls.
8. pg-boss if TypeScript backend is confirmed.
9. React operator shell with Atomic/Twenty pattern harvest.
10. OpenTelemetry correlation from first executable vertical slice.

## Parallel capability lab — start earlier than old roadmap implied

Do not wait for the whole CRM to be complete before validating AIsa.

Run DCRM-05-style read-only experiments in parallel with DCRM-01/02:
- facility discovery;
- buyer discovery;
- procurement route;
- company research;
- cost/freshness/evidence completeness.

Persist only synthetic/test benchmark output until canonical ingestion contracts
exist.

## First vertical slice

A valuable end-to-end slice should be:

Account
-> Facility
-> Evidence
-> Contact candidate
-> Gmail history
-> Signal
-> Work Item
-> Account Brief
-> human-approved next action

This demonstrates the differentiated system faster than implementing every generic
CRM feature.

# 11. What should NOT consume time now

- replacing DROWK with Espo/Frappe/Twenty;
- ERP;
- invoice/accounting;
- marketing automation suite;
- omnichannel support inbox;
- embedded BI;
- e-signatures;
- vector database;
- graph database;
- low-code workflow engines;
- multiple competing queues;
- autonomous mass outbound;
- self-hosting every commodity service.

# 12. Product capabilities that elevate DROWK beyond the supplied list

The supplied tools mostly solve commodity CRM functions. DROWK should aim higher.

## Prospecting Digital Twin

For every Account/Facility:
- canonical identity;
- locations;
- buyer committee;
- employment evidence;
- procurement routes;
- active/existing relationship status;
- signals;
- research gaps;
- pursuits;
- communication history;
- outcomes;
- next best work.

## Evidence Completeness Engine

Before a commercial action, compute:
- which evidence is present;
- which is stale;
- which is conflicting;
- which is missing;
- cheapest next capability likely to close the gap.

This turns AIsa from a bag of APIs into an intelligent research fabric.

## Buyer & Procurement Graph

Model:
- Account -> Facility;
- Contact -> role/employment;
- relationship evidence;
- vendor registration;
- procurement portal;
- incumbent/provider;
- introducer/warm path.

Start relational in PostgreSQL. Add graph infrastructure only if measured query
patterns justify it.

## Signal Fusion + Readiness

Readiness is explainable derived state, not a single model score.

Combine:
- facility/company changes;
- buyer changes;
- procurement evidence;
- first-party relationship history;
- Gmail activity;
- research freshness;
- exclusions.

## Outcome-settled learning

Preserve:
- decision context at time T;
- action;
- later reply/result;
- later commercial outcome.

Then measure which:
- signals;
- buyers;
- sources;
- research depths;
- cadence steps;
- drafts

actually produce outcomes.

That learning loop is a stronger moat than importing a generic CRM feature list.
