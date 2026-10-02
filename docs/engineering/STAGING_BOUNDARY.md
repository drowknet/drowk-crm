# Staging Boundary — EF-03

Status: OPEN — REPO IMPLEMENTATION MERGED — LIVE STAGING GATE PENDING

Canonical repository:
`drowknet/drowk-crm`

Repo-owned implementation merged through PR #25, final feature head
`18f0acea9b20b223209661925f91737207420d48`, into protected `main` as
`0137e4904758561611c2d3d504a459284657f64d`.
Post-merge CI `36718588406` was green for `verify` and `postgres-foundation`.
This is historical PR #25 implementation evidence, not the current deployment candidate.

Pre-live hardening PR #26 merged as `a6f41127de39256b4461a8e75a0bf2119e75afa3`;
post-merge CI `36802547723` passed `verify` and `postgres-foundation`. That SHA is the
last explicitly EF-03-hardened checkpoint, not a current deployment selection. Protected `main`
has advanced since then. No EF-03 deployment candidate is selected by this runbook; a future live
plan must select an exact protected-main SHA and revalidate exact-head/post-merge CI.
Full EF-03 remains OPEN because live staging proof has not happened.
The old implementation branch was deleted. Feature branches are not long-lived deployment
authority: the exact selected protected-main SHA and exact-head/post-merge CI are authoritative.

Target staging hostname:
`crm-staging.drowk.net`

## Purpose

EF-03 proves the first external staging boundary without turning staging into production or
silently broadening business authority.

The preferred operational shape remains:

```text
Cloudflare edge
  -> Access
  -> Tunnel
      -> replaceable Docker host
          -> cloudflared
          -> drowk-api
              -> managed PostgreSQL
          -> drowk-worker (still inert, no network)
```

Repo-owned implementation is merged; deterministic verification grants no live authority.
Live work has two separately authorized gates below: Gate A resource/identity materialization,
then Gate B deploy/proof. Both remain CLOSED; implementation and pre-live hardening are complete.

## Frozen staging decisions

### Edge and ingress

- staging hostname: `crm-staging.drowk.net`;
- create the Cloudflare Access self-hosted application before publishing the Tunnel route;
- use a remotely managed Cloudflare Tunnel;
- do not expose the API on a public host port;
- `cloudflared` reaches the API only over a Docker network;
- origin application traffic needs no inbound public HTTP/TLS port;
- the API continues to validate `Cf-Access-Jwt-Assertion` itself;
- Tunnel-side Access validation may be enabled as defense-in-depth but never replaces application verification.

No SSH/TCP public route is required by the first staging proof. Host administration remains an
owner-controlled out-of-band channel until a separate automation decision is reviewed.

### Replaceable compute

The first staging host is vendor-neutral by contract.

Required host properties:
- Linux host capable of Docker Engine + Compose v2;
- no canonical CRM state on local disk;
- no provider/Gmail credentials beyond staging runtime requirements;
- application/tunnel containers restartable from repo-owned manifests;
- firewall/network posture does not require public API ingress;
- host loss must be recoverable from immutable image refs + managed DB + secret source.

DigitalOcean is the intended provider to inspect for the first replaceable Linux compute candidate.
Account, region, size, image and cost decisions remain unset until separately owner-authorized
read-only inspection provides current evidence; the application contract remains vendor-neutral.

### Managed PostgreSQL

Reference staging provider: Neon Postgres.

First-cell rules:
- dedicated staging project/branch; never production data by default;
- PostgreSQL 16, Postgres-only;
- direct PostgreSQL connection over TLS;
- do not use transaction pooling/pooler for the first staging cell because DROWK uses
  PostgreSQL session-sensitive/advisory-lock behavior and pooling compatibility is unproven;
- staging connection URL must require TLS;
- migrations remain explicit one-shot operations, never API startup side effects;
- no new schema/migration is authorized by EF-03 itself;
- managed-Postgres provider remains replaceable behind `DATABASE_URL`.

#### FIRST-STAGING-PROOF single-role exception

The first proof intentionally shares one direct-TLS `DATABASE_URL_FILE` credential between
API runtime and the explicit one-shot migration container. This is a bounded first-staging-proof
exception, not a production security conclusion. No schema/privilege redesign is authorized here;
current migrations do not define a separate runtime-role grant model. A correct split needs explicit
ownership/GRANT design for database, schema, tables, sequences, functions and migration-history
access. Ad hoc provider-side grants would create unreviewed authority outside repo canon.

