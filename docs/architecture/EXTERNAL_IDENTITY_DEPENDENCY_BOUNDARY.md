# External Identity and Dependency Boundary

Status: CANONICAL OPERATING BOUNDARY

## Purpose

DROWK must not collapse a human operator, a provider login, a professional-network login,
a commercial sending identity, or infrastructure ownership into one generic identity.

These are separate concerns:

```text
DROWK User / Actor
!= external provider account
!= professional-network login
!= commercial communication identity
!= infrastructure/service identity
!= CRM Person / Identity
```

A shared human owner does not make credentials, permissions, authority, or failure domains
interchangeable.

## Binding model

A deployment may bind multiple external services to one tenant. Those bindings are configuration,
not canonical identity equivalence.

Example placeholders:

| Surface | Example binding | Intended role |
|---|---|---|
| professional network | `network-account@example.invalid` | professional-network evidence |
| prospecting provider | `provider-account@example.invalid` | research/provider access |
| tenant messaging workspace | `tenant-workspace.example.invalid` | tenant communication channel |

Real account identifiers belong in deployment configuration or secret-backed administration,
not in the public repository.

## Non-equivalence rules

1. One provider account does not establish another provider's login identity.
2. A professional-network login does not establish a tenant sending identity.
3. A tenant messaging identity does not establish DROWK authentication or infrastructure ownership.
4. Matching the same human across external services requires attributable evidence/configuration.
5. A provider login never grants another provider's capabilities.
6. READ capability never implies WRITE or SEND authority.
7. The account used for research is not automatically a sender identity.

## Business-channel adapters are not platform roots of trust

A tenant messaging workspace is a business-channel dependency, not a structural DROWK dependency.

Loss or revocation of a tenant messaging connector should degrade only capabilities that depend on
that connector.

It must not, by itself, make the following unavailable:

- DROWK application authentication and tenant authorization;
- PostgreSQL canonical business state;
- API or worker infrastructure;
- staging/deployment control;
- unrelated research providers;
- preserved evidence;
- non-messaging workflows.

No tenant mailbox token or business-domain identity may be reused as an implicit infrastructure
credential or recovery root.

## Infrastructure ownership

Core infrastructure must use independently managed identities and secrets appropriate to each
service.

Provider credentials must be independently revocable and replaceable. Revoking one connector must
not require rotating unrelated infrastructure or provider credentials.

Recovery ownership must not depend on one employer/business email, one browser session, or one
provider account.

## Connector and provider bindings

Each binding should preserve, where applicable:

- tenant;
- provider/service;
- provider account or workspace reference;
- capability;
- READ/WRITE class;
- environment;
- credential reference, never the credential value;
- source/channel identity;
- allowed sending identity;
- ownership/recovery metadata;
- validation/revocation state;
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
- live-state recheck when required.

Never infer the sender from the provider used for research, the authenticated user email, or the
fact that one human owns several external accounts.

## Capability separation

Provider-specific capabilities remain independently authorized.

Examples:

```text
PROVIDER_READ != PROVIDER_WRITE
GMAIL_READ != GMAIL_DRAFT != GMAIL_SEND
```

Connector outage or revocation must fail closed for affected capabilities without taking down
unrelated DROWK capabilities.

## Design consequence

No schema migration is authorized merely by this document.

When executable provider/channel-account bindings are introduced, their model must preserve the
distinctions above rather than encoding one generic email field as user, provider account, sender,
CRM identity, and infrastructure owner at the same time.
