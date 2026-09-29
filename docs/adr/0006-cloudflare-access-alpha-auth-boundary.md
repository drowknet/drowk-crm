# ADR-0006 — Cloudflare Access as Alpha External Authenticator

Status: ACCEPTED FOR DCRM-02B ALPHA BOUNDARY
Date: 2026-09-27

## Context

DCRM-02A established provider-neutral application identity and tenant authorization:
external issuer + subject -> DROWK user -> explicit active tenant membership ->
RequestContext.

The first real alpha operator session now needs an authenticator, but DROWK must
not collapse external authentication into tenant authority.

## Decision

Use Cloudflare Access for the initial controlled DROWK CRM alpha authentication
boundary.

Cloudflare Access owns only:
- interactive external authentication at the edge;
- its own external session lifecycle;
- MFA/access policy at the edge;
- signed application JWT issuance.

DROWK CRM owns:
- mapping verified `iss + sub` to an existing DROWK user;
- all tenant memberships;
- tenant selection;
- application authorization;
- RequestContext/run/correlation identity;
- CRM data and policy.

## Required verification

The API must validate the `Cf-Access-Jwt-Assertion` application token and fail
closed unless all required properties are valid:
- RS256 signature from the configured Access JWKS;
- exact configured issuer;
- configured application audience;
- token time validity;
- application-token type where present;
- non-empty subject.

Email and custom claims are metadata only.

A new or changed Access subject does not provision or rebind anything automatically.
It resolves as an unknown external identity until an explicit DROWK identity-binding
operation occurs outside the request path.

## Session boundary

For the alpha, DROWK does not issue a second browser session on top of Access.

Each protected request:
1. receives an Access assertion;
2. verifies it;
3. resolves the existing DROWK auth identity;
4. validates the requested tenant's active membership;
5. creates a fresh bounded RequestContext.

Before any browser endpoint introduces state-changing business operations, the
application must explicitly design and test CSRF/same-origin protections appropriate
to the final UI/BFF topology.

## Non-goals

This ADR does not:
- configure a Cloudflare Access application remotely;
- create Access policies;
- deploy `crm.drowk.net`;
- select the eventual external-customer identity platform;
- trust Access email/domain/groups as DROWK authorization;
- add automatic user or membership provisioning.

## Reversibility

The existing PrincipalVerifier boundary remains provider-neutral. Replacing Access
later should require a new verifier adapter rather than changing DROWK user/tenant
semantics.
