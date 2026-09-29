# DCRM-04C — Accepted Interaction Foundation

Status: CLOSED — MERGED + POST-MERGE CI GREEN

## Closure evidence

- PR #10 merged into `foundation/drowk-crm-00`.
- Feature head: `af717e1656e8d50ee93607489c7c57e66a11933a`.
- Merge commit: `136525a8c6443f6a6b3a83d73181d809613527b7`.
- Exact-head CI `36386478992`: SUCCESS.
- Post-merge push CI `36386917696`: SUCCESS.
- Foundation/PR validation CI `36386920548`: SUCCESS.
- Deep review: NO BLOCKING FINDING after participant-linkage authority correction.
- Migrations `0006_accepted_interactions.sql` and
  `0007_participant_identity_authority.sql` are included in the green migration chain.
- Live Gmail/OAuth, Relationship, BuyerRole, Commitment, AIsa/LLM, outbound and
  deployment remained outside the package.

Non-blocking later gates recorded at closure:
- define an explicit idempotent Conversation source-identity strategy before live
  Gmail/Relationship consumption;
- prove Gmail `connectorRef` durability semantics before live ingestion;
- define participant supersession/retraction semantics before richer relationship
  correction workflows.

## Why this work package exists

DCRM-03A proved an observation-only Gmail boundary and intentionally stopped before
accepted CRM mutation.

DCRM-04B added durable Person/Identity/Employment continuity.

The post-DCRM-04B executable checkpoint found that canonical Conversation, Activity
and ActivityParticipant objects are still absent. Relationship, Commitment and
conversation-oriented UX should not be built on provider thread IDs or free-form
source refs.

DCRM-04C adds the smallest provider-neutral accepted interaction layer.

## Operator / product outcome

DROWK can preserve an attributable communication/business interaction as accepted
CRM context, linked to evidence and known people when safely resolved, without:

- treating a Gmail thread as universal conversation identity;
- moving interaction history when a Person changes employer;
- inventing a Person from an unresolved participant;
- treating automated outbound as reciprocity;
- letting a source connector mutate accepted CRM state directly.

## Scope

Implement only:

1. Conversation — provider-neutral interaction container;
2. Activity — one attributable communication/business event;
3. ActivityParticipant — participant role for an Activity;
4. explicit promotion boundary from already-persisted source/evidence context into
   accepted interaction projection.

No live connector is part of this package.

## Canonical invariants

Preserve:

- SourceObservation != Evidence != accepted Activity;
- Gmail thread != universal Conversation identity;
- Activity history != Work;
- automated outbound != reciprocal interaction;
- Person != Contact != Identity;
- unresolved participant != canonical Person;
- Employment change must not reattribute historical Activity to a new Account;
- unknown event/source time remains unknown;
- accepted interaction promotion requires explicit deterministic policy/authority;
- provider IDs remain namespaced lineage, not canonical object identity;
- duplicate source replay must not duplicate the same accepted Activity.

## Contract target

Add branded IDs:

- `ConversationId`;
- `ActivityId`;
- `ActivityParticipantId`.

### Conversation

Minimum fields:

- id;
- tenantId;
- channel;
- accountId: nullable;
- facilityId: nullable;
- sourceNamespace: nullable;
- sourceConversationRef: nullable;
- recordedAt;
- supersedesId.

Rules:

- source conversation/thread reference is namespaced;
- no source thread/ref is globally unique across channels/providers;
- Account/Facility context is explicit and does not move on Person job change.

### Activity

Minimum fields:

- id;
- tenantId;
- conversationId;
- kind;
- direction: `INBOUND | OUTBOUND | INTERNAL | UNKNOWN`;
- sourceObservationId;
- evidenceIds;
- occurredAt: nullable;
- recordedAt;
- promotionPolicyDecisionId;
- supersedesId.

Rules:

- null occurredAt means source time unknown;
- SourceObservation lineage is mandatory;
- accepted Activity must carry attributable Evidence;
- replay of the same accepted source revision must be idempotent;
- changed source revision must not silently mutate history.

### ActivityParticipant

Minimum fields:

- id;
- tenantId;
- activityId;
- role: `FROM | TO | CC | PARTICIPANT | OWNER | UNKNOWN`;
- personId: nullable;
- identityId: nullable;
- sourceParticipantRef: nullable;
- recordedAt.

Rules:

- Person/Identity links are optional because unresolved source participants are valid evidence;
- when Identity is present it must belong to the same Person when Person is also present;
- sourceParticipantRef is lineage/context, not identity authority;
- unresolved participant data must not create Person/Identity implicitly.

## Promotion boundary

DCRM-04C must expose one explicit accepted-interaction promotion operation.

Inputs must already be persisted/attributable:
- SourceObservation;
- Evidence;
- deterministic linkage state;
- deterministic PolicyDecision authorizing accepted interaction promotion.

