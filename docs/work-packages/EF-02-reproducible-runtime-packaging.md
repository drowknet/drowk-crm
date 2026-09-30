# EF-02 — Reproducible Runtime Packaging

Status: ACTIVE — OWNER AUTHORIZED — NO DEPLOY

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

Implementation checkpoint (not closure): repo-owned images, local Compose, stdlib runtime
sensors and Docker-backed verification are implemented. API process config and bounded shutdown
are proven separately from the unchanged injectable library and authorization contracts. Worker
remains inert. The runbook records exact image digests and verification operation.

Local candidate evidence: frozen install on an NTFS worktree (D: is exFAT), offline runtime tests,
fast/full harnesses and Docker packaging verification pass. An intentional post-Compose failure
also confirms zero remaining verifier containers/networks/volumes. Exact committed-head evidence
and CI are reported with the implementation handoff; this checkpoint does not authorize merge,
deploy, image push or EF-03/EF-04.

Merge is a separate owner gate after exact-head CI and deep review.

Post-merge CI must pass before EF-02 can be called CLOSED/GREEN.
