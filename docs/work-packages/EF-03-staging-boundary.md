# EF-03 — Staging Boundary

Status: OPEN — REPO IMPLEMENTATION MERGED — LIVE STAGING GATE PENDING

Repo-owned implementation merged through PR #25, final feature head
`18f0acea9b20b223209661925f91737207420d48`.
Protected-main merge: `0137e4904758561611c2d3d504a459284657f64d`.
Post-merge CI `36718588406` was green for `verify` and `postgres-foundation`.
The old implementation branch was deleted. Feature branches are never long-lived deployment
authority; use an exact protected-main SHA and exact-head/post-merge CI evidence.
Full EF-03 remains OPEN because live staging proof has not happened.

Canonical runbook:
`docs/engineering/STAGING_BOUNDARY.md`

Research:
`docs/research/EF-03_STAGING_PROVIDER_REVALIDATION_2026-09-29.md`

## Purpose

Turn the EF-02 container boundary into a deterministic staging deployment boundary while keeping
all external mutations behind a separate owner gate.

## Frozen reference shape

```text
crm-staging.drowk.net
  -> Cloudflare Access
  -> Cloudflare Tunnel
      -> replaceable Docker host
          -> cloudflared
          -> drowk-api
              -> Neon Postgres (direct TLS)
          -> inert drowk-worker (no network)
```

Compute vendor remains intentionally replaceable and is selected only at the live gate.

## Merged repo-owned implementation scope

PR #25 implemented the repository surfaces needed to make the staging bundle deterministic:
- `infra/staging/**`;
- `tooling/staging/**`;
- bounded API runtime support/tests for `DATABASE_URL_FILE` and staging TLS config;
- root package scripts;
- CI offline staging sensors inside existing `verify`;
- documentation/canon updates.

No new npm dependency is expected.

## Preserved implementation contract

Follow `docs/engineering/STAGING_BOUNDARY.md`.

At minimum:
- staging Compose with API/worker/cloudflared and no host ports;
- immutable digest-ref inputs for all deployed images;
- no local DB in staging Compose;
- database secret file injection;
- tunnel token file injection;
- explicit Access config requirements;
- direct TLS PostgreSQL staging URL validation;
- migration as explicit one-shot operation only;
- rollback helper requiring previous digest refs;
- kill helper stopping external reachability without deleting managed DB;
- offline staging policy tests;
- metadata-only preflight;
- existing `verify` check includes staging sensors without renaming branch-protection checks.

## Hard boundary

The current correction is pre-live hardening and canon synchronization only. It includes the
approved PostgreSQL 16 service digest in CI and a deterministic staging regression sensor.
It authorizes no application/domain/schema edits or role split. The following live actions remain
closed unless separately authorized under the exact Gate A / Gate B plan below.

DO NOT:
- create Cloudflare resources;
- change DNS;
- create Access policies;
- create/retrieve Tunnel tokens;
- create Neon project/branch/credentials;
- create compute;
- create GitHub environment secrets;
- push images;
- deploy;
- call staging endpoints externally;
- change DB schema/migrations;
- enable provider/Gmail/outbound behavior;
- start EF-04/EF-05/EF-06/DCRM-06.

## Verification before live gate

Required:
- `git diff --check`;
- frozen install;
- `pnpm staging:test`;
- `pnpm staging:verify`;
- `pnpm harness:fast`;
- `pnpm harness:full`;
- `pnpm runtime:verify`;
- exact-head GitHub CI green;
- dependency/lockfile delta report;
- changed-file list;
- proof that no external mutation or image push happened.

For this bounded workflow/doc/sensor correction, run staging tests/verification and relevant
CI-safe harness checks. Report environment-blocked Docker checks without repairing Docker/WSL
or disk/Git maintenance; exact-head GitHub CI must establish the remaining CI evidence after push.
Required checks remain `verify` and `postgres-foundation`. No dependency/lockfile change is needed.

## Live gate handoff

Follow the [canonical two-gate runbook](../engineering/STAGING_BOUNDARY.md#live-gates--explicitly-closed).
Freeze the protected-main SHA/CI evidence, provider/resource/image names, regions, PostgreSQL 16,
Postgres-only plan/compute class/cost ceiling, hostname, identity-policy intent, direct TLS strategy,
secret source/path/UID/mode contract, migration, rollback/kill, smoke and abort/cleanup rules before
mutation. Provider-assigned outputs must never be invented or required before their creation.

**Gate A — RESOURCE / IDENTITY MATERIALIZATION:** explicit owner authorization may allow only
the minimum Neon staging project, Cloudflare Access app/owner policy and remotely managed Tunnel
identity if needed. Capture metadata-safe project ID/direct endpoint, Access issuer/audience and
Tunnel identity, then STOP for review. No Tunnel/DNS route, application compute, GHCR image push,
API/worker/cloudflared deploy, migration or live staging HTTP smoke is allowed in Gate A.

**Gate B — DEPLOY / PROOF:** requires accepted Gate A evidence and a new explicit owner authorization.
It may cover replaceable Linux compute, host secrets, exact protected-main builds, explicitly named
GHCR publication, resulting digest capture, package-read host authentication, deterministic
digest/revision validation and preflight, explicit one-shot migration, API/inert worker/cloudflared,
route publication after Access, smoke, rollback/no-op rollback, kill and desired-state restoration.
GHCR digests are generated after authorized Gate B push. Artifact identity failure stops before
deploy; OCI revisions must equal the selected protected-main SHA.

Before Gate B, freeze a least-privilege package-read identity, external credential source,
host storage/injection and noninteractive login/pull mechanism, plus rotation/revocation/removal.
Never assume anonymous private-package pull or print/commit a credential. Successful authenticated
pull does not authorize deploy. No real credential is created during this corrective work.

The first proof keeps a single direct-TLS `DATABASE_URL_FILE` credential shared by API and explicit
migration as a bounded FIRST-STAGING-PROOF exception, not a production security conclusion.
Current migrations have no separate runtime-role grant model; database/schema/table/sequence/function
ownership and migration-history access need separately reviewed design. No ad hoc provider grants
or new SQL are authorized. Known `-pooler` endpoints stay rejected; worker has no DB secret/network.
Never print/commit the credential. Revisit least privilege before production or materially expanded authority.

## Completion

EF-03 is not CLOSED/GREEN until the live staging proof and post-merge closure are completed.
