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

The replaceable Node HTTP adapter serves:

- `GET /health`: 200 process liveness, without contacting PostgreSQL.
- `GET /ready`: 200 only when PostgreSQL is reachable and the migration files
  exactly match a complete ledger; otherwise 503 with a generic `not_ready` body.
- `GET /operator/context`: protected, read-only proof of identity and active membership.

Startup does not connect to or migrate the database. Readiness takes a shared
migration lock, checks immutable history, and does not create tables. Connection
and SQL timeouts bound failed probes. Responses contain no SQL, credentials,
tenant records, provider details, or underlying database errors.

Run `pnpm verify` for local sensors. With the guarded disposable PostgreSQL
variables described in `packages/db/README.md`, `pnpm --filter @drowk/api test`
also checks pending/current/drifted readiness against a real database.

## DCRM-02A identity boundary

`createRuntime(config, verifier)` accepts an injected `PrincipalVerifier`; the
default denies every protected request unless Access is explicitly configured
as described below. A verifier must authenticate credentials before returning
an issuer + subject pair. Asserted email/display name never establish identity.

The caller must send exactly one `X-Drowk-Tenant-Id` UUID header. The application
looks up an existing identity and an ACTIVE membership on every request before
constructing context. There is no provisioning, role shortcut or membership cache.
Revocation committed before a lookup takes effect on that lookup; it cannot undo
an already completed authorization. No business data or mutation route is exposed.

The response contains only `tenantId`, `userId`, the user's persisted `actorId`,
and newly generated `runId` and `correlationId`. Client-supplied attribution is not
used. Failures are generic: 401 for failed authentication, 400 for an invalid tenant
selector, 403 for an unknown identity or inactive/missing membership, and 503 for
repository failure. Health/readiness bypass the verifier.

Compatibility: `RequestContext` now lives in `@drowk/contracts` and remains
re-exported from the API index. Consumers constructing it must provide the new
required `userId`; `ActorId` remains a separate persisted identity.

## DCRM-02B Cloudflare Access adapter

Set `AUTH_PROVIDER=cloudflare-access`, `CLOUDFLARE_ACCESS_ISSUER` to the exact
HTTPS team origin (for example `https://synthetic.cloudflareaccess.com`, no trailing
slash), and `CLOUDFLARE_ACCESS_AUDIENCE` to the application's AUD. Public keys are
loaded from the configured issuer's `/cdn-cgi/access/certs` endpoint using jose's
cached remote JWKS resolver with a three-second fetch timeout. No management API
or secret is required. Token-provided key URLs are never used.

Unset `AUTH_PROVIDER` or `AUTH_PROVIDER=none` denies all protected requests.
Unknown modes, partial configuration and Access settings without explicit provider
selection fail startup. Health/readiness bypass authentication; readiness does not
test JWKS availability. Key-fetch or JWT verification failures return generic 401.

Exactly one `Cf-Access-Jwt-Assertion` header is required. The adapter checks RS256,
signature, exact issuer, application audience, required expiry and subject,
not-before when present, and `type=app` when supplied. Cookies and bearer tokens
are not alternative inputs. Email/name are optional structural metadata; groups,
roles and organizations confer no authority. Existing issuer+subject bindings and
ACTIVE DROWK memberships remain mandatory. No DROWK session cookie is issued.

Synthetic tests use generated RSA keys and local JWKS; they need no Cloudflare
network access. The disposable PostgreSQL sensor proves changed subjects do not
rebind or provision identities and membership revocation still denies access.
There are no migrations or contract changes. Roll back by removing Access settings
and selecting `AUTH_PROVIDER=none`, or reverting this adapter change.
