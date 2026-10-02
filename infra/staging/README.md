# EF-03 staging bundle — implementation merged, live proof pending

PR #25 merged the repo-owned implementation into protected `main` at
`0137e4904758561611c2d3d504a459284657f64d`; post-merge CI `36718588406` was green.
This is historical PR #25 implementation evidence, not the current deployment candidate.

Pre-live hardening PR #26 merged as `a6f41127de39256b4461a8e75a0bf2119e75afa3`;
post-merge CI `36802547723` passed `verify` and `postgres-foundation`. That SHA is the
last explicitly EF-03-hardened checkpoint, not a current deployment selection. Protected `main`
has advanced; no EF-03 deployment candidate is selected here. A later live plan must select and
revalidate an exact protected-main SHA.
Full EF-03 remains OPEN. Deployment authority is an exact protected-main SHA with
exact-head/post-merge CI evidence, never a feature-branch name.

No live provisioning, credential retrieval, image push, deployment or external smoke request is
authorized. This bundle prepares the boundary for a later exact owner-approved plan. It does not
create Access, Tunnel, DNS, Neon resources, compute or GitHub Environment secrets.

The intended hostname is `crm-staging.drowk.net`; do not call it in this phase. The live gate must
create the Access application before publishing the Tunnel route. The existing API Access JWT
verifier remains mandatory at the origin, independently of edge enforcement and tenant membership.

## Files and inputs

`compose.yaml` uses JSON syntax (valid YAML) so Node stdlib tests can inspect the exact Compose
structure without another dependency. It is separate from root EF-02 disposable Compose.

`staging.env.example` lists non-secret inputs only. Empty fields deliberately fail validation.
Use absolute host file paths for the two secret-file inputs, never credential contents.
Freeze the protected-main SHA and exact API/worker image repository names before mutation.
Gate A generates provider metadata; authorized Gate B publication generates registry digests.
Only then bind actual API/worker immutable refs to the selected SHA and verify their OCI revisions
before migration/deploy. Tags alone are rejected. No automatic image lookup or pull exists in these tools.

