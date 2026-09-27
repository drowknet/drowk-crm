# Contracts

Stable cross-boundary contracts for DROWK CRM.

Candidate contents:
- IDs and tenant-scoped references;
- source/observation envelopes;
- evidence contracts;
- identity candidate/decision contracts;
- event envelopes;
- research/provider run contracts;
- policy/approval contracts;
- Work and Outcome contracts;
- connector/capability interfaces.

Contracts should be provider-neutral, versionable and serializable.

Do not place runtime clients, secrets, database handles or provider SDK objects
in this package.
