# Contributing to DROWK CRM

Thank you for helping improve DROWK CRM.

The project is intentionally evidence-first, provider-independent, auditable, and human-governed. Contributions should preserve those properties rather than bypass them for convenience.

## Before you start

For substantial changes, open an issue first so scope, invariants, security impact, and migration risk can be discussed before implementation.

Read:

- [README.md](README.md)
- [AGENTS.md](AGENTS.md)
- [Security Baseline](docs/security/SECURITY_BASELINE.md)
- [System Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Canonical Data Model](docs/architecture/CANONICAL_DATA_MODEL.md)

## Development prerequisites

- Node.js 22
- pnpm 10.17.1
- PostgreSQL 16 for database integration tests
- Docker/Compose only where documented by the runtime or staging harness

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

Useful checks:

```bash
pnpm harness:fast
pnpm harness:ci
pnpm runtime:verify
pnpm staging:verify
```

The repository CI is authoritative for the supported Node version and required checks.

## Contribution workflow

1. Fork the repository or create a feature branch.
2. Keep the change narrowly scoped and reversible.
3. Add or update tests for behavioral changes.
4. Run the relevant harness locally.
5. Open a pull request using the repository template.
6. Address review and CI findings before merge.

## Pull request expectations

Material PRs should describe:

- the problem being solved;
- scope and non-goals;
- affected objects/components;
- migration or schema impact;
- provider/security impact;
- tests/evals and evidence;
- rollback or recovery considerations.

Do not weaken tests, sensors, approval boundaries, or provenance requirements merely to make a change pass.

## Data and security

Never commit:

- secrets or tokens;
- OAuth/session material;
- production database snapshots;
- mailbox or CRM exports;
- real customer/prospect data;
- tenant PII;
- private screenshots containing credentials or sensitive information.

Use synthetic or clearly redacted fixtures.

Security vulnerabilities should be reported according to [SECURITY.md](SECURITY.md), not through a public issue.

## Architecture invariants

Contributions must preserve these core rules:

- human/policy authority outranks model output;
- source observations preserve provenance and freshness;
- model/provider output becomes evidence before accepted CRM state;
- risky identity ambiguity fails closed;
- read and write capabilities are independently authorized;
- material writes remain attributable and auditable;
- uncertain external effects remain explicit rather than being guessed into success.

## Licensing

By intentionally submitting a contribution for inclusion in this project, you agree that the contribution is provided under the repository's [Apache License 2.0](LICENSE), unless explicitly stated otherwise.
