# Staging Boundary — EF-03

Status: TARGET CONTRACT FROZEN — REPO IMPLEMENTATION ACTIVE — LIVE PROVISIONING / IMAGE PUSH / DEPLOY GATE CLOSED

Canonical repository:
`drowknet/drowk-crm`

Authorized base:
`d3a9a2360072abe423fca1be8bf945214c2097a2`

Authorized branch:
`feat/ef-03-staging-boundary`

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
          -> drowk-worker (still inert)
              -> managed PostgreSQL
```

EF-03 has two explicit authority layers:
1. repo-owned implementation and deterministic verification — ACTIVE;
2. live resource provisioning, image push and deployment — CLOSED until a new owner gate.

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

Compute vendor selection is deferred to the live provisioning gate so account/region/cost facts
can be reviewed without changing the application contract.

### Managed PostgreSQL

Reference staging provider: Neon Postgres.

First-cell rules:
- dedicated staging project/branch; never production data by default;
- direct PostgreSQL connection over TLS;
- do not use transaction pooling/pooler for the first staging cell because DROWK uses
  PostgreSQL session-sensitive/advisory-lock behavior and pooling compatibility is unproven;
- staging connection URL must require TLS;
- migrations remain explicit one-shot operations, never API startup side effects;
- no new schema/migration is authorized by EF-03 itself;
- managed-Postgres provider remains replaceable behind `DATABASE_URL`.

### Runtime secrets

Secrets must not be baked into image config/layers or committed.

Repo implementation must add a file-based database secret path:
- exactly one of `DATABASE_URL` or `DATABASE_URL_FILE`;
- staging manifest uses `DATABASE_URL_FILE`;
- file contents are never logged or echoed;
- file must be readable only at runtime and absent from image layers.

Cloudflare Tunnel uses a token file rather than a token in image/command text where supported.
The final cloudflared image must be pinned by immutable digest.

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

Do not claim GitHub artifact attestations for this private Pro repository; that feature is not
part of the current plan/entitlement.

## Expected repo-owned implementation

Codex may add:
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
- worker remains network-disabled if technically compatible;
- API and cloudflared share only the minimum Docker network required for ingress;
- API retains outbound path to managed Postgres;
- `DATABASE_URL_FILE` mounted read-only;
- Tunnel token mounted read-only and consumed from file;
- no secret value in Compose source;
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

`staging:preflight` must be metadata-only and fail closed if:
- Git state is not canonical/clean enough for release evidence;
- image refs are mutable tags only;
- required non-secret staging config is missing;
- secret files are absent or overly permissive where local filesystem semantics allow checking;
- Docker/Compose are unavailable when a Docker-backed preflight is requested;
- manifest would expose a host port;
- selected staging SHA does not match image revision expectations.

## Live gate — explicitly CLOSED

Before any external mutation, the owner must separately authorize an exact live plan that includes:
- compute provider + region + expected monthly ceiling;
- Neon project/region/plan and whether a dedicated staging branch/project is created;
- Cloudflare account/zone target and exact hostname;
- Access identity policy for the owner;
- Tunnel creation;
- GHCR image push authorization;
- staging secret names/source;
- exact Git SHA to deploy;
- rollback image digest;
- kill path;
- acceptable external smoke requests.

Without that gate, DO NOT:
- create/modify Cloudflare Access/Tunnel/DNS;
- create Neon resources or credentials;
- provision compute;
- create GitHub environment secrets;
- push GHCR images;
- deploy containers;
- expose `crm-staging.drowk.net`;
- execute external staging smoke requests.

## First live staging proof — after owner gate only

The eventual bounded proof is:
1. create/access-protect `crm-staging.drowk.net`;
2. create Tunnel and start one cloudflared replica on replaceable compute;
3. provision empty dedicated managed staging Postgres;
4. apply existing migrations explicitly;
5. push exact protected-main API/worker images and deploy by digest;
6. prove external unauthenticated request is denied by Access;
7. prove authenticated owner request reaches staging;
8. prove `/health=200` and `/ready=200` behind Access;
9. verify deployed image revision labels equal authorized Git SHA;
10. verify no public origin/API port;
11. exercise rollback to prior digest or no-op rollback if first deploy, then re-promote;
12. exercise kill path by stopping Tunnel/app and prove hostname no longer reaches origin;
13. restore desired staging state;
14. record only metadata-safe evidence.

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

## Completion contract

EF-03 closes only after:
1. repo-owned staging boundary implementation passes deep review;
2. offline staging sensors and existing harness/CI are green;
3. owner separately authorizes the exact live plan;
4. first staging live proof completes within that authorization;
5. Access + Tunnel + origin JWT verification are proven;
6. managed staging PostgreSQL readiness is proven;
7. secrets are injected outside images/source;
8. immutable image SHA/digest identity is proven;
9. rollback and kill paths are exercised;
10. protected-main post-merge CI is green;
11. canon records EF-03 CLOSED/GREEN.

No production deployment is included.
