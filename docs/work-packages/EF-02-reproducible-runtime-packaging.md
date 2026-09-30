# EF-02 — Reproducible Runtime Packaging

Status: CLOSED/GREEN — MERGED TO PROTECTED MAIN — POST-MERGE CI GREEN — NO DEPLOY

Authorized base:
`8e4a290b9336005b31e32b02bea8d8deeb542074`

Authorized branch:
`feat/ef-02-reproducible-runtime-packaging`

Canonical runbook:
`docs/engineering/RUNTIME_PACKAGING.md`

## Purpose

Create a reproducible, inspectable, non-root local container boundary for the existing DROWK API
and worker service without crossing into staging/deployment or durable worker orchestration.

## Opening audit

Repository inspection proves:
- no Dockerfile or Compose file currently exists for the product runtime;
- API already has build/start scripts, `/health`, `/ready`, runtime config and SIGINT/SIGTERM wiring;
- API lifecycle/shutdown is not yet proven in process/container sensors;
- worker has no `start` script, runtime config or process lifecycle;
- worker currently contains only tenant-scoped job-envelope contract code;
- CI required check `verify` does not build or smoke container images;
- no image revision identity exists.

## Authorized implementation surfaces

Codex may edit:
- root `.dockerignore`;
- root `compose.yaml`;
- API/worker Dockerfiles;
- `services/api/**` only for runtime config/lifecycle tests and bounded shutdown hardening;
- `services/worker/**` only for inert runtime shell/config/lifecycle;
- `tooling/runtime/**`;
- root `package.json` scripts;
- `.github/workflows/ci.yml` only to execute packaging verification inside existing `verify`;
- EF-02 docs/canon required to reflect implementation reality;
- `.env.example` only for safe placeholder local-compose variables if needed.

No new npm dependency is expected. Stop for review rather than silently adding one.

## Required implementation

Implement the contract in `docs/engineering/RUNTIME_PACKAGING.md`, including:
- digest-pinned Node 22 API + worker images;
- exact pnpm 10.17.1/frozen-lockfile builds;
- minimized build context;
- production-only runtime dependency closure;
- non-root users;
- exact Git SHA OCI revision labels;
- secret-safe image/config/history checks;
- API config/lifecycle proof;
- inert worker runtime shell + signal shutdown proof;
- local disposable Compose stack with pinned PostgreSQL, migration service, API and worker;
- offline static sensors;
- Docker-backed image/Compose verification;
- packaging verification inside existing required GitHub `verify` check.

## Worker boundary

EF-02 must not pretend the worker has durable execution.

The worker process may only:
- validate config;
- remain alive as a service shell;
- emit safe lifecycle markers;
- exit cleanly on termination signals.

It must not poll a DB/queue, schedule work, execute providers or create side effects.

## Required evidence

Before merge gate:
- `git diff --check`;
- frozen install;
- `pnpm runtime:test`;
- `pnpm harness:fast`;
- `pnpm harness:full`;
- `pnpm runtime:verify` when Docker is available;
- exact-head protected-PR CI:
  - `verify` SUCCESS including runtime packaging;
  - `postgres-foundation` SUCCESS;
- exact changed-file list;
- base-image digests;
- image user/revision-label evidence;
- local Compose readiness/cleanup evidence;
- dependency delta;
- confirmation of zero image pushes/deploys/provider/Gmail/outbound calls.

## Hard boundaries

DO NOT:
- deploy;
- push images;
- configure Cloudflare;
- add a managed DB;
- change DB migrations/schema;
- introduce queue/workflow technology;
- add provider/Gmail/outbound behavior;
- add production credentials;
- start EF-03/EF-04/DCRM-06;
- merge without separate owner authorization.

## Completion

EF-02 is CLOSED/GREEN.

Released evidence:
- final reviewed head: `13ffae8901c6d00f727c775aae7ed68981a1f7e1`;
- PR #23 merge commit: `65a03df0aaf42447642e130cccf881cff247799d`;
- exact-head push CI `36669927727`: verify SUCCESS, postgres-foundation SUCCESS;
- exact-head PR CI `36669931789`: verify SUCCESS, postgres-foundation SUCCESS;
- post-merge main CI `36670214400`: verify SUCCESS, postgres-foundation SUCCESS;
- final `verify` includes Docker-backed runtime packaging verification;
- API/worker image users: `1000:1000`;
- exact revision labels match Git HEAD;
- local Compose migration/readiness and cleanup proofs pass;
- APP_ENV vocabulary is closed to `development | test | staging | production`;
- dependency delta zero; lockfile unchanged;
- no image push, deploy, provider/Gmail/outbound or queue/orchestrator action occurred.

No implementation work package is currently active. EF-03 Staging Boundary is next but requires
a separate owner deployment gate.