Known `-pooler` endpoints remain rejected; the worker has neither DB secret nor network.
The credential is never printed or committed. Revisit this exception in a separately authorized
least-privilege hardening task before production or any material expansion of authority.
No new migration SQL, CREATE ROLE, GRANT or ALTER OWNER operation is authorized.
Execution of existing migrations remains Gate B only; this docs-only stage executes none.

### Runtime secrets

Secrets must not be baked into image config/layers or committed.

The merged implementation provides a file-based database secret path:
- exactly one of `DATABASE_URL` or `DATABASE_URL_FILE`;
- staging manifest uses `DATABASE_URL_FILE`;
- file contents are never logged or echoed;
- file must be readable only at runtime and absent from image layers.

Cloudflare Tunnel uses a token file rather than a token in image/command text where supported.
The cloudflared image remains pinned by immutable digest.

Non-secret staging config may remain environment variables:
- `APP_ENV=staging`
- `HOST=0.0.0.0`
- `PORT=8000`
- `AUTH_PROVIDER=cloudflare-access`
- exact Access issuer
- exact Access audience.

### GitHub and registry

GitHub Environment `staging` is the intended managed deployment-secret source after the live gate.
On the current private personal GitHub Pro topology, environment secrets/branch restrictions are
usable but required-reviewer enforcement must not be assumed. The explicit owner gate remains
authoritative.

GHCR is the intended staging image registry after image-push authorization:
- only immutable build identity from protected `main`;
- tag may aid discovery, but deployment must resolve and record image digests;
- API/worker OCI revision label must equal the deployed Git SHA;
- no image is pushed during the repo-owned phase.

#### GHCR host-pull authentication boundary

The future Linux host must not assume anonymous pull for a private package. Before Gate B,
freeze the least-privilege package-read credential/identity, exact package scope and external
credential source. Package read is the only permission unless another is separately justified.
Freeze the host-side storage/injection mechanism and noninteractive login/pull path (for example,
an approved credential helper or private external Docker config with password-stdin injection).
No token may enter Compose source, an image, build args, committed env or printed evidence.

The plan must define rotation, revocation and host removal: replace the external credential and
validate pull, revoke the old identity/credential, and remove helper/config material when the
host is retired or access is withdrawn. Record only metadata-safe authentication/pull results.
Successful authenticated pull does not authorize deploy. No credential is created by this WP.

Do not claim GitHub artifact attestations for this private Pro repository; that feature is not
part of the current plan/entitlement.

## Merged repo-owned implementation scope

PR #25 delivered the following bounded surfaces:
- `infra/staging/compose.yaml`;
- `infra/staging/README.md`;
- non-secret staging env/example/config schema;
- `tooling/staging/**` deterministic tests/preflight/render/rollback helpers;
- bounded API runtime support for `DATABASE_URL_FILE`;
- API tests proving env/file exclusivity, safe errors and staging TLS requirement;
- root package scripts such as `staging:test` and `staging:preflight`;
- CI wiring for offline staging-contract sensors inside existing `verify`;
- docs/canon updates reflecting implementation reality.

No new npm dependency is expected. Stop for review before adding one.

## Staging Compose contract

Expected services:
- `api`;
- inert `worker`;
- `cloudflared`;
- optional explicit one-shot `migrate` service/profile.

There is no local PostgreSQL service in the staging manifest.

Requirements:
- API image ref supplied as immutable digest reference;
- worker image ref supplied as immutable digest reference;
- cloudflared image ref pinned by full digest;
- no API/worker/cloudflared host port publishing;
- worker uses `network_mode: none` and receives no DB secret;
- API and cloudflared share only the minimum Docker network required for ingress;
- API retains outbound path to managed Postgres;
- `DATABASE_URL_FILE` mounted read-only;
- Tunnel token mounted read-only and consumed from file;
- no secret value in Compose source;
- read-only root filesystems, dropped capabilities and no-new-privileges;
- no Docker socket;
- restart policy explicit;
- healthcheck uses local process health only;
- migrations are deliberate, one-shot and not coupled to every restart.

## Deterministic sensors

Offline `staging:test` must prove at least:
- no host ports in staging Compose;
- no local PostgreSQL service;
- all application images require digest refs;
- cloudflared ref requires digest;
- worker remains inert/no network business path;
- database secret uses file injection and forbids simultaneous env+file;
- staging database URL requires PostgreSQL TLS;
- Access provider/issuer/audience are required for staging config;
- no real secret values or secret-like defaults are committed;
- rollback input requires immutable digest refs;
- kill-path command targets cloudflared/API/worker without deleting DB state;
- no live API calls occur in tests.
- `postgres-foundation` CI uses the approved immutable PostgreSQL 16 digest:
  `postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea`.

