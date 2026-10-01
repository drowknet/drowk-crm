# Execution Foundation Plan

Status: ACTIVE SEQUENCE — EF-01A CLOSED/GREEN — EF-01B CLOSED/GREEN — EF-02 CLOSED/GREEN — EF-03 OPEN / IMPLEMENTATION + PRE-LIVE HARDENING MERGED/GREEN / LIVE STAGING GATE PENDING

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

Status: CLOSED / MERGED / POST-MERGE CI GREEN / NO DEPLOY.

Closed executable gaps in harness modes, lint, frozen-lockfile CI, immutable GitHub Action
commit pins and redacted secret scanning. PR #18 merged to `main` as
`1d7e4453e101c8ac79d9084c1a25547b4b917b7f`; post-merge CI `36581115791` is green.

Work package:
`docs/work-packages/EF-01A-executable-engineering-harness-ci-secret-safety.md`

### EF-01B — Repository Governance & Branch Protection

Status: CLOSED / MERGED TO PROTECTED MAIN / POST-MERGE CI GREEN / NO DEPLOY.

The exact policy, read-only verifier and offline tests are implemented in
`tooling/governance/`. Owner-side admin apply and local verifier passed; independent GitHub
metadata confirms protected `main` and exact required checks. PR #20 merged as
`c70ba3e0a68794a4dadae7568107ba29eb4cfce1`; post-merge CI `36589368723` is green. See
[the runbook](REPOSITORY_GOVERNANCE.md).

Required outcomes:
- protect `main`;
- require exact CI checks before merge;
- prevent accidental direct pushes where repository permissions allow;
- document emergency/admin bypass authority;
- align GitHub rules with the owner-gated merge process.

Closure evidence:
- `main.protected=true`;
- strict `verify` and `postgres-foundation` checks are enforced and bound to GitHub Actions app id `15368`;
- `allow_update_branch=true`;
- `delete_branch_on_merge=true`;
- PR #20 merged through protected `main` as `c70ba3e0a68794a4dadae7568107ba29eb4cfce1`;
- post-merge CI `36589368723` is green;
- docs-only closure PR #21 merged as `154b34b61c7f6082f7fa5aa4ba1c5347cfa49efd`;
- closure post-merge CI `36590845123` is green.

The repository-governance blocker is closed. EF-02 is also closed/green; no production deployment
is authorized by EF-01B or EF-02 closure.

### EF-02 — Reproducible Runtime Packaging

Status: CLOSED / MERGED TO PROTECTED MAIN / POST-MERGE CI GREEN / NO DEPLOY.

Work package:
`docs/work-packages/EF-02-reproducible-runtime-packaging.md`

Runbook:
`docs/engineering/RUNTIME_PACKAGING.md`

Required outcomes:
- non-root API and worker container images;
- build context minimization;
- runtime config validation;
- graceful shutdown;
- local Compose for API/worker/PostgreSQL where appropriate;
- immutable image identity tied to Git SHA;
- no credentials baked into images.

Closure evidence:
- PR #23 final head `13ffae8901c6d00f727c775aae7ed68981a1f7e1`;
- merge commit `65a03df0aaf42447642e130cccf881cff247799d`;
- post-merge CI `36670214400` green;
- required `verify` includes Docker-backed runtime packaging verification;
- non-root `1000:1000` API/worker images with exact revision labels;
- pinned Node/PostgreSQL image digests;
- health/readiness, signal, migration and cleanup sensors green;
- zero dependency/lockfile delta;
- no image push or deploy.

### EF-03 — Staging Boundary

Status: OPEN — LIVE STAGING GATE PENDING. Repo implementation (PR #25) and pre-live hardening (PR #26) are merged/green.

Pre-live hardening PR #26 is merged and post-merge green. The current protected-main
candidate is `a6f41127de39256b4461a8e75a0bf2119e75afa3`; post-merge CI
`36802547723` passed `verify` and `postgres-foundation`.
A later docs-only protected-main merge becomes the candidate only after its green post-merge CI.
Revalidate the exact selected SHA and CI before any operational stage.

Work package:
`docs/work-packages/EF-03-staging-boundary.md`

Runbook:
`docs/engineering/STAGING_BOUNDARY.md`

Research:
`docs/research/EF-03_STAGING_PROVIDER_REVALIDATION_2026-09-29.md`

Required outcomes:
- Cloudflare Access/Tunnel boundary for `crm-staging.drowk.net`;
- replaceable vendor-neutral Docker compute host with no public application origin port;
- managed PostgreSQL reference staging provider: Neon direct TLS connection;
- runtime secret-file injection for database/tunnel credentials;
- staging-only health/readiness proof behind Access;
- immutable image-digest deployment contract;
- explicit rollback/kill path;
- deterministic preflight/sensors before any live apply.

Next: revalidate protected-main SHA/CI, then separately owner-authorized read-only
DigitalOcean/Neon/Cloudflare inspection and freeze the exact live plan. Gate A resource/identity
materialization requires fresh owner authorization and stops for evidence review. Gate B deploy/proof
requires accepted Gate A evidence and separate new authorization. Live proof and canon/post-merge
closure remain pending; follow the runbook for the complete sequence.

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
