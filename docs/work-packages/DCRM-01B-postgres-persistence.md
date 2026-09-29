# DCRM-01B — PostgreSQL Persistence Vertical Slice

Status: GREEN / CLOSED
Branch: `feat/dcrm-01a-persistence`
Parent: `foundation/drowk-crm-00`

## Objective

Implement the first real PostgreSQL persistence layer for the canonical path:

```text
Tenant
  -> Account
  -> Facility
  -> SourceObservation
  -> Evidence
```

This work turns the already-green foundation schema into executable application
persistence without introducing an ORM, web framework, Gmail runtime or provider
SDK.

## Ownership

Primary implementation surface:
- `packages/db/**`

Read contracts from:
- `packages/contracts/**`

Touch another package only when required to keep the persistence contract coherent,
and report that scope expansion explicitly.

## Required implementation

Create the smallest typed PostgreSQL adapter/repository layer that supports:

### Account
- insert/create a tenant-owned Account;
- read Account by `tenantId + accountId`;
- never return another tenant's Account.

### Facility
- insert/create a Facility with optional Account parent;
- read Facility by `tenantId + facilityId`;
- list Facilities for a tenant-scoped Account;
- rely on/enforce the existing tenant-consistent parent FK.

### SourceObservation
- append a SourceObservation;
- read by `tenantId + observationId`;
- find by source identity:
  `tenantId + sourceSystem + sourceNativeId + sourceRevision`;
- preserve `sourceMetadata` JSON exactly as structured data;
- duplicate source identity/revision must not create a second row.

### Evidence
- append Evidence linked to an existing SourceObservation;
- read by `tenantId + evidenceId`;
- list Evidence for a tenant-scoped SourceObservation;
- cross-tenant Observation linkage must fail.

## Dependency rule

Use a minimal PostgreSQL driver boundary. If no driver exists, use `pg` as the
direct PostgreSQL client for this slice.

Do not add:
- ORM;
- query builder framework;
- workflow engine;
- auth framework;
- generic repository framework.

Keep SQL visible and reviewable.

## API shape

Repository methods must receive tenant scope explicitly. Tenant scope must not be
inferred from global process state.

Prefer explicit result semantics for expected conflicts, for example:
- inserted;
- already exists/idempotent duplicate;
- not found.

Do not silently overwrite an existing SourceObservation or Evidence row.

## Transaction boundary

Provide a small transaction primitive usable by later application services.

Do not hide an external side effect inside a DB transaction abstraction.

## Temporal / truth rules

- preserve `recordedAt`, `retrievedAt`, `observedAt`, `effectiveAt` semantics;
- unknown source time remains null/unknown;
- persistence does not promote Evidence into accepted CRM truth;
- database uniqueness is not real-world identity verification.

## Integration sensors

Use disposable PostgreSQL only. Tests must include at least:

1. Account insert/read round trip.
2. Account from tenant A is invisible when read under tenant B.
3. Facility insert/read/list round trip.
4. Cross-tenant Facility -> Account insert is rejected.
5. SourceObservation round trip preserves:
   - source identity;
   - null source revision where applicable;
   - watermark;
   - adapter version;
   - fingerprint;
   - structured source metadata.
6. Re-appending the same source identity/revision does not create a duplicate row.
7. Evidence insert/read/list round trip.
8. Cross-tenant Evidence -> SourceObservation insert is rejected.
9. Evidence append does not mutate its SourceObservation.
10. Transaction rollback leaves no partial Account/Facility test data.
11. No production credentials or tenant data in fixtures.

## Workspace sensors

Before completion:
- clean TypeScript build/typecheck;
- package tests;
- PostgreSQL integration tests;
- existing workspace `pnpm verify`;
- existing foundation migration/isolation CI remains green.

## Out of scope

- HTTP endpoints;
- authentication/authorization provider;
- Gmail API/OAuth;
- JEV/AIsa calls;
- Work Engine port;
- opportunity/pursuit persistence;
- background jobs;
- production deployment;
- RLS policy adoption;
- DBOS/pg-boss decision.

## Codex workcell

One writer: Codex.

Optional read-only critics:
- schema-critic;
- tenant-isolation critic;
- test/failure-mode critic.

Critics report findings to the writer. They do not edit the same files concurrently.

## Completion deliverable

Before asking for review, Codex must:
- commit implementation to `feat/dcrm-01a-persistence`;
- push the branch to `origin`;
- report commit SHA;
- report exact files changed;
- report all local test/typecheck/integration results;
- report any CI result it can observe;
- report unresolved findings or deviations;
- do not merge the PR;
- do not deploy anything.


## Closure evidence

Merged through PR #2 into `foundation/drowk-crm-00`.

Verified:
- typed tenant-scoped PostgreSQL repositories for Account, Facility, SourceObservation and Evidence;
- transaction rollback behavior;
- source identity/revision idempotency with NULL-vs-empty revision preservation;
- disposable PostgreSQL integration sensors;
- post-merge CI green.

The implementation remains the persistence foundation used by later runtime/auth slices.
