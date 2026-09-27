# DCRM-02A — Identity, Membership, and Authorization Context

Status: READY FOR IMPLEMENTATION
Parent: `foundation/drowk-crm-00`

## Objective

Establish the application-level human identity and tenant-membership boundary before
any CRM business data is exposed over HTTP.

This slice proves:

`external authenticated principal -> DROWK user -> active tenant membership -> request context`

It intentionally does not choose or integrate a production auth vendor yet.

## Core rules

- Tenant != User != Actor != Session != Run.
- Email is an attribute, not a stable identity key.
- An external auth subject never becomes a tenant/user record by implication.
- Tenant selection is explicit and must be checked against active membership.
- Authentication success does not imply authorization.
- No role label may act as an authority shortcut in this slice.
- Health/readiness remain available without application authentication.
- No CRM business mutation endpoint is introduced.

## Contracts

Add the minimum provider-neutral contracts needed for:
- DROWK `UserId`;
- external authenticated principal: issuer + subject, with optional asserted profile fields;
- tenant membership status;
- authenticated request identity/context.

Keep `ActorId`, `TenantId`, `RunId`, and `CorrelationId` distinct.

## PostgreSQL

Add a forward-only migration after `0002` with the minimum tables required for:

### users
- DROWK-owned human user identity;
- generated/application UUID;
- optional display/profile fields;
- recorded timestamp.

### auth_identities
- maps a provider-neutral `issuer + subject` pair to one DROWK user;
- issuer + subject must be unique;
- email, when stored, is metadata only and must not be used as the unique identity key;
- no provider access token/refresh token/session secret in this table.

### tenant_memberships
- links a user to a tenant;
- explicit ACTIVE / REVOKED state;
- tenant-consistent lookup;
- revocation must immediately remove authorization in the resolver;
- no implicit tenant creation or membership creation during request handling.

Do not add production users or tenant data in migrations/fixtures.

## Persistence boundary

Implement narrow repository methods for:
- create/read user;
- bind/read external auth identity;
- create/read/revoke tenant membership;
- resolve an active membership by tenant + user.

All tenant-owned reads/writes must carry explicit tenant scope.

Duplicate issuer+subject binding must fail closed if it points at a different DROWK user.

## API authorization boundary

Keep the auth provider replaceable through an injected verifier interface.

The verifier returns a provider-neutral principal. The application then:
1. resolves issuer + subject to an existing DROWK user;
2. resolves the explicitly requested tenant;
3. requires an ACTIVE membership for that user in that tenant;
4. creates a `RequestContext` with distinct tenant/actor/run/correlation identities;
5. only then calls the protected handler.

Use an explicit tenant selector header for this internal boundary, but never trust it
without membership validation.

Expose one protected read-only proof endpoint:

- `GET /operator/context`

It may return only bounded non-sensitive context needed to prove the boundary.
Do not expose business CRM records in DCRM-02A.

`GET /health` and `GET /ready` remain unchanged and do not require this verifier.

## Sensors

Synthetic/unit and disposable-PostgreSQL sensors must prove:

1. issuer+subject resolves to the intended DROWK user;
2. email is not sufficient to resolve identity;
3. duplicate issuer+subject cannot bind to a different user;
4. active tenant membership authorizes the protected context endpoint;
5. authenticated user without membership is denied;
6. tenant A membership cannot select/read tenant B context;
7. revoked membership is denied immediately;
8. unknown external principal is denied without creating user/membership records;
9. malformed/missing tenant selector is denied;
10. verifier failure returns a generic auth failure without leaking internals;
11. `/health` still does not contact auth or DB;
12. `/ready` behavior from DCRM-01C remains intact;
13. existing migration, repository, and tenant-isolation sensors remain green.

## Out of scope

- choosing Auth0/Clerk/Supabase/Auth.js/Cloudflare Access or another production auth vendor;
- browser session cookies;
- OAuth callback flows;
- password storage;
- MFA/passkeys;
- role-based shortcuts;
- business Account/Facility/Contact HTTP endpoints;
- UI;
- Gmail;
- provider tokens/secrets;
- deployment.

## Completion contract

Codex must:
- work only on the dedicated DCRM-02A feature branch;
- run workspace verify plus disposable PostgreSQL sensors;
- commit and push;
- report branch, commit SHA, files changed, tests/sensors, and unresolved findings;
- do not merge or deploy.
