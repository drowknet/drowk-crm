# Repository Structure

Status: FOUNDATION EXECUTION SKELETON

This structure turns the current architecture into implementation boundaries
without selecting unnecessary frameworks prematurely.

```text
drowk-crm/
├─ apps/
│  └─ web/                 authenticated operator experience
├─ services/
│  ├─ api/                 canonical application/domain API
│  └─ worker/              background and durable execution
├─ packages/
│  ├─ domain/              business rules and use cases
│  ├─ contracts/           provider-neutral boundary contracts
│  ├─ db/                  PostgreSQL persistence and migrations
│  ├─ policy/              deterministic authority and commercial policy
│  └─ observability/       OpenTelemetry and trace adapters
├─ connectors/
│  └─ gmail/               Gmail source/evidence connector
├─ capabilities/
│  └─ aisa/                AIsa capability/provider adapter
├─ tooling/
│  └─ harness/             deterministic engineering sensors
├─ evals/                  AI/provider/golden-set evaluations
├─ infra/                  deployment and infrastructure decisions
└─ docs/                   architecture, ADRs, research, migration and roadmap
```

## Dependency direction

Preferred direction:

```text
apps / services
      ↓
domain + policy
      ↓
contracts
      ↑
db / connectors / capabilities / observability adapters
```

The exact import graph will be enforced once executable packages exist, but the
architectural rule is already fixed: provider and infrastructure details must not
become canonical domain semantics.

## Near-term executable path

The first vertical slice should prove:

```text
Tenant
→ Account
→ Facility
→ SourceObservation
→ Evidence
→ Identity candidate/decision
→ ResearchRun
→ PolicyDecision
→ WorkItem
→ Outcome
```

Gmail and AIsa attach through their connector/capability boundaries.

## Deliberately not created yet

Do not add without a measured requirement:
- graph database;
- vector database;
- multiple queue/workflow engines;
- generic agent framework;
- ERP/marketing suite;
- low-code orchestration;
- microservice decomposition;
- external policy server.

## Ownership

The DROWK domain model, policy semantics, evidence lineage and Work/Outcome logic
remain first-party product IP regardless of infrastructure/provider choices.
