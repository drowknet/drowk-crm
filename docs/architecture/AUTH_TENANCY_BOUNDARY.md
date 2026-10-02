# Auth, Tenancy and Execution Identity Boundary

Status: FOUNDATION DESIGN

## Core distinction

These identities are separate:

```text
Tenant != User != Actor != Agent/Service Identity != Session != Run
```

Do not collapse them into one generic user/session field.

External operational identities are also separate from DROWK authentication identity.
A provider login, professional-network login or commercial mailbox may belong to the same
human without becoming interchangeable authority. See
[External Identity and Dependency Boundary](EXTERNAL_IDENTITY_DEPENDENCY_BOUNDARY.md).

Current owner-confirmed examples are intentionally distinct:
- LinkedIn / Sales Navigator login: `network-account@example.invalid`;
- Apollo account/connection: `provider-account@example.invalid`;
- legacy reference commercial Google Workspace domain: `tenant-workspace.example.invalid`.

The exact legacy reference mailbox/sender address is connector configuration and is not inferred from the
domain. None of these bindings, by itself, defines the DROWK User, tenant membership, CRM Person,
sending authority or infrastructure ownership.

## Tenant

A Tenant is a business/security/data boundary.

Tenant owns or scopes:
- CRM truth;
- evidence;
- connector configuration;
- policies;
- lexicon/taxonomy;
- budgets;
- provider permissions;
- tenant memberships and tenant-scoped authorization;
- Work;
- audit/access rules.

Initial reference migration may use reference tenant as a tenant, subject to actual data ownership and authorization.

## User / Actor

A User represents a DROWK-owned human identity. A User may be global across
multiple tenants; tenant access exists only through an explicit active membership.
An external auth identity maps to a User but never grants tenant access by itself.

An Actor may be:
- human user;
- service identity;
- system component.

Every material state mutation should preserve actor lineage.

## Agent / Service Identity

An AI agent, background worker or connector is not the human actor.

It requires its own:
- identity;
- granted capabilities;
- environment;
- tenant scope;
- budget;
- run/session lineage;
- audit.

Delegated work inherits only explicitly granted capabilities.

## Session

A Session proves continuity of an authenticated interaction after authentication. It is not itself identity proof.

Harvested prior art from invoice-builder demonstrated useful session isolation mechanics while explicitly lacking real account authentication. DROWK CRM must not repeat that mistake.

Session controls should include:
- cryptographically strong opaque session identifier;
- HttpOnly cookies for browser sessions;
- Secure in production;
- appropriate SameSite policy;
- expiration/rotation/revocation;
- CSRF strategy where applicable;
- tenant/user binding;
- server-side authorization recheck;
- no database/provider credentials exposed to browser storage.

## Run / Execution

A Run identifies one bounded execution:
- request;
- background job;
- research run;
- agent task;
- connector sync;
- cadence/action preparation.

Run identity supports correlation, cost, policy, retries and audit. A new retry/run does not become the same business action unless idempotency policy says so.

## Roles

Initial product roles are design placeholders:
- OWNER
- ADMIN
- OPERATOR
- RESEARCHER
- REVIEWER
- SERVICE

Do not implement role names as authority shortcuts without explicit permissions/policies.

## Authorization

Authorization must evaluate at least:
- tenant;
- actor;
- resource;
- action/capability;
- environment;
- policy;
- approval requirement.

Authentication success does not imply authorization to:
- read another tenant;
- call provider write tools;
- send email;
- merge identity;
- change policy;
- deploy;
- access secrets.

## Cloudflare Access

Cloudflare Access may be used initially as an outer gate for internal/alpha surfaces such as:
- crm.drowk.net;
- admin.drowk.net;
- staging environments.

It does not eliminate the need for application-level tenant/user authorization when DROWK CRM becomes multi-user/multi-tenant.

## Tenant isolation tests

Before multi-tenant production, executable tests must prove:
- tenant A cannot query tenant B records;
- IDs from another tenant do not bypass scope;
- background jobs preserve tenant context;
- caches do not cross tenant boundaries;
- evidence/provider runs remain tenant-scoped;
- audit records preserve actual actor/tenant;
- admin/service capability elevation is explicit and traceable.

## Recovery ownership

DROWK platform ownership must not depend on one employer email or one browser session.

Production ownership should eventually use:
- DROWK-controlled domain identities;
- MFA/passkeys;
- recovery path;
- secondary administrative recovery identity;
- managed secrets;
- documented owner transfer/recovery procedures.
