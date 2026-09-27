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

**DCRM-00 — Foundation / architecture extraction.**

The repository is intentionally architecture-first. Runtime/framework choices remain open until preservation and extraction contracts are complete.

Start with:
- [Knowledge Index](docs/index.md)
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
- PostgreSQL — intended canonical business datastore, pending DCRM-00 stack confirmation.
- Cloudflare — intended edge/deployment/access layer; no CRM application has been deployed yet.
- Apps Script/Gmail — migration/source connector, not long-term system of record.

## Safety

- Never commit secrets, tokens, credentials, mailbox exports, CRM exports, customer/prospect datasets, or raw tenant evidence.
- High-impact actions require explicit policy authority and, by default, human approval.
- AI models may research, extract, classify, summarize, draft, and recommend; they do not own business truth or execution authority.
- Source provenance, freshness, idempotency, and auditability are first-class requirements.
- Model output is not verified output.
