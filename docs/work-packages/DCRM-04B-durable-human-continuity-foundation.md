# DCRM-04B — Durable Human Continuity Foundation

Status: READY FOR HANDOFF — FEATURE BRANCH PENDING

## Why this work package exists

The post-DCRM-04A executable checkpoint proved that the product canon is ahead of
the runtime relationship model.

DROWK already has Account/Facility, a minimal Contact, Evidence,
IdentityEvidence/EntityMatchDecision and deterministic Work, but it does not yet
have executable canonical objects for Person, Identity or Employment.

This package implements the smallest dependency required before Relationship,
Buyer Role, Commitment, job-change continuity and richer relationship UX can be
built safely.

## Operator / product outcome

DROWK can represent one durable human across operational contacts, source/channel
identities and employment changes without:

- creating a new person because an email/employer changed;
- moving historical context to a new employer;
- treating provider IDs as canonical identity;
- converting identity ambiguity into an automatic link.

## Scope

Implement only:

1. Person — durable tenant-scoped human subject;
2. canonical Identity — accepted source/channel manifestation linked to a Person;
3. Employment — temporal Person <-> Account context;
4. explicit Contact -> Person linkage.

This is a foundation package. It does not implement the broader relationship graph.

## Canonical invariants

Preserve:

- Person != Contact != Identity;
- Contact is an operational CRM representation, not universal human identity;
- provider/source identity remains namespaced;
- IdentityEvidence != canonical Identity;
- EntityMatchDecision != canonical Identity;
- provider ID alone never creates or links a Person;
- NO_MATCH never authorizes automatic Person creation;
- ambiguous identity fails closed for canonical linking;
- unknown start/end dates remain unknown;
- Employment change never rewrites historical organization context;
- changing Contact/email/employer must not implicitly create a new Person;
- database uniqueness is not real-world identity verification;
- model confidence is not authority.

## Contract target

Add branded IDs:

- `PersonId`;
- `IdentityId`;
- `EmploymentId`.

Add provider-neutral contracts for:

### Person

Minimum fields:

- id;
- tenantId;
- displayName: nullable;
- recordedAt;
- supersedesId.

A Person may exist without a current Employment or operational Contact.

### Identity

Canonical accepted identity connected to a Person.

Minimum fields:

- id;
- tenantId;
- personId;
- kind;
- namespace;
- normalizedValue;
- temporalState: `CURRENT | HISTORICAL | UNKNOWN`;
- effectiveFrom: nullable date;
- effectiveTo: nullable date;
- matchDecisionId;
- recordedAt;
- supersedesId.

Rules:

- namespace is mandatory for provider/source-specific identifiers;
- normalized value uniqueness must **not** be treated as proof of one real human;
- do not impose a global/eternal uniqueness rule on normalized identity values;
- an Identity may be historical or time-bounded;
- DCRM-04B only promotes a canonical Identity when the referenced
  EntityMatchDecision is `MATCHED_SAFE` and selects that Person;
- shared/recycled/ambiguous values remain Evidence/candidates until safely resolved.

### Employment

Minimum fields:

- id;
- tenantId;
- personId;
- accountId;
- title: nullable;
- state: `CURRENT | FORMER | UNKNOWN`;
- startedOn: nullable date;
- endedOn: nullable date;
- recordedAt;
- supersedesId.

Rules:

- null date means unknown, never invented;
- when both dates are known, `endedOn < startedOn` is invalid;
- a new Employment does not mutate/delete the prior Employment;
- title does not establish Buyer Role or authority.

### Contact -> Person linkage

Extend the operational Contact projection with an explicit nullable Person link.

Compatibility:

- existing Contact rows remain valid with no Person link;
- unresolved Contact does not cause Person creation;
- linking requires an existing Person and a `MATCHED_SAFE` EntityMatchDecision
  selecting that Person;
- same-link replay may be idempotent;
- conflicting relink fails closed in this WP;
- do not silently overwrite a Contact already linked to another Person.

The persistence representation may store the decision reference alongside the
Contact link so the promotion remains attributable.

## PostgreSQL target

Use one forward-only migration after `0004_work_due_date.sql`.

Expected schema surface:

- `persons`;
- `person_identities` (canonical Identity, distinct from `identity_evidence`
  and `auth_identities`);
- `employments`;
- nullable Contact -> Person linkage plus attribution to the match decision.

Requirements:

- every new business table is tenant scoped;
- tenant-consistent composite foreign keys;
- no provider SDK/schema in canonical tables;
- no destructive rewrite of existing Contact rows;
- no global uniqueness assumption for a real-world identity value;
- useful lookup indexes are allowed, but an index must not become identity authority.

