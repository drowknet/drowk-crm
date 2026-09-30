# EF-03 staging bundle — repository phase only

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
The protected-main SHA and API/worker immutable registry digest refs must be selected together at
the live gate. Tags alone are rejected. No automatic image lookup or pull exists in these tools.

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

## Explicit migrations — later live gate only

The `migrate` service is excluded from normal startup by the `migration` profile and is not an
API dependency. Its command is `node dist/migrate.mjs apply` inside the same immutable API image.
The wrapper resolves the runtime DB file, enforces staging TLS policy, and invokes the existing
repo migration CLI. Schema and migration SQL are unchanged. The future authorized plan must
explicitly invoke this one-shot service and review its outcome; app restart does not invoke it.

Host recovery uses the approved immutable image refs, managed DB and independent secret source.
No canonical CRM data belongs on this replaceable host. The live gate must also freeze provider,
region, cost ceiling, protected-main SHA, identity policy, registry push scope, secret source,
rollback refs, kill procedure and exact permitted smoke requests.
