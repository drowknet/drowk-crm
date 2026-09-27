# DCRM-01C — Migration Runner and Runtime Readiness Shell

Status: GREEN / CLOSED
Parent: `foundation/drowk-crm-00`

## Objective

Turn the green PostgreSQL foundation into a repeatable runtime bootstrap without
introducing auth, Gmail, queues, ORM, or a public mutation API.

This slice owns two things only:

1. a deterministic PostgreSQL migration runner;
2. a minimal API runtime shell with health/readiness probes.

## Migration runner

Implement the smallest auditable runner for `packages/db/migrations/*.sql`.

Required behavior:
- discover migrations in lexical order;
- apply each migration at most once;
- persist migration filename/version and SHA-256 checksum;
- refuse to continue if an already-applied migration's checksum changed;
- use a PostgreSQL advisory lock so two runners cannot migrate concurrently;
- fail closed on partial/failed migration;
- expose plan/status/apply commands;
- no destructive rollback command;
- no production credentials in source.

The runner must work with the existing forward-only `0001` and `0002`
migrations without rewriting them.

## Runtime shell

Use Node 22 and keep the HTTP layer replaceable.

Expose only:
- `GET /health` — process liveness, no database dependency;
- `GET /ready` — database connectivity plus migration status/currentness.

Do not expose business mutation endpoints in this slice.

The readiness response must not leak connection strings, credentials, raw SQL,
tenant data, or provider details.

## Configuration

Runtime configuration comes from environment variables.

Required:
- `DATABASE_URL` for runtime database connectivity;
- explicit environment/runtime name where needed.

Do not add secrets to repository files.

## Sensors

Disposable PostgreSQL tests must prove:
1. fresh database -> plan shows pending migrations;
2. apply runs 0001 then 0002 successfully;
3. second apply is idempotent/no-op;
4. migration ledger contains exact filename/version + SHA-256;
5. changed checksum for an already-applied migration is rejected;
6. concurrent runner lock prevents overlapping application;
7. failed migration does not advance the ledger;
8. `/health` is healthy without DB access;
9. `/ready` is healthy only when DB is reachable and migrations are current;
10. `/ready` fails closed when DB is unavailable or migrations are pending;
11. existing repository persistence and tenant-isolation sensors remain green.

## Out of scope

- auth/session provider;
- tenant selection UI;
- business CRUD HTTP endpoints;
- Gmail OAuth/API;
- AIsa/JEV;
- background jobs;
- DBOS/pg-boss;
- RLS adoption;
- deployment;
- production database.

## Completion contract

Codex must:
- work on a dedicated feature branch created from current foundation;
- run workspace verify and disposable PostgreSQL sensors;
- commit and push;
- report branch + commit SHA + test results;
- do not merge or deploy.


## Closure evidence

Merged through PR #3 into `foundation/drowk-crm-00`.

Verified:
- deterministic plan/status/apply migration runner;
- filename/version/SHA-256 migration ledger;
- advisory-lock concurrency protection;
- fail-closed checksum/history behavior;
- atomic failed-migration rollback without ledger advancement;
- minimal Node 22 `/health` and `/ready` runtime shell;
- generic non-leaking readiness failures;
- disposable PostgreSQL integration sensors;
- post-merge CI success at merge commit
  `9a2ba52ca640c8a94cc37b3df376ea26d7ff8db0`.

Next work package:
`docs/work-packages/DCRM-02A-identity-membership-context.md`.
