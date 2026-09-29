# Execution Foundation Plan

Status: ACTIVE SEQUENCE — EF-01A OWNER AUTHORIZED — LATER PACKAGES REQUIRE SEPARATE GATES

Base architecture:
`docs/architecture/DROWK_ARCHITECTURE_BASELINE_V1_2026-09-28.md`

Execution Foundation is a cross-cutting hardening stream between the closed DCRM-05 capability
lab work and broad DCRM-06 product expansion. It does not renumber the product roadmap.

## Governing constraints

- GitHub remains engineering/version canon.
- PostgreSQL remains canonical durable business state.
- Provider/model output remains non-canonical until accepted through DROWK authority.
- No package below inherits deployment, credential, provider WRITE, Gmail live, outbound or
  higher-autonomy authority from another package.
- Ambiguous external effects reconcile; they are never blindly retried.
- Each package must produce deterministic evidence and a rollback path.

## Ordered packages

### EF-01A — Executable Engineering Harness, Reproducible CI & Secret Safety

Status: ACTIVE / OWNER AUTHORIZED / NO DEPLOY.

Closes the current executable gaps in harness modes, lint, frozen lockfile CI, immutable
GitHub Action pins and redacted secret scanning.

Work package:
`docs/work-packages/EF-01A-executable-engineering-harness-ci-secret-safety.md`

### EF-01B — Repository Governance & Branch Protection

Status: PLANNED / NOT YET AUTHORIZED.

Required outcomes:
- protect `main`;
- require exact CI checks before merge;
- prevent accidental direct pushes where repository permissions allow;
- document emergency/admin bypass authority;
- align GitHub rules with the owner-gated merge process.

Current observed gap: the GitHub branch metadata reports `main` as unprotected. The connected
GitHub surface does not provide repository-administration writes, so this cannot be silently
claimed as closed.

Hard gate: no production deployment while this governance gap remains open unless the owner
explicitly accepts the risk.

### EF-02 — Reproducible Runtime Packaging

Status: PLANNED / NOT YET AUTHORIZED.

Required outcomes:
- non-root API and worker container images;
- build context minimization;
- runtime config validation;
- graceful shutdown;
- local Compose for API/worker/PostgreSQL where appropriate;
- immutable image identity tied to Git SHA;
- no credentials baked into images.

### EF-03 — Staging Boundary

Status: PLANNED / NOT YET AUTHORIZED / DEPLOYMENT GATE.

Required outcomes:
- Cloudflare Access/Tunnel boundary;
- replaceable compute;
- managed PostgreSQL;
- runtime secret injection;
- staging-only health/readiness;
- explicit rollback/kill path.

### EF-04 — Durable Execution

Status: PLANNED / NOT YET AUTHORIZED.

Bounded spike comparing PostgreSQL-first delivery/queueing with Cloudflare Workflows where
appropriate. DROWK keeps business idempotency and action authority.

Required business state model:

```text
PREPARED
-> DISPATCHING
-> ACCEPTED | FAILED | UNKNOWN
-> RECONCILED
```

### EF-05 — Observability & Recovery

Status: PLANNED / NOT YET AUTHORIZED.

Required outcomes:
- structured correlation/tenant/run identifiers with data minimization;
- actionable health and failure telemetry;
- backup/PITR policy;
- restore drill;
- operational runbooks;
- minimum operator visibility into runs, costs, approvals and reconciliation.

### EF-06 — Bounded Agent Runtime Integration

Status: PLANNED / NOT YET AUTHORIZED.

Read-only Hermes x DROWK MCP/API spike behind DROWK service identity, policy and capability
boundaries. No direct PostgreSQL authority and no unrestricted provider credentials.

## Promotion rule

A later package becomes active only after:
1. the prior package's relevant deterministic evidence is reviewed;
2. unresolved findings are explicitly dispositioned;
3. the owner authorizes the next package's exact scope.

Nothing in this plan is a deployment authorization.
