# DROWK Architecture Baseline v1 — 2026-09-28

Status: OWNER-APPROVED ARCHITECTURE BASELINE / RECONCILED AFTER DCRM-05C CLOSURE / IMPLEMENTATION GATES REMAIN EXPLICIT

This document freezes the current architecture baseline so future implementation does not
re-litigate settled boundaries merely because a new framework, model, cloud service or agent
runtime becomes available.

It does **not** authorize live provider calls, Gmail OAuth/live sync, outbound messaging,
production deployment, credential injection, provider WRITE capability, merge, or higher
autonomy. Those remain separate owner gates.

## 1. Architecture principle

DROWK is the authority plane.

External runtimes may reason, retrieve, classify, orchestrate or execute bounded capabilities,
but they do not own canonical CRM truth, tenant authority, business policy or action authority.

```text
Source
-> Observation
-> Evidence
-> Identity
-> Signal
-> Judgment
-> Policy
-> Accepted CRM Projection
-> Work
-> Human / Bounded Action
-> Outcome
-> Learning
```

Non-negotiable consequences:

- provider/model output != CRM truth;
- AI suggestion != authority;
- signal != opportunity;
- unknown != empty;
- draft != sent; sent != delivered;
- person != contact != identity;
- commitment != activity != task != work;
- event delivery != action verification;
- ambiguous external effect must reconcile rather than be blindly retried.

## 2. Component ownership

### DROWK Core

Owns:

- tenant and actor authority;
- source/observation/evidence lineage;
- identity and relationship continuity;
- accepted CRM projection;
- judgment contracts and policy thresholds;
- budget and capability authority;
- ResearchRun / ProviderRun business lineage;
- Work;
- Approval;
- ActionAttempt and reconciliation semantics;
- outcomes and learning lineage;
- canonical audit semantics.

DROWK does not delegate these decisions to a model, provider gateway, agent runtime or
cloud workflow service.

### PostgreSQL

PostgreSQL remains the canonical durable business datastore.

The executable DROWK core already depends on relational constraints, transactions,
tenant-aware foreign keys, advisory locks, triggers, immutable/append-oriented history and
forward-only migrations. No alternative database becomes canonical without a measured
requirement and explicit architecture gate.

Vector/semantic retrieval, when introduced, is an index/retrieval layer and never a second
system of record.

### Cloudflare

Cloudflare is the preferred edge/control-plane family, not CRM truth.

Baseline responsibilities:

- authoritative DNS / TLS edge;
- WAF / DDoS / rate-limiting where appropriate;
- Cloudflare Access as edge authentication, while DROWK remains tenant authority;
- Cloudflare Tunnel so replaceable compute need not expose an HTTP/TLS origin directly;
- R2 as object/artifact byte storage while PostgreSQL stores refs, fingerprints, rights,
  retention and lineage;
- Workers + Static Assets as the preferred new web-delivery direction.

Cloudflare Workflows is an approved **challenger** for durable long-lived orchestration,
approval/resume and external multi-step execution. It is not yet selected as canonical
business durability. A bounded comparison against a PostgreSQL-first worker/queue model is
required before locking the runtime.

Cloudflare Queues, Hyperdrive, Workers VPC and Containers remain optional challengers.
They are introduced only after a measured requirement or successful bounded spike.

### Replaceable compute

Initial application compute remains replaceable.

Preferred first operational shape:

```text
Cloudflare edge
    -> Access / WAF / Tunnel
        -> replaceable container host
            -> drowk-api
            -> drowk-worker
            -> cloudflared
                -> managed PostgreSQL
```

The compute host must not be the only durable location of canonical state or evidence bytes.

Container packaging is a deployment boundary, not a reason to create microservices.

### R2

R2 is the preferred object/artifact store for large or raw bytes such as:

- provider/research artifacts;
- imports/exports;
- PDFs and attachments;
- evidence artifacts;
- generated briefs;
- audit/export bundles when appropriate.

PostgreSQL retains the authoritative metadata and lineage.

### Hermes Agent

Hermes is an approved candidate for the **DROWK Agent Runtime Fabric**.

Correct role:

```text
Hermes
= reasoning / planning / research / tools / multi-agent / operator interface

Hermes
!= CRM truth
!= tenant authority
!= DROWK policy authority
!= database authority
```

Preferred boundary:

```text
Hermes
    -> authenticated DROWK MCP / Capability API
        -> DROWK Policy / Budget / Approval
            -> PostgreSQL / providers
```

Hermes must not receive PostgreSQL superuser credentials or unrestricted production provider
credentials merely for convenience.

Hermes profiles/bots, Kanban, cron, skills, memory and subagents may be used for agent work,
research, review and operator workflows, but their internal state does not replace DROWK
Work, Relationship memory, Approval, ResearchRun or audit lineage.

Hermes memory/skill auto-write must be approval-controlled for DROWK-managed profiles.
Any production integration requires pinned versions, bounded tools, explicit network/filesystem
scope, a kill path and a DROWK service identity.

### AIsa

AIsa remains a capability/provider fabric, not a system of record.

Two interaction classes are allowed conceptually:

1. **fixed typed adapter** — exact capability/operation/input/cost/rights envelope, suitable for
   highly controlled live validation and production capability cells;
2. **capability discovery** — search/details/discovery may identify a candidate capability, but
   dynamic discovery never grants dynamic authority.

Canonical rule:

> Capability may be discovered dynamically. Authority may not.

The DROWK Capability Lab owns provider/capability facts, budgets, result semantics, rights,
lineage and promotion to validated capability state.

### Gemini API

Gemini is an approved direct intelligence provider when Google-native capabilities are
materially useful, including multimodal reasoning, structured extraction, grounded/public
research, long-context work or other provider-native features that justify a direct adapter.

