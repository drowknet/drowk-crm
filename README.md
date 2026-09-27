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

Foundation / architecture extraction phase.

No production integrations or customer data are stored in this public repository.

## Safety

- Never commit secrets, tokens, credentials, mailbox exports, CRM exports, customer/prospect datasets, or raw tenant evidence.
- High-impact actions require explicit policy authority and, by default, human approval.
- AI models may research, extract, classify, summarize, draft, and recommend; they do not own business truth or execution authority.
- Source provenance, freshness, idempotency, and auditability are first-class requirements.

See the foundation PR for architecture, migration, security, and roadmap documents.
