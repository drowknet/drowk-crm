# Database

PostgreSQL persistence boundary.

Expected responsibilities:
- forward-only migrations;
- schema ownership;
- repositories/query adapters;
- transaction helpers;
- tenant isolation helpers;
- idempotency/outbox primitives;
- append/supersede history;
- integration-test fixtures.

## First persistence slice

`PostgresRepositories` accepts a `pg` Pool (or a transaction client). Every
operation takes `tenantId` explicitly. The caller must authorize that tenant
scope before calling a repository method. Missing tenant-scoped reads return
`null`; PostgreSQL rejects cross-tenant parent links. SourceObservation append
returns `inserted`, `already_exists` for the same source identity/revision, or
`id_conflict` for an unrelated UUID collision. Other duplicate inserts raise
the PostgreSQL uniqueness error without overwriting the stored row.

`withTransaction(pool, async (repositories) => ...)` uses one client and rolls
back on failure. Keep external provider effects outside the callback.

For the integration sensor, apply `0001_foundation.sql` then
`0002_source_revision_identity.sql` to disposable PostgreSQL 16, set
`DROWK_TEST_DATABASE_URL` to a database ending in `_test` or `_ci`, set
`DROWK_TEST_DISPOSABLE=1`, and run `pnpm --filter @drowk/db test`. The sensor
inserts synthetic rows and requires a disposable database. Without the URL,
the integration test is skipped during ordinary workspace verification.

Rules:
- PostgreSQL is canonical storage infrastructure, not the domain layer;
- provider-native IDs never become canonical identity by database convenience;
- current projections must not destroy attributable history;
- migrations must be reviewable and testable;
- tenant isolation requires both application authorization and database defense.
