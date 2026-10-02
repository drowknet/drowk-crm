# External Identity and Dependency Boundary

Status: CANONICAL OPERATING BOUNDARY

Owner-confirmed operational bindings: 2026-09-30.

## Purpose

DROWK must not collapse a human operator, a provider login, a professional-network login,
a commercial sending identity or infrastructure ownership into one generic email identity.

These are separate concerns:

```text
DROWK User / Actor
!= external provider account
!= professional-network login
!= commercial communication identity
!= infrastructure/service identity
!= CRM Person / Identity
```

A shared human owner does not make the credentials, permissions, authority or failure domains
interchangeable.

## Current owner-confirmed external bindings

The following bindings are operational facts, not canonical identity equivalence:

| Surface | Current identity/binding | Intended role |
|---|---|---|
| LinkedIn / Sales Navigator | `network-account@example.invalid` | owner access to LinkedIn and professional-network evidence |
| Apollo | `provider-account@example.invalid` | current Apollo account/connection used for prospecting-provider access |
| Tenant Google Workspace / Gmail | `tenant-workspace.example.invalid` | PWM commercial communication domain and future Gmail evidence/outbound channel |

The exact PWM mailbox/sender address is not frozen in this document because it has not been
specified here. Do not infer or invent a local-part from the domain.

These bindings may change. Changes require connector/provider configuration updates and audit;
they do not redefine the DROWK User, canonical CRM Person, or tenant ownership model.

## Non-equivalence rules

1. Apollo account identity does not establish the LinkedIn login identity.
2. LinkedIn login identity does not establish the tenant sending identity.
3. tenant Gmail/Workspace identity does not establish DROWK authentication or infrastructure ownership.
4. Matching the same human across external services requires explicit attributable evidence/configuration;
   email equality or operator knowledge must not be silently converted into canonical CRM identity.
5. A provider login never grants another provider's capabilities.
6. A READ-capable provider connection never grants SEND/WRITE authority merely because the provider
   also supports outbound workflows.
7. The account used to call a provider is not automatically the sender identity for a commercial action.

## tenant Gmail is a business-channel adapter, not a platform root of trust

`tenant-workspace.example.invalid` is a tenant business communication dependency. It must not become a
structural dependency for the DROWK platform.

Loss, revocation or outage of the PWM Google Workspace should be allowed to degrade only the
capabilities that actually depend on that Workspace, for example:

```text
tenant Gmail READ / sync        -> unavailable or degraded
tenant Gmail DRAFT / SEND       -> unavailable
mail reconciliation         -> pending/retryable under policy
```

It must not, by itself, make the following unavailable:

- DROWK application authentication/tenant authorization;
- PostgreSQL canonical business state;
- DROWK API or durable worker infrastructure;
- staging/deployment control;
- Cloudflare/Neon/DigitalOcean/GitHub infrastructure administration;
- Apollo research access;
- AIsa research/provider access;
- JEV/model judgment capability;
- preserved LinkedIn export/evidence;
- non-Gmail research and provider workflows.

No Google Workspace session, mailbox token or PWM-domain identity may be reused as an implicit
infrastructure credential or recovery root.

## Infrastructure ownership

Core DROWK infrastructure must use independently managed identities and secrets appropriate to
the service being controlled.

Provider/service credentials must be independently revocable and replaceable. Revoking one
business-channel connector must not require rotating unrelated infrastructure or research-provider
credentials.

DROWK recovery ownership must not depend on one employer/business email, one browser session, or
one provider account.

## Connector and provider bindings

Each connector/provider binding should preserve, where applicable:

- tenant;
- provider/service;
- provider account or workspace reference;
- capability;
- READ/WRITE class;
- environment;
- credential reference, never the credential value;
- source/channel identity where relevant;
- allowed sending identity where relevant;
- ownership/recovery metadata;
- last validation/revocation state;
- run/audit lineage.

Credentials and OAuth/session material remain external secrets and must never be committed.

## Communication-channel identity

A future outbound action must select its communication identity explicitly.

At minimum, an externally visible action should be attributable to:

- tenant;
- channel/provider;
- exact sender/channel identity;
- exact recipient/target;
- exact action;
- payload/body digest where applicable;
- policy version;
- approval/authority;
- ActionAttempt/run lineage;
- live-state recheck before dispatch when required.

Never infer the sender from:
- the Apollo login;
- the LinkedIn login;
- the DROWK authenticated user email;
- the provider used for research;
- the fact that the same human owns several accounts.

## Provider-specific consequences

### Apollo

The current Apollo connection is associated with `provider-account@example.invalid`.

This is a provider-account binding only. It does not:
- become the PWM commercial sender;
- establish the owner's LinkedIn identity;
- authorize Apollo WRITE/SEND capabilities;
- become canonical CRM identity.

`APOLLO_READ != APOLLO_WRITE` remains mandatory.

### LinkedIn

The current LinkedIn / Sales Navigator login is `network-account@example.invalid`.

LinkedIn-derived data remains professional-network evidence subject to source provenance,
freshness, rights and identity review. The login email must not be treated as the universal
commercial contact or sending identity.

### Tenant Google Workspace / Gmail

The PWM business communication domain is `tenant-workspace.example.invalid`.

The exact mailbox is connector configuration, not platform identity. Gmail capabilities must be
separately authorized:

```text
GMAIL_READ != GMAIL_DRAFT != GMAIL_SEND
```

A Gmail connector outage or revocation must fail closed for Gmail-dependent actions without
taking down unrelated DROWK capabilities.

## Design consequence

No schema migration is authorized merely by this document.

When executable provider/channel-account bindings are introduced, their model must preserve the
distinctions above rather than encoding one generic email field as user, provider account,
sender, CRM identity and infrastructure owner at the same time.
