# DCRM-04F — Relationship Memory Foundation

Status: CLOSED — MERGED + POST-MERGE CI GREEN

## Closure evidence

- PR #13 merged into `foundation/drowk-crm-00`.
- Feature head: `ee9e76b8418f1e2ebdf309d436451fcaeda8b029`.
- Merge commit: `a9690e8ff8ff898b2769eac378dde44838794bc5`.
- Exact-head CI `36454614415`: SUCCESS.
- Post-merge push CI `36461840856`: SUCCESS.
- Foundation/PR validation CI `36461846945`: SUCCESS.
- Deep review: NO BLOCKING FINDING.
- Migration `0012_relationship_memory.sql` is included in the green migration chain.
- BuyerRole, trust/health/readiness/permission scoring, live Gmail, AIsa/model,
  outbound and deployment remained outside the package.

## Why this work package exists

DCRM-04B established durable Person/Identity/Employment continuity.
DCRM-04C established accepted interaction history.
DCRM-04D established bilateral Commitment memory.
DCRM-04E stabilized source Conversation identity and participant correction.

The executable core can now add the missing canonical Relationship object without
building on provider IDs, duplicate conversations or stale participant links.

## Operator / product outcome

DROWK can preserve a durable relationship with a Person across time while keeping
each interaction's original Account/Facility context attributable.

The operator can distinguish:
- latest accepted activity involving the relationship;
- latest explicitly reciprocal interaction;
- latest explicitly meaningful interaction;

without treating communication volume as trust, permission, health, readiness or
buyer authority.

## Scope

Implement only:

1. canonical tenant-to-Person Relationship root;
2. deterministic/idempotent Relationship claim for an existing canonical Person;
3. attributable accepted Activity membership;
4. explicit reciprocal/meaningful interaction assertions;
5. deterministic history/latest-clock queries.

No BuyerRole, relationship score or live provider path is part of this package.

## Canonical model

### Relationship

Minimum fields:
- id;
- tenantId;
- personId;
- recordedAt.

Rules:
- at most one canonical Relationship per tenant + Person;
- Person must already exist in the same tenant;
- Relationship does not move to or derive from current Employment;
- Relationship itself carries no Account/Facility authority, buyer authority,
  permission, health, readiness or trust score;
- claiming the same tenant + Person is idempotent;
- no Person may be implicitly created.

### RelationshipInteraction

Add an append-only attributable interaction assertion.

Minimum fields:
- id;
- tenantId;
- relationshipId;
- activityId;
- kind: `ACTIVITY | RECIPROCAL | MEANINGFUL`;
- occurredAt: nullable, copied/reconciled from the accepted Activity without
  inventing source time;
- recordedAt;
- promotionPolicyDecisionId: nullable for deterministic ACTIVITY membership and
  required for RECIPROCAL/MEANINGFUL.

Rules:
- Activity must already be accepted in the same tenant;
- the Relationship Person must be a **current** safely resolved participant of the
  Activity when a new RelationshipInteraction is accepted;
- historical RelationshipInteraction rows remain immutable if the participant is
  corrected later;
- Account/Facility context is read through the immutable Activity -> Conversation
  history and is not rewritten onto the Relationship root;
- exact replay is idempotent;
- conflicting assertion replay fails closed;
- absence of RECIPROCAL/MEANINGFUL assertion means unknown/not asserted, not false.

## Activity membership

`ACTIVITY` may be accepted deterministically when:
- Relationship Person is a current resolved ActivityParticipant;
- tenant/Activity/Relationship all agree.

It must not infer:
- trust;
- permission;
- health;
- readiness;
- BuyerRole;
- Commitment fulfillment.

## Reciprocal and meaningful assertions

`RECIPROCAL` and `MEANINGFUL` require an exact deterministic PolicyDecision for
the Activity.

Use an explicit action such as `ACCEPT_RELATIONSHIP_INTERACTION` with:
- exact Activity subject;
- disposition `ALLOW`;
- evidence complete;
- requested interaction kind bound to the accepted payload/decision semantics.

Minimum fail-closed behavior:
- REVIEW/DENY/incomplete policy cannot promote;
- policy for another Activity cannot promote;
- source Activity evidence remains the attributable basis;
- OUTBOUND activity alone never establishes RECIPROCAL;
- no model/provider output may directly authorize the assertion.

Do not introduce negative reciprocal/meaningful assertions in this package.

## Latest clocks / query semantics

Expose query behavior sufficient to retrieve:
- full RelationshipInteraction history;
- latest accepted ACTIVITY with known `occurredAt`;
- latest RECIPROCAL with known `occurredAt`;
- latest MEANINGFUL with known `occurredAt`.