Gemini is not a universal model dependency. Provider/model selection remains
capability/workload-specific and replaceable.

Temporary provider file/state surfaces never become DROWK artifact storage or canonical
memory.

### JEV / TypeSafe

JEV is the preferred class of engine for narrow typed semantic judgments where a bounded
question, explicit answer space and confidence distribution are more appropriate than
generative free text.

Correct role:

```text
content/evidence
    -> JEV typed judgment
        -> DROWK deterministic policy
```

JEV confidence does not itself grant action authority. Thresholds and consequences belong to
DROWK policy and must be versioned/replayable where material.

### Other model providers

OpenAI, Anthropic, Google, open models and future providers are replaceable intelligence
providers. No provider becomes infrastructure canon merely because it currently performs best.

## 3. Recommended intelligence flow

A bounded agent/research flow may use several external intelligence surfaces while retaining
one authority model:

```text
operator request
    -> deterministic admission
    -> optional JEV typed routing/judgment
    -> Hermes reasoning/research profile
    -> DROWK Capability API
        -> Gemini direct capability when justified
        -> AIsa/provider capability when justified
    -> candidate result / evidence
    -> optional JEV narrow verification
    -> DROWK Policy
    -> accepted disposition / evidence / work / approval
```

Intelligence may be provided by many runtimes. Business authority belongs to DROWK.

## 4. Durable execution boundary

Cloud/task delivery semantics must never be confused with business exactly-once semantics.

External effects should preserve a durable state model compatible with:

```text
PREPARED
-> DISPATCHING
-> ACCEPTED | FAILED | UNKNOWN
-> RECONCILED
```

A timeout, process crash or ambiguous provider response must not automatically authorize a
second external effect.

Cloudflare Workflows, a PostgreSQL-backed queue such as pg-boss, or another worker runtime
may provide scheduling/delivery durability. DROWK still owns business idempotency, authority,
ActionAttempt state and reconciliation.

## 5. Secrets and credentials

Never store real credentials in Git, normalized provider requests, fingerprints, fixtures,
logs or agent memory.

Execution Foundation must add executable controls, not only prose:

- secret scanning in local harness/CI;
- runtime injection outside code images;
- environment/service scoping;
- redaction tests;
- rotation/revocation procedure;
- separate credentials for experimental/research/production workloads where useful;
- minimum credentials for Hermes and other agent runtimes.

A provider or cloud secret store is scoped to the runtime it serves; no current product is
automatically the universal DROWK secret authority.

## 6. Engineering and promotion authority

GitHub is engineering/version canon. Exact-head GitHub Actions evidence remains authoritative
for repository verification.

Required direction:

- frozen/reproducible dependency install;
- lint/static analysis included in the executable verification surface;
- executable preflight/fast/full/integration/ci harness modes;
- direct-SQL adversarial sensors for DB-enforced invariants;
- secret scan;
- immutable build artifact identified by Git SHA;
- staging before production;
- explicit promotion/rollback gates.

Repository branch/ruleset enforcement should match the written owner/CI process where GitHub
permissions permit it. Until protection is technically enforced, the gap must remain visible
rather than assumed closed.

## 7. Execution Foundation — next architecture phase

DCRM-05C is closed and released to `main` with post-merge CI green. Its exact
`AIsa REST -> DataForSEO Business Listings Search Live -> FACILITY_LOCATION_DISCOVERY`
cell is `LIVE_VALIDATED_CAPABILITY`; that validation does not generalize to other AIsa
capabilities or providers.

The next architecture phase should prioritize Execution Foundation before broad product
expansion. Execution Foundation is the next approved architecture direction, but each
implementation package still requires its own explicit owner gate.

Execution Foundation should prove, in bounded slices:

1. executable engineering harness and secret scanning;
2. reproducible container packaging for API/worker;
3. runtime config validation and graceful shutdown;
4. staging through Cloudflare Access/Tunnel to replaceable compute and managed PostgreSQL;
5. durable worker/orchestration spike, including Cloudflare Workflows vs PostgreSQL-first
   delivery where appropriate;
6. ActionAttempt UNKNOWN/reconciliation and approval/resume behavior;
7. structured observability with tenant/run/correlation identifiers and data minimization;
8. backup/PITR policy, restore drill and operational runbooks;
9. minimum operator control surface for runs, jobs, approvals, reconciliation, costs and
   system health;
10. a read-only Hermes x DROWK integration spike using bounded DROWK MCP/API capabilities,
    with no direct DB authority.

The first implementation should be a narrow vertical slice, not a big-bang introduction of
every external component.

## 8. First proof target

The first integrated proof should prefer one identity, one ResearchRun, one agent, one
capability, one provider path, one typed judgment, one durable result and one trace.

Failure injection should prove that process death, duplicate delivery, provider timeout and
delayed approval do not create silent duplicate business effects or untraceable authority.

## 9. Explicitly deferred

Do not introduce without measured need:

- Kubernetes / EKS;
- Kafka;
- Redis cluster;
- self-hosted MinIO;
- self-hosted canonical PostgreSQL;
- D1/DynamoDB/Mongo as canonical CRM state;
- microservices by aesthetics;
- service mesh;
- a large Terraform estate before the runtime is proven;
- broad autonomous outbound;
- unrestricted Hermes production credentials;
- a provider tournament unrelated to an active DROWK workload.

## 10. Change rule

This baseline may be changed when new evidence invalidates an assumption or a bounded spike
demonstrates a materially better design.

New technology alone is not evidence.

The expected process is:

```text
measured requirement
-> challenger
-> bounded spike
-> deterministic evidence
-> ADR / owner gate
-> promotion
```
