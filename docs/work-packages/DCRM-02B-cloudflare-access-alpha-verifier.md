# DCRM-02B — Cloudflare Access Alpha Verifier

Status: READY FOR IMPLEMENTATION
Parent: `foundation/drowk-crm-00`
Decision: `docs/adr/0006-cloudflare-access-alpha-auth-boundary.md`

## Objective

Implement the first real external-authentication adapter behind the provider-neutral
DCRM-02A PrincipalVerifier boundary, using Cloudflare Access JWT assertions.

This slice proves:

`verified Access JWT -> ExternalPrincipal -> existing DROWK identity -> ACTIVE tenant membership -> RequestContext`

No Cloudflare remote configuration or deployment is allowed in this work package.

## Provider adapter

Implement the smallest replaceable Cloudflare Access verifier.

Input:
- HTTP request;
- `Cf-Access-Jwt-Assertion` header.

Required validation:
- token is present exactly where the adapter expects it;
- algorithm is RS256;
- signature validates against the configured Access JWKS/key source;
- issuer exactly matches configured Access issuer;
- audience contains the configured Access application AUD;
- expiry and not-before are valid;
- token type is `app` when supplied;
- `sub` is a non-empty string.

Output:
- provider-neutral `ExternalPrincipal`;
- `issuer` from validated JWT issuer;
- `subject` from validated `sub`;
- email/display metadata only when present and structurally valid.

Do not put Cloudflare JWT types into `@drowk/contracts`.

## Authorization invariants

After verifier success, preserve the DCRM-02A flow unchanged:
1. resolve exact issuer + subject;
2. require existing DROWK user;
3. require explicitly selected tenant;
4. require ACTIVE DROWK membership;
5. construct RequestContext.

Never:
- authorize from email/domain;
- authorize from Access custom groups/roles;
- auto-create a DROWK user;
- auto-bind a new external identity;
- auto-create/reactivate a tenant membership;
- bypass membership because Access allowed the request.

A changed/new Access `sub` must fail as unknown identity until explicitly bound.

## Runtime configuration

Add only the minimum environment configuration required by the adapter:
- auth mode/provider selector if needed;
- expected Access issuer/team domain;
- expected Access application audience;
- JWKS URL or equivalent key source.

Configuration must fail closed. Missing/invalid auth configuration may not silently
open the protected endpoint.

No secrets belong in source. Access public signing keys/JWKS are not secrets.

## Dependency rule

Prefer a small standards-focused JWT/JWK library such as `jose` rather than a
Cloudflare control-plane SDK.

The adapter must not call Cloudflare management APIs.

Tests must not require live Cloudflare network access.

## Sensors

Deterministic/synthetic sensors must prove:

1. valid synthetic RS256 Access-style JWT with correct issuer/audience/sub authenticates;
2. wrong issuer fails;
3. wrong/missing audience fails;
4. expired token fails;
5. not-before token fails before validity;
6. invalid signature fails;
7. non-RS256/unexpected algorithm fails;
8. missing/empty subject fails;
9. email/custom claims never grant tenant access;
10. valid Access principal with unknown issuer+subject returns forbidden through the
   existing DROWK authorization flow and creates no records;
11. changed Access subject does not silently rebind an existing DROWK user;
12. revoked/missing tenant membership still denies immediately;
13. `/health` and `/ready` remain outside application auth behavior;
14. default/no-provider runtime remains deny-all unless explicitly configured;
15. existing migrations, persistence, tenant-isolation and DCRM-02A authorization
   sensors remain green.

## Out of scope

- Cloudflare API/Terraform/dashboard changes;
- DNS/Tunnel creation;
- deployment;
- real Access credentials or tenant data;
- WorkOS/Auth0/Clerk/Better Auth/Keycloak integration;
- browser UI;
- DROWK-owned session table/cookie;
- business CRM HTTP endpoints;
- roles/permissions expansion;
- Gmail;
- outbound actions.

## Completion contract

Codex must:
- work only on the dedicated DCRM-02B feature branch;
- preserve the existing DCRM-02A application authorization boundary;
- run workspace verify plus all available synthetic/PostgreSQL sensors;
- use GitHub Actions as the authoritative clean-install/integration sensor when the
  local Windows/exFAT environment cannot reproduce it;
- do not use Docker, Docker Desktop, WSL or local containers for this WP;
- do not repair Docker/Windows/node_modules/Corepack/WMIC/filesystem permissions as part of this WP;
- commit and push;
- report branch, final SHA, files changed, tests/sensors, CI and unresolved findings;
- do not merge or deploy.
