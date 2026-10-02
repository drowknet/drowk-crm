# DROWK CRM

**Evidence-first revenue intelligence and prospecting infrastructure for human-governed AI workflows.**

> **Project status:** Early alpha. The engineering foundation is active and tested, but the project is not yet a production-ready hosted CRM.

DROWK CRM is an open-source Revenue Intelligence & Prospecting Operating System built around a simple rule: **model output is not business truth, and model output is not execution authority**.

The platform separates observations, evidence, identity, signals, judgment, policy, accepted CRM state, work, action, outcomes, and learning so AI-assisted workflows remain reviewable, attributable, and controllable.

## Why DROWK CRM

Many AI-assisted CRM workflows collapse research, inference, system-of-record state, and outbound execution into one pipeline. DROWK CRM intentionally keeps those layers separate.

Core properties:

- **Evidence before truth** — provider or model output is preserved as evidence before promotion into accepted CRM state.
- **Human-governed action** — high-impact actions require deterministic policy authority and, by default, human approval.
- **Provider independence** — external providers are adapters, not the system of record.
- **Provenance and freshness** — source lineage and point-in-time knowledge are explicit.
- **Fail-closed ambiguity** — uncertain identity or external effects do not become guessed success.
- **Auditable execution** — material decisions and writes preserve actor, policy, run, and outcome lineage.
- **Tenant isolation** — tenant-owned state and authorization boundaries are first-class.

## Core flow

```text
Sources
  -> Observations
  -> Evidence
  -> Identity
  -> Signals
  -> Judgment
  -> Policy
  -> Accepted CRM State
  -> Work
  -> Human / Bounded Action
  -> Outcomes
  -> Learning
```

## What is implemented

The current repository includes:

- canonical TypeScript contracts and domain models;
- PostgreSQL persistence and forward-only migrations;
- tenant and membership authorization foundations;
- provider-neutral capability and research-run contracts;
- a Gmail observation boundary with synthetic fixtures;
- durable interaction, commitment, and relationship foundations;
- deterministic work-engine behavior with regression tests;
- provider capability evaluation and bounded live-validation contracts;
- non-root API/worker runtime packaging;
- local and staging-boundary verification harnesses;
- protected-main governance verification;
- secret-safety checks across tree and history;
- reproducible CI and PostgreSQL integration tests.

See the [knowledge index](docs/index.md) and [roadmap](docs/roadmap/ROADMAP.md) for the engineering detail.

## Architecture

DROWK CRM is a monorepo with explicit dependency and authority boundaries.

```text
apps/          operator-facing applications
services/      API and worker runtimes
packages/      contracts, domain, DB, policy, observability
connectors/    source/provider adapters
capabilities/  bounded external capability adapters
evals/         synthetic evaluation fixtures
tooling/       harness, governance, runtime and staging verification
infra/         deployment/staging contracts
docs/          architecture, ADRs, roadmap and engineering canon
```

Important architecture references:

- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Canonical Data Model](docs/architecture/CANONICAL_DATA_MODEL.md)
- [Capability Model](docs/architecture/CAPABILITY_MODEL.md)
- [Auth & Tenancy Boundary](docs/architecture/AUTH_TENANCY_BOUNDARY.md)
- [Security Baseline](docs/security/SECURITY_BASELINE.md)
- [ADRs](docs/adr/)

## Quick start

### Requirements

- Node.js 22
- pnpm 10.17.1
- PostgreSQL 16 for integration tests
- Docker/Compose for documented runtime and staging verification paths

Install:

```bash
pnpm install --frozen-lockfile
```

Run the fast repository harness:

```bash
pnpm harness:fast
```

Run the repository-authoritative CI harness:

```bash
pnpm harness:ci
```

Run runtime and staging-boundary verification:

```bash
pnpm runtime:verify
pnpm staging:verify
```

The repository intentionally fails closed when required runtime or security conditions are missing.

## Development model

`main` is protected. Material changes should move through pull requests and required checks.

The project uses:

- pinned GitHub Actions;
- frozen dependency installation in CI;
- synthetic fixtures rather than tenant data;
- explicit security and provider boundaries;
- regression/golden tests for durable behavior;
- ADRs for material architecture decisions.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing implementation changes.

## Security

Never commit credentials, OAuth/session material, mailbox exports, CRM exports, production dumps, customer/prospect datasets, or tenant PII.

Security reports should follow [SECURITY.md](SECURITY.md). The project threat model is documented in [docs/security/SECURITY_BASELINE.md](docs/security/SECURITY_BASELINE.md).

## Roadmap

The roadmap is developed incrementally, with each capability required to carry evidence through tests, sensors, or explicit owner gates before promotion.

See [docs/roadmap/ROADMAP.md](docs/roadmap/ROADMAP.md).

## Contributing

Contributions are welcome. Start with:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [GOVERNANCE.md](GOVERNANCE.md)
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SUPPORT.md](SUPPORT.md)

## License

Licensed under the [Apache License 2.0](LICENSE).
