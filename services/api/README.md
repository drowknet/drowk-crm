# Domain API

The Domain API will expose canonical CRM operations while enforcing:
- tenant scope;
- data contracts;
- policy;
- identity rules;
- audit logging;
- idempotency;
- versioning.

External providers must not write canonical tables directly.

## DCRM-01C runtime shell

Use Node 22. Run `pnpm build`, set `APP_ENV` and `DATABASE_URL`, then start with
`pnpm --filter @drowk/api start`. `HOST` defaults to `127.0.0.1`; `PORT` defaults
to `8000`. Configuration is read from the process environment; no dotenv loader
or provider SDK is installed. Apply migrations separately with the DB runner.

The replaceable Node HTTP adapter serves only:

- `GET /health`: 200 process liveness, without contacting PostgreSQL.
- `GET /ready`: 200 only when PostgreSQL is reachable and the migration files
  exactly match a complete ledger; otherwise 503 with a generic `not_ready` body.

Startup does not connect to or migrate the database. Readiness takes a shared
migration lock, checks immutable history, and does not create tables. Connection
and SQL timeouts bound failed probes. Responses contain no SQL, credentials,
tenant records, provider details, or underlying database errors.

Run `pnpm verify` for local sensors. With the guarded disposable PostgreSQL
variables described in `packages/db/README.md`, `pnpm --filter @drowk/api test`
also checks pending/current/drifted readiness against a real database.