Rules:
- `occurredAt = null` remains unknown and is never replaced with `recordedAt`;
- an unknown-time interaction remains in history but does not fabricate recency;
- latest means latest known source/event time, with deterministic ID tie-break if
  equal;
- seller outbound activity may advance latest ACTIVITY but not RECIPROCAL merely
  because it was sent;
- buyer-confirmed progress remains outside this package.

## Persistence target

Use the next forward-only migration after
`0011_commitment_current_participant_authority.sql`.

Expected minimum schema:
- `relationships`;
- `relationship_interactions`.

Database requirements:
- tenant-consistent foreign keys;
- unique tenant + Person Relationship claim;
- Activity linkage within tenant;
- immutable append-only relationship interaction history;
- deterministic uniqueness/idempotency for one logical assertion;
- current ActivityParticipant authority for new Person-attributed assertions;
- direct SQL cannot bypass reciprocal/meaningful policy authority;
- historical accepted assertions remain readable after later participant correction.

## Repository/domain target

Minimum repository behavior:
- claim/get Relationship by Person;
- get Relationship by ID;
- promote/append RelationshipInteraction;
- list interaction history;
- query latest ACTIVITY/RECIPROCAL/MEANINGFUL known-time assertion.

Pure domain sensors for:
- Relationship Person continuity;
- relationship root independent from Employment/Account;
- Activity membership authority;
- explicit reciprocal/meaningful distinction;
- unknown occurredAt preservation;
- outbound != reciprocal;
- job-change historical context;
- replay/conflict.

## Required synthetic golden cases

At minimum:

1. same tenant + Person claims one Relationship idempotently;
2. another tenant may have its own Relationship to the same conceptual external Person only
   through its own tenant-scoped canonical Person;
3. missing/cross-tenant Person fails closed;
4. Relationship creation does not create Person/Identity/Employment;
5. Activity membership requires accepted same-tenant Activity;
6. Relationship Person must be current safely resolved participant for a new assertion;
7. superseded participant cannot authorize a new RelationshipInteraction;
8. corrected current Person may authorize a new assertion;
9. previously accepted historical assertion remains readable after participant correction;
10. ACTIVITY does not imply RECIPROCAL;
11. OUTBOUND ACTIVITY does not by itself create RECIPROCAL;
12. REVIEW/DENY/incomplete policy cannot create RECIPROCAL/MEANINGFUL;
13. exact ALLOW/evidence-complete policy for the Activity can create the requested assertion;
14. policy for another Activity fails closed;
15. occurredAt null remains null;
16. unknown-time interaction remains in history but does not fabricate latest known-time recency;
17. latest ACTIVITY/RECIPROCAL/MEANINGFUL clocks are independently queryable;
18. Person job change does not move old Activity/Conversation Account/Facility context;
19. exact assertion replay is stable;
20. conflicting replay fails closed;
21. no trust/health/readiness/permission/BuyerRole inference;
22. no Relationship universal score;
23. no Commitment mutation/fulfillment inference;
24. no Gmail SDK/live provider/model/JEV/outbound/deployment authority.

## Explicit non-goals

Not in DCRM-04F:
- BuyerRole;
- procurement graph;
- relationship score/trust score;
- health/readiness score;
- contact permission inference;
- warm introductions/team coverage;
- Commitment redesign or fulfillment;
- buyer-confirmed progress/outcomes;
- Gmail `connectorRef` durability decision;
- live Gmail/OAuth;
- AIsa/model/JEV;
- Work persistence writer;
- outbound/draft/send;
- A3/A4;
- deployment;
- UI.

## Completion contract

DCRM-04F may close only when:
- next forward-only migration and migration sensors are green;
- tenant + Person Relationship claim is deterministic/idempotent;
- no Person/Identity/Employment is implicitly created;
- new Activity attribution follows current participant authority;
- historical accepted RelationshipInteraction survives later participant correction;
- reciprocal/meaningful assertions require exact policy/evidence authority;
- outbound does not imply reciprocity;
- unknown source/event time remains unknown;
- latest clock queries are deterministic and independent;
- no score/BuyerRole/model/provider/live-writer scope exists;
- exact-head GitHub CI is green;
- ChatGPT deep review has no blocking finding;
- owner explicitly authorizes merge;
- post-merge CI is green.

## Writer / authority boundary

Once handed off on a dedicated feature branch:
- Codex is sole implementation writer;
- ChatGPT reviews GitHub and does not edit implementation surfaces;
- legacy CRM source remains read-only unless a concrete legacy question requires inspection;
- no merge, deploy, live provider or outbound action without explicit owner gate.
