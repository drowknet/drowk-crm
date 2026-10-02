# Governance

DROWK CRM is currently maintained under a primary-maintainer model.

## Primary maintainer

The primary maintainer is the GitHub account `@drowknet`.

The primary maintainer is responsible for:

- repository direction and release decisions;
- architecture and security boundaries;
- issue and pull-request triage;
- maintainer access;
- vulnerability coordination;
- final merge authority;
- protecting project trademarks and repository integrity.

## Decision model

Routine implementation decisions should be made transparently in issues and pull requests.

Material architectural decisions should be captured in an ADR or equivalent repository document when they affect durable contracts, security boundaries, data ownership, provider independence, or execution authority.

Security, tenant isolation, irreversible actions, credential handling, and high-impact automation require a higher review bar than ordinary refactoring.

## Contributions

External contributors are welcome. Repeated, high-quality contributions may lead to expanded triage or maintainer responsibilities over time.

Maintainer status is based on demonstrated judgment, reliability, security awareness, and sustained contribution. It is not automatically granted by contribution count.

## Merge policy

`main` is protected. Changes should flow through pull requests and required CI checks.

The project currently permits zero mandatory approving reviews because there is one primary maintainer; requiring self-approval would create a governance deadlock. This can be revisited when additional maintainers are established.

Force-pushes, branch deletion of protected `main`, and bypass of required checks are not part of the normal workflow.

## Releases

Public releases should:

- be reproducible from repository state;
- identify the exact version/tag;
- summarize notable changes and limitations;
- document security-relevant changes;
- preserve migration/rollback considerations where applicable.

## Security

Vulnerability handling follows [SECURITY.md](SECURITY.md). Sensitive reports should not be discussed in public issues before coordinated disclosure.

## Changes to governance

Material governance changes should be proposed in a pull request with rationale and should not silently reduce review, security, provenance, or auditability guarantees.