`staging:preflight` must be metadata-only and fail closed if:
- Git state is not canonical/clean enough for release evidence;
- image refs are mutable tags only;
- required non-secret staging config is missing;
- secret files are absent or overly permissive where local filesystem semantics allow checking;
- Docker/Compose are unavailable when a Docker-backed preflight is requested;
- manifest would expose a host port;
- selected staging SHA does not match image revision expectations.

## Current engineering authority

Owner-supplied PR #26 checkpoint (pre-live staging hardening):
- reviewed feature head: `bbacb2fdff03789ae18d958a141b617c68c4b8c1`;
- protected-main merge/current candidate: `a6f41127de39256b4461a8e75a0bf2119e75afa3`;
- exact-head push CI `36801793188`: `verify` SUCCESS, `postgres-foundation` SUCCESS;
- pull_request CI `36802343313`: both required checks SUCCESS;
- post-merge main CI `36802547723`: both required checks SUCCESS;
- main remains protected; required checks remain exactly `verify` and `postgres-foundation`;
- open PRs after the PR #26 merge: 0 (checkpoint evidence, not a perpetual claim).

PR #25's SHA above is historical implementation evidence. Neither a deleted feature branch nor
this docs branch is deployment authority. After a later protected-main docs merge, select that
merge SHA only with green post-merge CI; do not assume the recorded candidate stays current.

## Next operational sequence

DigitalOcean and Neon are currently **UNCONFIGURED for DROWK**. Plugin/tool availability,
authentication experiments or historical provider references do not establish project configuration.
Apollo is also UNCONFIGURED and is not part of the EF-03 infrastructure dependency chain.

After the current canon/process hardening is accepted and merged, the next operational work is
ordered as follows:

1. Revalidate the exact protected-main SHA and exact-head/post-merge CI evidence.
2. Obtain separate explicit owner authorization for **READ-ONLY provider discovery/inspection**,
   treating DigitalOcean and Neon as unconfigured starting state; then inspect:
   - DigitalOcean account identity, limits, current droplets, regions, sizes, distribution image
     options and cost-relevant metadata;
   - Neon current account/project state, region/plan and direct-connection options;
   - Cloudflare account/zone, Access/Tunnel/DNS assumptions and staging-hostname collision/readiness.
   Record only safe metadata. This docs stage authorizes no inspection or credential retrieval.
3. Freeze the exact EF-03 live plan from current provider evidence using the checklist below.
4. Request fresh explicit owner authorization for Gate A.
5. Execute Gate A only.
6. Capture metadata-safe generated outputs and **STOP for review**.
7. After Gate A evidence is accepted, request separate new Gate B authorization.
8. Execute Gate B only within its frozen bounds.
9. Deep-review the live proof and disposition findings; execution alone is not acceptance.
10. Close EF-03 only after accepted evidence and repository canon/protected-main post-merge closure.

Inspection, Gate A and Gate B are separate authority stages. Dated public research is background,
not current account readiness. No region, size, cost ceiling or provider ID is selected by this canon.

## Exact live-plan checklist

Freeze each input below from accepted current evidence before requesting Gate A. Generated values
remain outputs of their authorized operations; the plan freezes how to capture and validate them.
Any material plan change after Gate A must be reviewed before the separate Gate B authorization.

- **DigitalOcean:** provider/account identity; region; droplet size; Linux distribution/image;
  CPU architecture; monthly cost ceiling; explicit backups/monitoring decision where relevant;
  exact host administration method; firewall/inbound posture; no public application origin port.
- **Neon:** exact staging project name, region, plan/cost ceiling, PostgreSQL 16, Postgres-only
  first cell, default branch/database naming as appropriate; direct endpoint validation (never a
  known `-pooler` endpoint); bounded single-role first-staging exception. Define the authorized
  credential retrieval/handling stage; resource existence alone never authorizes retrieval.
  No schema change beyond executing existing migrations in Gate B; no role split or privilege SQL.
- **Cloudflare:** account and `drowk.net` zone identity; `crm-staging.drowk.net` collision/readiness
  check before route publication; Access app/policy first; exact owner identity-policy intent;
  Access issuer/audience captured as generated metadata; remotely managed Tunnel identity;
  Tunnel/DNS route only after Access and only in Gate B; mandatory origin JWT validation;
  no public origin/API host port.
- **GHCR:** exact API/worker package and image names; exact build/push executor; source protected-main
  SHA; OCI revision labels; resulting immutable registry digests captured after authorized Gate B
  publication; host pull identity with least-privilege package-read scope; external credential source;
  host-side injection/storage; noninteractive pull/login; rotation/revocation/removal. Authenticated
  pull does not itself authorize deploy.
