# Database

PostgreSQL persistence boundary.

Expected responsibilities:
- forward-only migrations;
- schema ownership;
- repositories/query adapters;
- transaction helpers;
- tenant isolation helpers;
- idempotency/outbox primitives;
- append/supersede history;
- integration-test fixtures.

Rules:
- PostgreSQL is canonical storage infrastructure, not the domain layer;
- provider-native IDs never become canonical identity by database convenience;
- current projections must not destroy attributable history;
- migrations must be reviewable and testable;
- tenant isolation requires both application authorization and database defense.
