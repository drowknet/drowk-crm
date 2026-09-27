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
returns `inserted`, `already_exists` for the same source identity/revision and
fingerprint, `fingerprint_conflict` for changed source state at the same revision,
or `id_conflict` for an unrelated UUID collision. Other duplicate inserts raise
the PostgreSQL uniqueness error without overwriting the stored row.

`withTransaction(pool, async (repositories) => ...)` uses one client and rolls
back on failure. Keep external provider effects outside the callback.

For the integration sensor, use the migration runner below on disposable PostgreSQL 16, set
`DROWK_TEST_DATABASE_URL` to a database ending in `_test` or `_ci`, set
`DROWK_TEST_DISPOSABLE=1`, and run `pnpm --filter @drowk/db test`. The sensor
inserts synthetic rows and requires a disposable database. Without the URL,
the integration test is skipped during ordinary workspace verification.

## Migration runner

Build the workspace with `pnpm build`, then set `APP_ENV` and `DATABASE_URL`
for the intended database. Available commands:

```text
pnpm --filter @drowk/db migrate plan
pnpm --filter @drowk/db migrate status
pnpm --filter @drowk/db migrate apply
```

`plan` and `status` are read-only and return the same JSON report, including
`current` and each migration's applied/pending state. Pending migrations do not
make those commands exit unsuccessfully. Invalid history, checksum drift, lock
contention, and database failures exit nonzero. `apply` reports applied filenames;
repeating it on a current database returns an empty list.

Files use `NNNN_name.sql` names with unique four-digit versions and execute in
lexical order. The global `public.drowk_schema_migrations` ledger records filename,
version, raw file SHA-256, and application time. Package the SQL directory alongside
`dist`; deploy identical file bytes. Git attributes keep SQL checkouts at LF.
Missing files, changed checksums, and history that is not a prefix of the files
are rejected. Existing manually migrated databases are not silently adopted.

One checked-out PostgreSQL session holds an advisory lock for the entire apply.
Read-only status uses a shared lock and refuses to report current during an apply.
Each migration and its ledger entry commit atomically; earlier successful migrations
remain recorded if a later migration fails. The existing `0002` transaction wrapper
is removed only in memory. Other transaction control is rejected so SQL cannot
commit ahead of its ledger entry. No applied SQL file is rewritten.

There is no rollback command. Recovery uses a corrected unapplied migration or a
new forward migration after inspecting the failure. If a commit response is lost,
inspect the ledger before retrying; it remains the durable record of application.

The additional integration sensors create temporary databases under the guarded
disposable test server and remove only those generated databases. The test user
therefore needs database creation rights. They prove exact ledger checksums,
idempotence, lock contention, drift rejection, and rollback of failed wrapped DDL.

Rules:
- PostgreSQL is canonical storage infrastructure, not the domain layer;
- provider-native IDs never become canonical identity by database convenience;
- current projections must not destroy attributable history;
- migrations must be reviewable and testable;
- tenant isolation requires both application authorization and database defense.

## Identity and membership

Migration `0003_identity_membership.sql` adds global `users` and `auth_identities`
plus tenant-scoped `tenant_memberships`. It creates no users or tenant data and
does not modify earlier migrations. `PostgresIdentityRepository` accepts a pool
or transaction client. Users receive application-generated user and actor UUIDs.
The unique external identity key is `(issuer, subject)`; duplicate binds raise a
uniqueness error without overwriting even when email metadata matches.

Membership create/read/revoke/active resolution all require tenant + user. Creation
and the first revocation retain actor, run, correlation and policy attribution.
Repeated revocation preserves its first timestamp and audit; reactivation is not
supported in this slice. Provisioning methods are internal persistence operations,
not HTTP capabilities; callers must separately authorize any use.

Rollback path: revert the application slice to disable the protected route and
leave the additive tables and historical records intact. Applied migrations are
never edited or reversed; any schema correction requires a new forward migration.
