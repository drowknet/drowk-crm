# Runtime Packaging — EF-02

Status: TARGET CONTRACT FROZEN — IMPLEMENTATION ACTIVE — NO DEPLOY

Canonical repository:
`drowknet/drowk-crm`

Authorized base:
`8e4a290b9336005b31e32b02bea8d8deeb542074`

## Purpose

EF-02 proves that the current DROWK API and worker execution boundaries can be built, inspected,
started and stopped as replaceable local container images without introducing staging,
deployment, queueing or external business effects.

Reproducible in EF-02 means reproducible inputs and packaging contract:
- immutable base-image digest;
- Node 22;
- exact pnpm 10.17.1;
- frozen `pnpm-lock.yaml`;
- minimized/allowlisted build context;
- deterministic service build commands;
- OCI revision identity equal to the exact Git SHA;
- no runtime credential material in image layers or image config.

EF-02 does not claim byte-for-byte identical image IDs across different Docker/BuildKit
implementations.

## Opening facts

At authorization:
- no product Dockerfile exists;
- no product Compose file exists;
- API package has `build` and `start`;
- API startup requires `DATABASE_URL` and `APP_ENV`, validates `PORT`, and wires SIGINT/SIGTERM;
- API shutdown closes HTTP server and PostgreSQL pool, but lifecycle behavior is not yet
  proven by a process/container sensor;
- worker is compile-only with no `start` command or long-running runtime shell;
- required GitHub check `verify` does not build/smoke runtime images;
- no image carries a Git-revision identity contract.

## Canonical packaging shape

Expected repo-owned surfaces:
- root `.dockerignore`;
- API Dockerfile;
- worker Dockerfile;
- root local `compose.yaml`;
- `tooling/runtime/**` for static policy tests and Docker-backed verification;
- bounded API runtime-config/lifecycle code/tests;
- bounded worker runtime shell/config/lifecycle code/tests;
- root scripts for `runtime:test` and `runtime:verify`;
- existing CI `verify` job extended to run Docker-backed packaging verification.

Do not create a new required GitHub check name in EF-02. Packaging proof belongs inside the
already-required `verify` check so branch-protection policy remains unchanged.

## Image contract

Both API and worker images must:
- use an official Node 22 base image pinned by full `sha256:` digest;
- assert pnpm version `10.17.1` during build;
- install with frozen lockfile semantics;
- build from the repository root context;
- run as a numeric or named non-root user;
- contain only runtime-required workspace packages/artifacts and production dependencies;
- contain no test fixtures, Git metadata, exports, local environment files or raw docs tree;
- accept no secret/token/password/provider credential as a Docker build argument;
- not bake `DATABASE_URL`, OAuth/provider keys or application secrets into ENV/layers;
- expose OCI label `org.opencontainers.image.revision=<40-hex-git-sha>`;
- fail build/verification when the revision argument is missing or malformed;
- use no mutable application image tag as release identity in verification.

The Node base image digest and local Compose PostgreSQL image digest are implementation facts
that Codex must resolve, pin and report. Floating tags alone are not accepted.

## API runtime contract

Preserve existing authority and endpoints.

EF-02 may:
- strengthen runtime config validation for process startup;
- make lifecycle/shutdown logic testable;
- prove SIGTERM/SIGINT close the listener and PostgreSQL pool;
- add bounded shutdown timeout/fail-closed exit behavior if required for containers;
- set container runtime host/port explicitly from environment.

EF-02 must not add product mutation routes, provider calls, migrations on API startup or
Cloudflare-specific deployment assumptions.

`/health` stays process liveness and must not require PostgreSQL.
`/ready` stays the DB/migration readiness check.

## Worker runtime contract

The worker image needs a real process boundary, but EF-04 owns queue/orchestration.

