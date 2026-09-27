# DROWK CRM Knowledge Index

This index routes humans and agents to the current repository-owned context.

## Standing orders

1. [AGENTS.md](../AGENTS.md) — repository authority, safety and agent rules.
2. [Security Baseline](security/SECURITY_BASELINE.md) — product/repository security boundary.

## Product

- [Product North Star](product/PRODUCT_NORTH_STAR.md) — owner-approved Revenue & Relationship Operating System ambition and product test for future work.
- [UX Operating Model](product/UX_OPERATING_MODEL.md) — operator surfaces, navigation, contextual AIsa and progressive-disclosure principles.

## Architecture

- [System Architecture](architecture/SYSTEM_ARCHITECTURE.md) — canonical product layers and runtime direction.
- [Canonical Data Model](architecture/CANONICAL_DATA_MODEL.md) — draft domain/evidence/control objects.
- [Capability Model](architecture/CAPABILITY_MODEL.md) — provider-neutral capabilities and AIsa boundary.
- [Provider Evaluation Protocol](architecture/PROVIDER_EVALUATION_PROTOCOL.md) — workload-specific provider evaluation.
- [Engineering Harness Model](architecture/ENGINEERING_HARNESS_MODEL.md) — Guides, Sensors, gates and proof-carrying work.
- [Memory / Agent / Trace Model](architecture/MEMORY_AGENT_TRACE_MODEL.md) — memory classes, trace and durable work.
- [Auth & Tenancy Boundary](architecture/AUTH_TENANCY_BOUNDARY.md) — user/tenant/session/agent identity separation.
- [DROWK Domain Topology](architecture/DROWK_DOMAIN_TOPOLOGY.md) — drowk.com vs drowk.net vs product/vertical domains.
- [Repository Structure](architecture/REPOSITORY_STRUCTURE.md) — executable monorepo boundaries and dependency direction.

## Engineering execution

- [Codex Start Here](engineering/CODEX_START_HERE.md) — concise local entrypoint for Codex sessions.
- [Codex Orchestration](engineering/CODEX_ORCHESTRATION.md) — scoped AGENTS, subagent workcells and one-writer discipline.
- [Current Execution Sequence](engineering/CURRENT_EXECUTION_SEQUENCE.md) — active PWM -> DROWK bridge and next implementation gate.
- [DCRM-00B Closure](engineering/DCRM-00B_CLOSURE.md) — verified closure of the local PWM WP-03 extraction bridge.

## Work packages

- [DCRM-01A Core Vertical Slice](work-packages/DCRM-01A-core-vertical-slice.md) — completed executable contracts/domain/database foundation.
- [DCRM-01B PostgreSQL Persistence](work-packages/DCRM-01B-postgres-persistence.md) — completed tenant-scoped Account/Facility/Observation/Evidence persistence.
- [DCRM-01C Migration Runner + Runtime Shell](work-packages/DCRM-01C-migration-runtime-shell.md) — completed runtime bootstrap gate after persistence.
- [DCRM-02A Identity + Membership Context](work-packages/DCRM-02A-identity-membership-context.md) — completed provider-neutral user/tenant authorization boundary before business HTTP.
- [DCRM-02B Cloudflare Access Alpha Verifier](work-packages/DCRM-02B-cloudflare-access-alpha-verifier.md) — next external-authentication adapter gate; no deploy.
- [DCRM-03A Gmail Observation Boundary](work-packages/DCRM-03A-gmail-observation-boundary.md) — partial synthetic extraction; live Gmail remains gated.
- [DCRM-04A Work Engine Contract Parity](work-packages/DCRM-04A-work-engine-contract-parity.md) — contract extracted; deterministic compiler/golden parity remains pending.

## Migration

- [PWM_CRM Extraction Plan](migration/PWM_CRM_EXTRACTION_PLAN.md) — preservation-first extraction from D: source system.

## Roadmap

- [DROWK CRM Roadmap](roadmap/ROADMAP.md) — DCRM-00 through higher autonomy.

## ADRs

- [ADR-0001](adr/0001-standalone-product-repository.md) — standalone CRM repository.
- [ADR-0002](adr/0002-evidence-before-truth.md) — Evidence before CRM Truth.
- [ADR-0003](adr/0003-proof-carrying-engineering.md) — model output requires verification evidence.
- [ADR-0004](adr/0004-provider-neutral-intelligence.md) — provider-neutral external intelligence.
- [ADR-0005](adr/0005-point-in-time-knowledge-and-action-reconciliation.md) — point-in-time knowledge and uncertain external actions.
- [ADR-0006](adr/0006-cloudflare-access-alpha-auth-boundary.md) — Cloudflare Access authenticates alpha users; DROWK remains tenant authority.

## Current research

- [Auth / Session Provider Revalidation — 2026-09-27](research/AUTH_SESSION_REVALIDATION_2026-09-27.md) — current official-source comparison and DCRM-02B alpha decision input.

## Cross-repository harvest

These files make DROWK CRM self-contained after broad GitHub access is narrowed:

- [Harvest overview](reference-harvest/README.md)
- [Pinned source manifest](reference-harvest/source-manifest-2026-09-27.json)
- [DROWK Platform transfer](reference-harvest/drowk-platform-transfer.md)
- [Invoice Builder transfer](reference-harvest/invoice-builder-transfer.md)
- [Open-source pattern transfer](reference-harvest/open-source-patterns-transfer.md)
- [OSCI Stage 0 transfer](reference-harvest/osci-stage0-transfer.md) — preserved unmerged benchmark findings
- [PWM WP-03 Local Audit](reference-harvest/pwm-wp03-local-audit-2026-09-26.md) — reconciled legacy draft against the later checkpoint
- [PWM WP-02 Work Engine Transfer](reference-harvest/pwm-wp02-work-engine-transfer.md) — preserved state, authority, precedence and idempotency semantics
- [Access revocation handoff](reference-harvest/ACCESS_REVOCATION_HANDOFF.md)

## Infrastructure

- [Infrastructure direction](../infra/README.md)
- [Cloudflare checkpoint](../infra/CLOUDFLARE_CHECKPOINT.md)

## Status rule

Repository documents own DROWK CRM engineering consequences.

External/current provider behavior, pricing, API availability, security advisories and product documentation are time-sensitive and must be revalidated when used.

PWM_CRM live implementation/runtime evidence remains on the owner-controlled D: workspace and is not silently replaced by this documentation.