The promotion operation must fail closed when:
- source observation is missing/cross-tenant;
- required Evidence is missing/cross-tenant;
- policy decision is not explicit ALLOW with complete evidence;
- linked Person/Identity is missing or cross-tenant;
- supplied Person and Identity disagree;
- an existing accepted Activity for the same deterministic source identity conflicts.

A source connector must not call accepted CRM mutation directly in this WP.

## PostgreSQL target

Use one forward-only migration after `0005_human_continuity.sql`.

Expected schema surface:

- `conversations`;
- `activities`;
- `activity_evidence`;
- `activity_participants`.

Requirements:

- every table tenant scoped;
- tenant-consistent foreign keys;
- exact SourceObservation lineage;
- Evidence linkage;
- promotion PolicyDecision attribution;
- deterministic/idempotent accepted source identity;
- no global uniqueness assumption on provider thread IDs;
- no destructive historical rewrite.

A composite database authority constraint may mirror the accepted promotion decision
where useful, following the DCRM-04B fail-closed pattern.

## Repository target

Add the minimum tenant-scoped persistence needed to prove the slice:

- create/get Conversation;
- create/get Activity through the accepted-promotion boundary;
- list Activities for Conversation;
- append/list ActivityParticipant;
- list Evidence for Activity or equivalent join access.

Do not add Gmail-specific repository methods.

## Domain target

Pure deterministic behavior/sensors for at least:

- provider thread key namespacing;
- unknown occurredAt remains unknown;
- participant Person/Identity consistency;
- unresolved participant remains unresolved;
- automated outbound direction does not imply reciprocal interaction;
- activity source replay is stable;
- conflicting accepted source revision fails closed;
- job-change Employment does not alter historical Activity Account/Conversation context.

Do not implement:
- relationship strength/health;
- reciprocal/meaningful relationship aggregation;
- Commitment extraction;
- BuyerRole inference;
- Opportunity promotion.

## Required synthetic golden cases

At minimum:

1. namespaced source thread may create a Conversation without claiming cross-channel identity;
2. same raw thread ID under another namespace may coexist;
3. Activity requires existing SourceObservation;
4. Activity requires attributable Evidence;
5. policy REVIEW/DENY or incomplete evidence cannot promote accepted Activity;
6. policy ALLOW + complete evidence may promote;
7. accepted source replay returns the same logical Activity;
8. conflicting replay/source revision fails closed or appends attributable history per explicit contract;
9. occurredAt null remains null;
10. participant may remain unresolved;
11. resolved Identity + Person must agree;
12. cross-tenant Person/Identity/Conversation/Observation/Evidence references fail;
13. source participant ref alone never creates Person/Identity;
14. OUTBOUND Activity does not become reciprocal interaction;
15. Person job change does not move prior Conversation/Activity Account context;
16. migration applies in order and replay is idempotent;
17. no Gmail SDK/live network/provider call path;
18. no outbound, draft/send, A3/A4 or deployment authority.

## Expected implementation surfaces

Likely:

- `packages/contracts/src/ids.ts`;
- focused interaction contract module under `packages/contracts/src/`;
- `packages/db/migrations/0006_*.sql`;
- `packages/db/src/`;
- `packages/db/test/`;
- `packages/domain/src/`;
- `packages/domain/test/`;
- compatibility/readme notes.

The Gmail connector itself should normally remain unchanged; if a change is needed,
it must only expose/provider-neutralize already-proven candidate data and must not
gain accepted CRM write authority.

## Explicit non-goals

Not in DCRM-04C:

- live Gmail/OAuth;
- Gmail draft/send;
- Relationship implementation;
- relationship scoring/aggregation;
- BuyerRole;
- Commitment;
- Pursuit/Opportunity;
- Inbox UI;
- warm introductions;
- provider research/enrichment;
- omnichannel capture framework;
- Work persistence writer;
- A3/A4;
- outbound;
- deployment.

## Completion contract

DCRM-04C may close only when:

- contracts compile;
- migration is forward-only and migration sensors include it;
- repository integration proves tenant isolation and lineage integrity;
- accepted Activity promotion fails closed without explicit valid policy/evidence;
- provider thread IDs remain namespaced rather than universalized;
- unresolved participant semantics are preserved;
- job-change golden preserves historical interaction context;
- deterministic replay/conflict sensors pass;
- no live provider/writer path exists;
- authoritative exact-head GitHub CI is green;
- ChatGPT deep review has no blocking finding;
- owner explicitly authorizes merge;
- post-merge CI is green.

## Writer / authority boundary

Once the dedicated DCRM-04C feature branch is handed to Codex:

- Codex is sole implementation writer on that branch;
- ChatGPT reviews GitHub and does not edit the same implementation surfaces;
- PWM_CRM remains read-only and is not required as an oracle unless a concrete
  legacy question arises;
- no merge, deploy, live provider or outbound action without explicit owner gate.