Therefore EF-02 worker runtime is intentionally inert:
- validate bounded runtime config such as `APP_ENV`;
- start a long-running process shell;
- perform no polling, provider calls, Gmail access, DB mutation or job execution;
- log only safe lifecycle markers;
- stop cleanly on SIGTERM/SIGINT;
- expose no false claim that durable worker delivery exists.

Do not introduce pg-boss, DBOS, Cloudflare Workflows, cron or queue dependencies.

## Local Compose contract

Compose is local proof only, not a deployment manifest.

Expected services:
- PostgreSQL, pinned by digest;
- one-shot migration service using repo-owned migration runner;
- API;
- inert worker.

Requirements:
- no committed real password;
- runtime-generated or owner-provided local DB password;
- PostgreSQL not publicly exposed by default;
- API binds only to loopback on the host;
- API starts after successful migration;
- local readiness can reach 200 after migration;
- cleanup removes containers/networks/volumes created by the verifier;
- no Cloudflare Tunnel, public DNS, registry push or external provider credential.

## Executable sensors

Offline `runtime:test` must prove at least:
- Dockerfiles are digest-pinned;
- Dockerfiles use non-root runtime users;
- revision label contract exists;
- no secret-like build ARG/ENV contract exists;
- `.dockerignore` excludes Git, local env/secrets, docs/tests and unrelated workspace surfaces;
- Compose uses variable substitution rather than committed credential values;
- Compose does not expose PostgreSQL publicly;
- worker runtime remains inert/no queue/provider imports;
- config/lifecycle helpers fail closed.

Docker-backed `runtime:verify` must:
1. require canonical repo root and clean enough Git identity to resolve a 40-hex HEAD;
2. require Docker/Compose availability;
3. build API and worker images locally with the exact HEAD as revision;
4. inspect image user, labels and config;
5. prove revision label equals HEAD;
6. prove no credential values are baked into image config/history;
7. start API locally with no external network business calls and prove `/health=200`;
8. prove API `/ready=503` when DB is intentionally unavailable;
9. start/stop worker and prove SIGTERM exits cleanly;
10. run the disposable local Compose stack with generated local-only DB credentials;
11. apply migrations through the one-shot migration service;
12. prove composed API readiness reaches 200;
13. clean up all verifier-created containers/networks/volumes in `finally`/equivalent.

All output must remain metadata-only and secret-safe.

## CI contract

The existing required `verify` job must run:
- existing `pnpm harness:ci`;
- then `pnpm runtime:verify`.

Do not rename `verify`.
Do not add a new branch-protection requirement.
Existing `postgres-foundation` behavior remains unchanged.

CI may increase its timeout only as required for deterministic local image build/smoke.

## Explicitly forbidden

EF-02 does not authorize:
- deployment or staging;
- image push to GHCR/Docker Hub/any registry;
- Cloudflare Tunnel/WAF/DNS configuration;
- managed PostgreSQL;
- production credentials or runtime secret injection service;
- database schema/migration changes;
- queue or workflow selection;
- pg-boss/DBOS/Cloudflare Workflows;
- ActionAttempt or reconciliation implementation;
- AIsa/provider live calls;
- Gmail OAuth/live;
- outbound;
- DCRM-06;
- EF-03 or later EF implementation.

## Completion contract

### Implemented local workflow

Run from the canonical repository root:

```sh
npx --yes pnpm@10.17.1 install --frozen-lockfile
npx --yes pnpm@10.17.1 runtime:test
npx --yes pnpm@10.17.1 runtime:verify
```

`runtime:test` uses Node stdlib only, imports source helpers and needs neither Docker nor an
installed dependency tree. `runtime:verify` runs those sensors, builds locally, rejects missing
and malformed build revisions, inspects image metadata and runtime files, exercises both service
signals, verifies migration SQL bytes, and proves Compose readiness and cleanup. Docker output
is captured; only fixed markers, image IDs, non-root users and revision metadata are emitted.
No image is pushed. Registry/package downloads during builds are infrastructure reads.