## Repository target

Add the minimum tenant-scoped persistence methods needed to prove the slice:

- create/get Person;
- create/get/list canonical Identity for Person;
- create/get/list Employment for Person;
- create/get Contact if needed to exercise the existing Contact table;
- explicit Contact -> Person link operation with safe-decision validation.

The Contact link operation must fail closed for:

- cross-tenant Person;
- missing Person;
- decision not `MATCHED_SAFE`;
- decision selecting another entity;
- conflicting existing Person link.

No source connector may call these repositories in this WP.

## Domain target

Add pure deterministic invariants/sensors for at least:

- known-invalid Employment range is rejected;
- unknown Employment boundary stays UNKNOWN rather than becoming a fabricated date;
- identity ambiguity cannot authorize canonical Identity creation/linkage;
- safe decision may link only the Person it actually selected;
- Contact update/input does not implicitly create Person;
- job-change representation appends a second Employment and preserves the first;
- a Person may have multiple historical/current Identities without treating value
  uniqueness as person proof.

Do not infer:

- trust;
- relationship strength;
- buyer authority;
- permission;
- warm-introduction willingness;
- Commitment;
- Opportunity.

## Required synthetic golden cases

At minimum:

1. create Person without Employment -> valid;
2. existing Contact with no Person -> remains valid;
3. MATCHED_SAFE decision selecting Person P -> Contact may link to P;
4. REVIEW_REQUIRED / LINK_CONFLICT / NO_MATCH -> Contact link denied;
5. MATCHED_SAFE selecting P1 cannot link Contact to P2;
6. repeated same Contact -> Person link -> idempotent/no duplicate semantic link;
7. conflicting relink P1 -> P2 -> fail closed;
8. canonical Identity requires namespace + normalized value + safe Person decision;
9. same normalized identity value must not itself prove same Person;
10. historical Identity remains attributable after a newer Identity is added;
11. Employment with unknown start/end -> null remains null;
12. Employment with end before start -> rejected;
13. Person moves Account A -> Account B -> both Employment records remain;
14. prior Employment title/account does not become authority at Account B;
15. cross-tenant Person/Identity/Employment/Contact links fail;
16. migrations apply in order and replay idempotently;
17. no Gmail/AIsa/JEV/model/provider call path;
18. no live provider, outbound or execution authority.

## Expected implementation surfaces

Likely surfaces include:

- `packages/contracts/src/ids.ts`;
- a focused relationship/human-continuity contract module under
  `packages/contracts/src/`;
- `packages/contracts/src/crm.ts` only for Contact compatibility/linkage;
- `packages/db/migrations/0005_*.sql`;
- `packages/db/src/`;
- `packages/db/test/`;
- `packages/domain/src/`;
- `packages/domain/test/`;
- compatibility/readme notes where needed.

Do not broaden into apps/web, Gmail connector, AIsa capabilities or deployment.

## Explicit non-goals

Not in DCRM-04B:

- Relationship object implementation;
- BuyerRole implementation;
- Commitment implementation;
- relationship/trust score;
- who-knows-whom graph;
- warm-introduction workflow;
- job-change discovery/provider integration;
- LinkedIn/Apollo live integration;
- Gmail live auth/read/write;
- omnichannel capture;
- provider ingestion/promotion automation;
- Work persistence writer;
- opportunity/pipeline changes;
- A3/A4 execution;
- outbound;
- deployment.

## Completion contract

DCRM-04B may close only when:

- contracts compile;
- migration is forward-only and covered by migration sensors;
- PostgreSQL integration proves tenant isolation and relation integrity;
- repository methods are tenant scoped;
- ambiguous identity/linking fails closed;
- Employment temporal unknowns remain unknown;
- job-change golden preserves prior Employment;
- Contact linking is explicit, attributable and conflict-safe;
- clean build/typecheck/tests pass;
- authoritative GitHub CI is green at exact feature head;
- ChatGPT deep review finds no blocking issue;
- owner explicitly authorizes merge;
- post-merge CI is green.

## Writer / authority boundary

Once the dedicated DCRM-04B feature branch is handed to Codex:

- Codex is the sole implementation writer on that branch;
- ChatGPT reviews GitHub and does not edit the same implementation surfaces;
- PWM_CRM remains read-only and is not required as an oracle for this package
  unless a concrete legacy behavior question arises;
- no merge, deploy or live-provider action without explicit owner gate.