Before either gate, follow the runbook's [ordered pre-live sequence](../../docs/engineering/STAGING_BOUNDARY.md#next-operational-sequence)
and [exact live-plan checklist](../../docs/engineering/STAGING_BOUNDARY.md#exact-live-plan-checklist).
DigitalOcean and Neon are currently UNCONFIGURED for DROWK. Read-only
DigitalOcean/Neon/Cloudflare discovery is a separate future owner-authorized stage; plugin/tool
availability does not establish configuration. DigitalOcean region/size/image/cost and other
provider choices remain unset pending that evidence.

## Two owner gates

The [canonical live plan](../../docs/engineering/STAGING_BOUNDARY.md#live-gates--explicitly-closed)
separates frozen inputs (names, SHA, region/plan/cost, PostgreSQL 16, identity intent, direct TLS,
secret source/path/UID/mode, migration, rollback/kill, smoke and abort/cleanup) from generated outputs.
Do not invent provider IDs, Access metadata, Tunnel identity or registry digests as preconditions
to the authorized operations that generate them.

- **Gate A — resource/identity materialization:** explicit owner authorization may create only the
  minimum PostgreSQL 16 Postgres-only Neon staging project, Access app/owner policy and remotely
  managed Tunnel identity if needed. Capture safe project/direct-endpoint, Access issuer/audience
  and Tunnel metadata; STOP for review. No route/DNS publication, application compute, GHCR app
  image push, app/cloudflared deploy, migration or live staging HTTP smoke.
- **Gate B — deploy/proof:** accepted Gate A evidence plus new explicit owner authorization is required.
  Prepare replaceable Linux compute/secrets, build the exact authorized protected-main SHA, publish
  explicitly named GHCR images, capture digests and authenticate host pulls. Deterministic digest/OCI
  revision checks and preflight must pass before one-shot migration or deploy; failure stops Gate B.
  Only then start API/inert worker/cloudflared and publish the route after Access exists, perform
  authorized smoke, rollback/no-op rollback, kill and desired-state restoration, and record safe evidence.

### Private GHCR host pulls

Do not assume anonymous pull. Before Gate B, freeze a least-privilege package-read credential/identity
and package scope, source outside Git, host-side storage/injection and a noninteractive login/pull path.
Only package read is allowed unless another permission is separately justified. The plan must select
an approved credential helper or private external Docker config/injection path; no token in Compose,
images, build args, committed env or evidence. Include rotation (replace externally and validate pull),
revocation of the old credential and removal of helper/config material when the host/access is retired.
An authenticated pull does not authorize deployment. This WP creates no credential.

Pinned cloudflared input, resolved from public registry metadata:

```text
cloudflare/cloudflared:2026.9.3@sha256:072c067d25ccbe61d46e18f0d0723255f2bb5304f7317caa95b27031520ff92c
```

The index includes Linux amd64 and arm64. The command disables auto-update and consumes the
remotely managed Tunnel token at `/run/secrets/cloudflare_tunnel_token`. No token is retrieved
or created here.

## Runtime boundary

- No service publishes a host port; there is no local PostgreSQL service or DB volume.
- API listens on `0.0.0.0:8000` inside the container. Its healthcheck calls only local `/health`.
- API, cloudflared and the explicit migration service share one bridge network with egress.
- The inert worker has `network_mode: none` and receives no database or Tunnel secret.
- API/worker/migrate run as `1000:1000`; cloudflared runs as `65532:65532`.
- Containers have read-only root filesystems, dropped capabilities, no Docker socket and an
  eight-second stop grace. API/worker/cloudflared restart unless stopped; migrations never restart.
- `no-new-privileges` remains enabled.

Exactly one of `DATABASE_URL` or `DATABASE_URL_FILE` must be defined, including empty values:
both or neither fail. The API reads the absolute file once at startup and retains only the resolved
URL. One terminal LF or CRLF is accepted for files; empty values, additional newlines or whitespace
are rejected. Errors never include file paths or contents. Development/test direct URL behavior
remains available. No migration runs during API startup.

Staging requires a PostgreSQL URL with a hostname, database and exactly one query parameter:
`sslmode=require` or `sslmode=verify-full` (prefer `verify-full`). The frozen pg dependency validates
certificates for both; tests inspect that parser behavior without opening a connection. Optional,
disabled and non-verifying modes, duplicate modes, socket hosts, fragments, parser/TLS overrides
and `NODE_TLS_REJECT_UNAUTHORIZED=0` fail closed. Known `-pooler` endpoints are rejected. An
arbitrary hostname cannot establish direct-connection semantics: the live owner plan must confirm
the endpoint is direct. No Neon hostname is hard-coded. Access provider, exact HTTPS issuer and
nonempty audience are required for staging API configuration.

**FIRST-STAGING-PROOF exception:** API runtime and the explicit one-shot migration container share
one direct-TLS `DATABASE_URL_FILE` credential. This is not a production security conclusion.
No schema/privilege redesign or role split is authorized: current migrations lack a separate runtime-role
grant model, which needs reviewed ownership/GRANT design for database/schema/tables/sequences/functions
and migration history. Do not add ad hoc provider-side grants. Revisit under a separately authorized
least-privilege task before production or materially expanded authority. The credential is never printed
or committed; known `-pooler` endpoints remain rejected and worker has no DB secret/network.

Compose secrets are runtime, read-only file mounts, not encrypted storage. On the Linux host the
owner must place files outside the checkout/build context. Linux preflight requires the database
secret to be owned by UID **1000** and the Tunnel token to be owned by UID **65532**. Both must be
regular non-symlink files, owner-readable only: the owner-read bit must be present and **no group/other
permission bits** may be set (for example, `0400` or `0600`). Root-owned `0600` files fail for both
container identities; a missing owner-read bit fails even if preflight runs as root.
Local Compose does not implement secret-file `uid`/`mode` remapping: do not rely on those fields to
fix host ownership. Preflight uses actual filesystem metadata and checks bounded size and caller
readability as well. Synthetic verification checks test-runner-owned fixtures separately and tests
the container UID/mode policy using pure metadata; it does not certify deployment files. Windows reports
`OWNER_ACL_REVIEW_REQUIRED`; it cannot certify Windows ACL isolation or Linux container ownership.
No real file or credential is created by verification.

## Verification and plans

From the repository root:

```sh
pnpm staging:test
pnpm staging:verify
pnpm staging:kill-plan
pnpm staging:rollback-plan /absolute/path/to/non-secret-rollback-input.json
```

The rollback input is a JSON object with `current` and `previous`, each containing `sha`, `api`,
and `worker`: a full 40-hex revision plus two full immutable image refs. The helper emits a
deterministic plan, never invokes Docker and never contacts a registry. The plan stops ingress
first, requires schema compatibility review, selects prior refs, and gates restoring ingress on
authorized readiness evidence. It does not roll back schema or assume the first deployment has
a prior release. Kill planning targets cloudflared/API/worker, preserves the managed DB and secret
source, and requires any explicit migration operation to be quiescent. All plans require the
future owner gate; they are not executable deployment commands in this phase.

`staging:test` is offline and stdlib-only. `staging:verify` runs those tests, uses synthetic digest
refs and temporary nonfunctional secret fixtures, and invokes only Docker Compose version/config
rendering. It never builds, pulls, starts or deploys a staging container. It reports fixed markers
for zero host ports, zero local DB and plan checks; fixtures are removed in `finally`, including
failure. Rendered configuration is captured, never printed or persisted.

`pnpm staging:preflight` is for a later owner-authorized local release check. It takes the listed
non-secret inputs from process environment, requires a clean canonical checkout matching the
selected SHA, checks local secret files and renders Compose. It then inspects already-present
API/worker images by digest and requires matching RepoDigests, non-root users and OCI revision
labels. A missing image fails: there is no pull fallback. This does not verify protected-main
provenance, Access policy, DNS, provider directness, host firewall or the live endpoint. Those
remain evidence requirements in the exact live plan, not inferred authorization.

## Explicit migrations — Gate B only

The `migrate` service is excluded from normal startup by the `migration` profile and is not an
API dependency. Its command is `node dist/migrate.mjs apply` inside the same immutable API image.
The wrapper resolves the runtime DB file, enforces staging TLS policy, and invokes the existing
repo migration CLI. Schema and migration SQL are unchanged. The future authorized plan must
explicitly invoke this one-shot service and review its outcome; app restart does not invoke it.

Host recovery uses the approved immutable image refs, managed DB and independent secret source.
No canonical CRM data belongs on this replaceable host. Freeze the two-gate plan above, including
rollback by verified immutable refs or an explicit first-deploy no-op. Kill cloudflared first, then
API/worker with migration quiescent; preserve managed DB and secret source. Cleanup beyond that
requires explicit authorization. No repo verification performs live side effects.