Pinned official multi-platform image indexes:
- Node: `node:22-bookworm-slim@sha256:43ac6c60b8f89723f746e8a92ce91abd5017e627ce1ddfe4238355d3a30b772c`
- PostgreSQL: `postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea`

Both final images run as `1000:1000`. Builds install the frozen graph with lifecycle scripts
disabled, then compile the service dependency closure. The stdlib packer copies only the service
and its installed production dependencies (including installed optional dependencies), preserving
each package's resolution context. Workspace packages contain manifests and compiled artifacts;
DB also contains the unchanged migration SQL. Build tools, repository source, fixtures, unrelated
workspaces and Git metadata do not enter the final application tree. Required third-party runtime
source and package licenses remain available. No new npm dependency or lockfile change is needed.

API and worker accept exactly `APP_ENV ∈ {development, test, staging, production}`.
All other values, including whitespace and newline variants, fail closed. `staging` and
`production` are configuration vocabulary only; they do not authorize deployment or EF-03.

API process startup validates a PostgreSQL URL, the canonical `APP_ENV`, an IP literal `HOST` and a
port from 1 through 65535. The existing injectable library config and authorization contract stay
compatible. API shutdown closes the listener then the pool once, with a five-second process
deadline and failure exit on timeout. Worker startup validates `APP_ENV`; it only stays alive
and emits inert lifecycle markers. It has no DB, provider, polling or job-delivery behavior.

The verifier generates a local-only password in memory and passes it through subprocess
environment, never build arguments, command-line values, log files or committed files. Disposable
containers necessarily hold their runtime environment until deletion. Inherited provider/DB
credentials, `NODE_OPTIONS`, Compose overrides and remote `DOCKER_HOST` are not forwarded.
Only a local Unix-socket/named-pipe Docker context is accepted. Compose uses an internal network,
an ephemeral loopback API port, an unpublished DB and an independently invoked migration runner.
All verifier-created containers, networks and volumes are removed and checked for absence in
`finally`, including ordinary failures and SIGINT/SIGTERM. Host termination/SIGKILL or an
unavailable Docker daemon cannot be recovered by a running process; the verifier fails closed
if cleanup cannot be confirmed. Local images/build cache are retained for inspection.

`pnpm runtime:verify --fail-after-compose` deliberately fails immediately after creating the
Compose stack. Expected evidence is `RUNTIME_CLEANUP_PASS containers=0 networks=0 volumes=0`
followed by failure exit 1. This separately exercises cleanup of real resources on failure.

For manual Compose inspection, provide `DROWK_API_IMAGE` and `DROWK_WORKER_IMAGE` as the verified
immutable image IDs, plus `DROWK_LOCAL_DB_PASSWORD` and the corresponding
`DROWK_LOCAL_DATABASE_URL` targeting `postgres:5432/drowk_runtime_test`. Never print expanded
Compose configuration or container environments. Finish with the same project's
`docker compose down --volumes --remove-orphans`. The verifier is the default safe local workflow.

During implementation the verifier identifies dirty input as `WORKTREE_CANDIDATE`; this is not
exact committed-tree evidence. CI requires a clean checkout. Final evidence must be rerun at
the committed HEAD. Image labels contain exactly that 40-character SHA, and verification uses
image IDs after build, not mutable application tags. This does not promise byte-for-byte image
equality across builders. Merge and post-merge closure remain separate owner gates.

EF-02 closes only when:
1. repo-owned packaging/runtime implementation passes review;
2. offline runtime tests pass;
3. Docker-backed local verification passes;
4. exact-head GitHub `verify` includes and passes packaging verification;
5. `postgres-foundation` remains green;
6. image metadata proves non-root + exact Git revision + no baked credentials;
7. local Compose readiness and cleanup proof pass;
8. owner separately authorizes merge;
9. protected-main post-merge CI is green;
10. canon records EF-02 CLOSED/GREEN.

No deployment is included.
