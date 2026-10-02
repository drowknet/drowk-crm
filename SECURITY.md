# Security Policy

Security is a first-class design requirement in DROWK CRM. The project separates model output, business truth, policy authority, credentials, and execution capability so that AI assistance cannot silently become execution authority.

## Supported versions

Security fixes target the current `main` branch and the latest published alpha release, when one exists. Older snapshots may not receive fixes.

## Reporting a vulnerability

Please do **not** open a public issue for a suspected vulnerability.

Use GitHub Private Vulnerability Reporting for this repository when available. Include:

- affected component and commit/release;
- impact and realistic attack path;
- reproduction steps or proof of concept;
- required privileges or preconditions;
- whether secrets, tenant isolation, or external actions are involved;
- any suggested remediation.

If private reporting is temporarily unavailable, contact the primary maintainer through the GitHub profile associated with this repository and avoid disclosing exploit details publicly.

## Security scope

High-priority classes include:

- authentication and authorization bypass;
- cross-tenant data exposure;
- secret or credential leakage;
- prompt injection that can alter authority or capabilities;
- unsafe provider/tool privilege;
- SSRF and untrusted-content execution paths;
- supply-chain compromise;
- CI/CD credential exposure;
- silent mutation of accepted CRM state;
- unauthorized outbound or destructive actions;
- audit/provenance bypass.

The detailed repository threat model is maintained in [docs/security/SECURITY_BASELINE.md](docs/security/SECURITY_BASELINE.md).

## Response targets

The maintainer aims to acknowledge credible reports within 3 business days and provide an initial triage within 7 business days. Complex issues may require additional investigation.

## Disclosure

Please allow time for investigation and remediation before public disclosure. When appropriate, fixes will be documented through a security advisory, release notes, or the changelog.

## Security boundaries

- Never submit real credentials, OAuth/session material, private mailbox exports, customer/prospect datasets, production dumps, or tenant PII.
- Synthetic or redacted fixtures are required for tests and examples.
- A model recommendation is not authorization.
- High-impact actions require deterministic policy authority and, by default, human approval.

Good-faith security research that respects these boundaries is welcome.
