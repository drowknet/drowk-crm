# Security Baseline

## Threat model

Primary concerns:
- credential leakage;
- public-repository data leakage;
- prompt injection through email/web/documents;
- provider/tool over-privilege;
- cross-tenant data leakage;
- silent mutation of CRM truth;
- autonomous outbound actions;
- supply-chain compromise;
- compromised CI/deployment credentials;
- irreversible destructive actions.

## Repository rules

Repository visibility is not a security boundary. Treat repository contents as
potentially public even when the GitHub repository is private.

Therefore:
- no tenant PII;
- no Gmail/LinkedIn exports;
- no real prospect lists;
- no production DB snapshots;
- no provider keys;
- no OAuth refresh tokens;
- no Cloudflare/GitHub/Google credentials;
- no screenshots containing secrets.

Synthetic fixtures only.

## Secret management

Secrets must be injected at runtime through environment/secret stores.

Never commit secrets, even temporarily.

Rotate any secret exposed in Git history.

## Untrusted content

Treat:
- inbound email;
- websites;
- documents;
- provider-returned content;
- CRM notes imported from unknown sources
as untrusted input.

Untrusted content may not grant new capabilities or override policy.

## AI separation

Keep:
- content
- judgment
- authority
- capability
separate.

A model saying “send this now” is not authorization.

## Least privilege

Credentials should be capability-specific where possible.

Separate:
- observer credentials;
- preparer credentials;
- executor credentials.

## Approval binding

Future high-impact approvals should bind to:
- exact actor
- exact tenant
- exact recipient/target
- exact action
- exact payload/body hash
- exact thread/object
- policy snapshot
- expiration
- single-use approval token
- live-state recheck before execution

## Audit

Record at minimum:
- who/what initiated;
- capability invoked;
- provider/tool/model;
- input fingerprint;
- policy decision;
- approval;
- write/result;
- timestamp;
- run ID;
- failure state.

## Public repo note

Whether the repository is private or public may change over time; security controls
must never depend on repository privacy.
