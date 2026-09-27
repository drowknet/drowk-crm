# Database scope

This directory owns PostgreSQL schema, migrations and persistence adapters.

Rules:
- forward-only migrations once applied;
- tenant scope on every tenant-owned table;
- append/supersede instead of silent history destruction where auditability matters;
- database uniqueness is not real-world identity verification;
- idempotency is not external delivery confirmation;
- do not introduce extensions without a measured requirement;
- no production data in fixtures.
