## Problem

What problem does this change solve?

## Scope

Describe the implementation scope and explicit non-goals.

## Affected areas

- [ ] Domain/contracts
- [ ] Database/migrations
- [ ] API/runtime
- [ ] Connector/provider
- [ ] Security/authorization
- [ ] Documentation
- [ ] CI/tooling
- [ ] Other

## Safety and data impact

Describe any impact on tenant isolation, credentials, provider permissions, PII, external actions, or accepted CRM state.

## Verification

List the commands, tests, evals, fixtures, or other evidence used to verify this change.

## Migration / compatibility

Describe schema, configuration, API, or compatibility effects. Write `None` when not applicable.

## Rollback / recovery

How can this change be safely reverted or contained?

## Checklist

- [ ] No secrets, credentials, private exports, production dumps, or tenant PII are included.
- [ ] Tests/evals cover material behavior changes.
- [ ] I did not weaken an existing safety check merely to make CI pass.
- [ ] Documentation reflects externally visible behavior.
- [ ] High-impact actions remain policy-controlled and human-governed where required.
