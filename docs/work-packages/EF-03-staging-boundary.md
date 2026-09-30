# EF-03 — Staging Boundary

Status: ACTIVE — REPO IMPLEMENTATION AUTHORIZED — LIVE PROVISIONING / IMAGE PUSH / DEPLOY GATE CLOSED

Authorized base:
`d3a9a2360072abe423fca1be8bf945214c2097a2`

Authorized branch:
`feat/ef-03-staging-boundary`

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
          -> inert drowk-worker
              -> Neon Postgres (direct TLS)
```

Compute vendor remains intentionally replaceable and is selected only at the live gate.

## Repo-owned implementation scope

Codex may implement only repository surfaces needed to make the staging bundle deterministic:
- `infra/staging/**`;
- `tooling/staging/**`;
- bounded API runtime support/tests for `DATABASE_URL_FILE` and staging TLS config;
- root package scripts;
- CI offline staging sensors inside existing `verify`;
- documentation/canon updates.

No new npm dependency is expected.

## Required implementation

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

This work package is active, but the live half is NOT.

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
- `pnpm harness:fast`;
- `pnpm harness:full`;
- `pnpm runtime:verify`;
- exact-head GitHub CI green;
- dependency/lockfile delta report;
- changed-file list;
- proof that no external mutation or image push happened.

## Live gate handoff

After repo implementation review passes, stop.

ChatGPT will construct an exact live staging plan with:
- compute provider/region/cost ceiling;
- Neon plan/region;
- Cloudflare hostname/Access policy/Tunnel;
- GitHub staging secret names;
- exact image/Git SHA;
- rollback/kill instructions;
- bounded smoke matrix.

Owner authorization must explicitly cover that live plan before any resource is created.

## Completion

EF-03 is not CLOSED/GREEN until the live staging proof and post-merge closure are completed.