- **Secrets:** exact external source and transport/injection mechanism to the Linux host; exact host
  paths outside checkout/build context; DB file UID 1000 and Tunnel token UID 65532; regular
  non-symlink files, owner-readable with no group/other bits, expected `0400`/`0600` policy.
  Never print, commit or bake credentials into images. Freeze handling authority explicitly.
- **Execution:** staging preflight; explicit one-shot migration; API + inert worker; cloudflared;
  route publication after Access; exact bounded smoke URLs and request count; unauthenticated Access
  denial; authenticated owner access; `/health=200`; `/ready=200`; image digest/revision proof;
  no public origin port. No unbounded smoke or automatic expansion of the request budget.
- **Rollback/kill/restore:** previous immutable refs if available; explicit first-deploy no-op rollback
  if none exist; migration/schema compatibility review before rollback; quiesce migration; stop
  cloudflared first, API/worker next; preserve managed DB and secret source; desired-state restoration;
  destructive cleanup requires separate authorization.
- **Cost/abort:** aggregate staging cost ceiling across providers plus individual ceilings;
  fail closed on identity or artifact mismatch and failed proof; no retry that silently broadens cost
  or authority; exact cleanup rules and intentionally preserved resources (managed DB and secret source).

## Live gates — explicitly CLOSED

### Pre-mutation frozen inputs

Before Gate A, freeze the exact plan and reviewable choices, not provider-assigned outputs:
- exact protected-main source SHA with green exact-head/post-merge `verify` and `postgres-foundation` evidence;
- provider/account/zone targets and resource names, Neon staging project/branch names;
- regions, PostgreSQL 16 / Postgres-only, service/plan/compute class and cost ceiling;
- hostname `crm-staging.drowk.net` and owner identity-policy intent;
- remotely managed Tunnel strategy and exact GHCR API/worker repository names;
- direct TLS strategy, no first-cell transaction pooler;
- secret names/source/path strategy and Linux UID/mode contract;
- host-pull authentication requirements above, with concrete storage/injection and noninteractive path frozen before Gate B;
- explicit existing one-shot migration strategy, no startup migration or new schema;
- immutable rollback strategy (prior verified refs if available, otherwise explicit first-deploy no-op),
  kill sequence, desired restored state, permitted smoke surface and request bounds;
- abort/cleanup rules, including stopping on identity mismatch or failed proof, stopping cloudflared
  first then API/worker, preserving managed DB and secret source, and separately authorizing any
  destructive resource cleanup. No automatic retry that broadens cost or authority.

### Provider-generated outputs

Neon `project_id` and direct endpoint metadata, Cloudflare Access audience/issuer metadata and
Tunnel identity are captured after their authorized Gate A creation. Registry digests are captured
after authorized Gate B image publication. Never invent these values or require them to exist
before the mutation that generates them. A plan records their capture and validation requirements;
release preflight later requires the actual outputs. Capture only metadata-safe evidence, never
passwords, URLs containing credentials, tokens or keys.

### Gate A — RESOURCE / IDENTITY MATERIALIZATION

Gate A requires explicit owner authorization for the frozen plan. It may create only the minimum
control-plane resources/identities needed for provider-assigned metadata:
1. Neon staging project with PostgreSQL 16, Postgres-only, frozen region/plan;
2. Cloudflare Access self-hosted application and owner identity policy;
3. remotely managed Tunnel identity if needed by the frozen plan.

Gate A MUST NOT publish a Tunnel/DNS route, provision application compute, push GHCR application
images, deploy API/worker/cloudflared, execute a migration or execute live staging HTTP smoke.
It MUST NOT retrieve/print secrets merely because a resource exists.
Record metadata-safe generated outputs and STOP for review. Gate A completion does not authorize
Gate B, credential retrieval beyond separately approved handling, or any deployment.

### Gate B — DEPLOY / PROOF

Gate B may begin only after Gate A evidence is reviewed/accepted and a new explicit owner
authorization for Gate B exists. The bounded sequence is:
1. provision replaceable Linux compute and prepare host secrets under the frozen source/path/UID/mode contract;
2. build API/worker from the exact authorized protected-main SHA and publish to the explicitly
   authorized GHCR image names; capture the resulting registry digests as Gate B outputs;
3. authenticate host pulls through the approved package-read mechanism; pull immutable refs;
4. deterministically verify produced digest/RepoDigests evidence and both OCI revision labels
   equal the selected protected-main SHA, then pass staging preflight on the clean selected checkout;
