# DROWK CRM

**Revenue Intelligence & Prospecting Operating System**

DROWK CRM is a standalone CRM and prospecting platform designed around evidence, identity, signals, deterministic policy, human control, and auditable AI assistance.

## Core idea

```text
Sources
  -> Observations
  -> Evidence
  -> Identity
  -> Signals
  -> Judgment
  -> Policy
  -> CRM Truth
  -> Work
  -> Human / Bounded Action
  -> Outcomes
  -> Learning
```

The product is intentionally provider-independent. Gmail, AIsa, LinkedIn, Apollo, web research, model providers, and future services are adapters and evidence sources — not systems of record.

## Status

**Execution Foundation - EF-01A, EF-01B and EF-02 closed/green; EF-03 staging boundary active, live provisioning still separately gated.**

The core foundation through DCRM-05C is released to `main`. One exact
AIsa/DataForSEO `FACILITY_LOCATION_DISCOVERY` cell is `LIVE_VALIDATED_CAPABILITY`;
that validation does not generalize to other provider/capability cells.

EF-01A is released on `main`: executable engineering harness, reproducible CI and secret
safety are green after merge/post-merge CI. EF-01B is also released: `main` is protected,
exact required checks are enforced, the live verifier passes, and PR #20 merged through the
protected path with post-merge CI green. EF-02 is released on `main`: reproducible non-root API/worker
packaging, runtime lifecycle/config sensors and disposable local Compose are green after protected-main
merge/post-merge CI. EF-03 is now owner-authorized for repo-owned staging-boundary implementation only.
Live Cloudflare/Neon/compute provisioning, image push and deployment remain a separate explicit owner gate. See the
[governance verifier](tooling/governance/README.md) and
[owner runbook](docs/engineering/REPOSITORY_GOVERNANCE.md).

Start with:
- [Knowledge Index](docs/index.md)
- [Architecture Baseline v1](docs/architecture/DROWK_ARCHITECTURE_BASELINE_V1_2026-09-28.md)
- [Execution Foundation Plan](docs/engineering/EXECUTION_FOUNDATION_PLAN.md)
- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Canonical Data Model](docs/architecture/CANONICAL_DATA_MODEL.md)
- [Roadmap](docs/roadmap/ROADMAP.md)
- [PWM_CRM Extraction Plan](docs/migration/PWM_CRM_EXTRACTION_PLAN.md)
- [Cross-Repository Reference Harvest](docs/reference-harvest/README.md)

## Canonical engineering home

`drowknet/drowk-crm` is the only authorized implementation repository for DROWK CRM.

Other DROWK repositories may inform design but are not implementation targets or runtime dependencies.

## Infrastructure direction

- `drowk.com` — DROWK brand/corporate identity.
- `drowk.net` — DROWK systems namespace.
- `crm.drowk.net` — approved production namespace direction for DROWK CRM.
- GitHub — engineering/version canon.
- PostgreSQL — canonical durable business datastore.
- Cloudflare — intended edge/deployment/access layer; no CRM application has been deployed yet.
- Apps Script/Gmail — migration/source connector, not long-term system of record.

## Safety

- Never commit secrets, tokens, credentials, mailbox exports, CRM exports, customer/prospect datasets, or raw tenant evidence.
- High-impact actions require explicit policy authority and, by default, human approval.
- AI models may research, extract, classify, summarize, draft, and recommend; they do not own business truth or execution authority.
- Source provenance, freshness, idempotency, and auditability are first-class requirements.
- Model output is not verified output.
