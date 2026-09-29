# Authentication / Session Provider Revalidation — 2026-09-27

Status: CURRENT RESEARCH INPUT FOR DCRM-02B

## Purpose

Revalidate the next authentication/session step after DCRM-02A without letting an
external identity product become DROWK CRM tenant authority.

DCRM-02A already owns:
- DROWK UserId;
- external identity mapping by issuer + subject;
- tenant membership ACTIVE/REVOKED;
- explicit tenant selection;
- application-level membership validation;
- protected request context.

The question for DCRM-02B is therefore narrower: what should authenticate the
first real alpha operator session and produce a verifiable external principal?

## Non-negotiable DROWK constraints

Any provider must fit behind the existing PrincipalVerifier boundary.

Provider output may authenticate a principal. It may not:
- create a DROWK tenant implicitly;
- create a DROWK user implicitly;
- create/reactivate a DROWK tenant membership implicitly;
- make email, domain, provider organization or provider role canonical authority;
- bypass the DROWK membership lookup;
- become CRM system of record.

## Current official-source findings

### Cloudflare Access

Official Cloudflare One documentation revalidated on 2026-09-27 shows that Access
places a signed application JWT on authenticated requests, supports application and
policy session durations, and can enforce MFA at the edge.

The application token exposes standard claims such as issuer, audience, subject,
expiry/not-before and identity metadata. Cloudflare recommends origin-side JWT
validation and exposes the assertion in the `Cf-Access-Jwt-Assertion` header.

Sources:
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
- https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/session-management/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/mfa-requirements/

DROWK consequence:
Cloudflare email and custom claims remain metadata. DROWK maps verified Access
issuer + subject into `auth_identities` and re-checks local tenant membership on
every protected request.

### WorkOS AuthKit

Current AuthKit documentation provides managed sessions, users, organizations,
organization memberships, SSO/SCIM and role/permission capabilities. It also
supports JIT/domain and directory-driven membership flows when enabled.

Sources:
- https://workos.com/docs/authkit/sessions
- https://workos.com/docs/authkit/users-organizations
- https://workos.com/docs/authkit/roles-and-permissions

DROWK consequence:
WorkOS remains a strong later B2B identity candidate, but its user/organization
semantics must not replace DROWK tenant/membership authority. DROWK must not adopt
email uniqueness or automatic membership as canonical identity policy.

### Clerk

Current Clerk documentation uses signed session JWTs and supports backend token
verification, including issuer/audience/authorized-party checks and local public-key
verification.

Sources:
- https://clerk.com/docs/guides/sessions/session-tokens
- https://clerk.com/docs/reference/backend/authenticate-request
- https://clerk.com/docs/guides/sessions/manual-jwt-verification

DROWK consequence:
Clerk fits the PrincipalVerifier shape but would add a new managed identity vendor
before the alpha runtime/deployment path is proven.

### Auth0

Current Auth0 documentation supports Authorization Code Flow, Organizations,
organization-aware login and configurable session/refresh-token behavior.

Sources:
- https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow/add-login-auth-code-flow
- https://auth0.com/organizations
- https://support.auth0.com/center/s/article/Refresh-token-and-session-management

DROWK consequence:
Auth0 remains a valid later enterprise option, but Auth0 Organizations must remain
external authentication/access context rather than DROWK tenant truth.

### Better Auth

Current Better Auth documentation provides server-side cookie sessions and an
optional organization plugin with member/role tables.

Sources:
- https://better-auth.com/docs/concepts/session-management
- https://better-auth.com/docs/plugins/organization

DROWK consequence:
Its base session model is compatible with a self-owned path, but adopting its
organization plugin now would duplicate DROWK tenant/membership state.

### Keycloak

Current Keycloak documentation remains a self-hosted IAM option with persistent
user sessions enabled by default in current releases and configurable session/
refresh-token behavior.

Sources:
- https://www.keycloak.org/docs/latest/release_notes/
- https://www.keycloak.org/docs/latest/server_admin/

DROWK consequence:
Keycloak offers infrastructure control but adds an operational surface that is not
justified for the first alpha operator gate.

## DCRM-02B decision

For the first controlled alpha, use **Cloudflare Access as the external authenticator
and session edge**, not as CRM authority.

Reasons:
1. `crm.drowk.net` already targets Cloudflare as the edge namespace.
2. Access provides signed principal JWTs and managed login/session/MFA without
   introducing a second application-auth database.
3. DCRM-02A already keeps tenant membership and authorization inside DROWK.
4. The provider remains replaceable behind PrincipalVerifier.
5. No live CRM business mutation exists yet, so a second application-issued browser
   session would add complexity without current value.

The application must still validate the Access JWT itself. Edge admission alone is
not application authentication.

## Explicitly deferred

This decision does not select the eventual customer-facing multi-tenant identity
platform. Before external tenant onboarding, re-evaluate WorkOS/Auth0/Clerk/
Better Auth/Keycloak and then-current alternatives against:
- enterprise SSO/SCIM;
- passkeys/MFA;
- audit/recovery;
- multi-organization behavior;
- pricing/operational burden;
- data residency/compliance;
- provider exit/migration strategy.

No provider-managed organization or role is DROWK authorization by default.