5. only after artifact identity and preflight pass, execute the explicit one-shot migration,
   start API + inert worker and cloudflared, and publish the Tunnel route only after Access exists;
6. execute only the authorized smoke matrix, rollback/no-op rollback, kill and restoration below;
7. capture metadata-safe evidence and stop for review.

A failed artifact identity check stops Gate B before deploy/migration. A GHCR digest is an output
of authorized publication, not a precondition to that publication. No successful build, push, pull
or preflight grants authority beyond the explicit Gate B authorization.

Without the applicable explicit gate, DO NOT:
- create/modify Cloudflare Access/Tunnel/DNS;
- create Neon resources or credentials;
- provision compute;
- create GitHub environment secrets;
- push GHCR images;
- deploy containers;
- expose `crm-staging.drowk.net`;
- execute external staging smoke requests.

## First live staging proof — Gate B only

After the ordered Gate B artifact checks, migration and deployment above:
1. prove external unauthenticated request is denied by Access;
2. prove authenticated owner request reaches staging and origin JWT verification remains enforced;
3. prove `/health=200` and `/ready=200` behind Access;
4. confirm deployed image digest/revision identity and no public origin/API port;
5. review migration/schema compatibility, then exercise rollback to prior verified immutable refs
   or explicit no-op rollback if first deploy, then re-promote;
6. exercise kill: quiesce migration, stop cloudflared first, then API/worker; prove hostname no longer
   reaches origin while preserving the managed DB and secret source;
7. restore desired staging state within the authorization;
8. record only metadata-safe evidence. Live proof remains pending until actually executed and accepted.

## Explicitly forbidden

EF-03 does not authorize:
- production deployment;
- production DNS/hostname;
- production/customer data copy;
- provider/AIsa live calls;
- Gmail OAuth/live/outbound;
- queue/workflow technology;
- EF-04/EF-05/EF-06 implementation;
- DCRM-06;
- database schema changes;
- broad autonomous deployment;
- Kubernetes or service mesh.

## Repository implementation

The repo-owned bundle is in `infra/staging/`; operational inputs, permissions, TLS policy,
explicit migration entrypoint and non-executing plans are documented in
[`infra/staging/README.md`](../../infra/staging/README.md).

- `pnpm staging:test`: offline Node-stdlib contract and failure sensors.
- `pnpm staging:verify`: synthetic temporary files and local Compose config rendering only;
  no pull/build/start, registry request or live staging request.
- `pnpm staging:preflight`: later authorized local release metadata/file validation, including
  clean selected HEAD and already-present image digest/revision checks; no pull fallback.
- `pnpm staging:rollback-plan <non-secret-input.json>` and `pnpm staging:kill-plan`: plans only.

Cloudflared is pinned to
`cloudflare/cloudflared:2026.9.3@sha256:072c067d25ccbe61d46e18f0d0723255f2bb5304f7317caa95b27031520ff92c`.
The API resolves exactly one env/file DB input once at startup. Staging requires direct PostgreSQL
TLS with `sslmode=require` or `sslmode=verify-full`, forbids URL parser overrides and requires
Access configuration. Root EF-02 disposable Compose and DB migrations remain unchanged.
The existing CI `verify` runs staging verification after `harness:ci` and `runtime:verify`.
These artifacts do not open the live gate or mark EF-03 CLOSED/GREEN.

Linux secret-file preflight requires regular non-symlink files: the database secret must be owned
by UID **1000**, and the Tunnel token by UID **65532**. Files must be owner-readable only, with
the owner-read bit present and **no group/other permission bits** (`0400` or `0600`, for example).
Root-owned `0600` files and files without owner-read permission fail, even when the preflight
process can read them. Production preflight checks actual filesystem metadata; synthetic CI
fixtures do not relax this policy. Windows continues to report `OWNER_ACL_REVIEW_REQUIRED` and
cannot certify the future Linux-host UID mapping.

## Closure gates

EF-03 closes only after:
1. repo-owned staging boundary implementation passes deep review;
2. offline staging sensors and existing harness/CI are green;
3. owner authorizes Gate A, accepts its evidence, then separately authorizes Gate B;
4. first staging live proof completes within that authorization;
5. Access + Tunnel + origin JWT verification are proven;
6. managed staging PostgreSQL readiness is proven;
7. secrets are injected outside images/source;
8. immutable image SHA/digest identity is proven;
9. rollback and kill paths are exercised;
10. protected-main post-merge CI is green;
11. canon records EF-03 CLOSED/GREEN.

No production deployment is included.
