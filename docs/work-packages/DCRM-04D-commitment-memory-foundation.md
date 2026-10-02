# DCRM-04D — Commitment Memory Foundation

Status: CLOSED — MERGED + POST-MERGE CI GREEN

## Closure evidence

- PR #11 merged into `foundation/drowk-crm-00`.
- Feature head: `504ae86102fa81f82d04cfe3a83087df0ea59189`.
- Merge commit: `b71205d8ee79b8ea2d1ce22cabf31004ad3ac4eb`.
- Exact-head CI `36432687225`: SUCCESS.
- Post-merge push CI `36433066848`: SUCCESS.
- Foundation/PR validation CI `36433073983`: SUCCESS.
- Deep review: NO BLOCKING FINDING after deterministic single-successor correction.
- Migrations `0008_commitment_memory.sql` and
  `0009_commitment_single_successor.sql` are included in the green migration chain.
- Relationship, BuyerRole, AIsa/model, live Gmail, outbound, Work persistence and
  deployment remained outside the package.

Non-blocking clarification carried forward:
- `commitmentKey` identifies one accepted logical version/claim; continuity across
  accepted corrections is represented by `supersedesId`. Future consumers must not
  reinterpret the key as the whole supersession chain.

## Why this work package exists

DCRM-04C created accepted Conversation / Activity / ActivityParticipant history.
The Work Engine already represents deterministic next action, but DROWK still
cannot preserve the bilateral commercial fact that may cause that work.

A Commitment is not a Task and not a WorkItem.

DCRM-04D adds the smallest attributable Commitment memory layer before richer
Relationship state.

## Operator / product outcome

DROWK can preserve:
- what was requested, promised or agreed;
- which side owes the next move;
- the relevant Account/Facility context;
- a known calendar date or condition without inventing time;
- whether the commitment is suggested, confirmed, fulfilled, declined or unresolved;
- the accepted Activity/Evidence/Policy basis for the claim.

This enables later Today/Inbox/Relationship surfaces to explain "who owes what"
without treating internal task completion as proof of external fulfillment.

## Scope

Implement only:

1. canonical Commitment contract;
2. tenant-scoped Commitment persistence;
3. accepted promotion from an existing accepted Activity + attributable Evidence +
   deterministic PolicyDecision;
4. append/supersede semantics for later corrections/state changes;
5. deterministic replay/conflict sensors.

No model/JEV extraction is part of this package.

## Canonical invariants

Preserve:

- Commitment != Task != WorkItem;
- Commitment != Activity;
- suggested != confirmed;
- confirmed != fulfilled;
- internal Work completion != counterparty fulfillment;
- unknown date/condition remains unknown;
- date-only obligation must not become an invented midnight timestamp;
- source-derived counterparty Person must already be safely resolved through the
  accepted ActivityParticipant / canonical Identity boundary;
- job change must not move historical Commitment Account/Facility context;
- Evidence/Policy authority is required for accepted source-derived Commitment;
- provider/model output alone is never authority.

## Contract target

Add branded `CommitmentId`.

Minimum Commitment fields:

- id;
- tenantId;
- commitmentKey;
- kind: `REQUEST | PROMISE | AGREED_NEXT_STEP`;
- state: `SUGGESTED | CONFIRMED | FULFILLED | DECLINED | UNRESOLVED`;
- statement;
- sourceActivityId;
- evidenceIds;
- accountId: nullable;
- facilityId: nullable;
- counterpartyPersonId: nullable;
- owedBy: `TENANT | COUNTERPARTY | MUTUAL | UNKNOWN`;
- dueDate: nullable calendar date;
- conditionText: nullable;
- recordedAt;
- promotionPolicyDecisionId;
- supersedesId.

Rules:

- `commitmentKey` is a deterministic logical key, not a human-identity key;
- statement must be nonblank but remains attributable claim/context, not universal truth;
- dueDate remains null when unknown;
- conditionText remains null when no source-supported condition exists;
- account/facility context is explicit and historical;
- counterpartyPersonId is optional; unresolved counterparty remains valid;
- a source-derived counterpartyPersonId, when supplied, must already be a safely
  resolved participant on the source Activity.

## Promotion boundary

Expose one explicit accepted-Commitment promotion operation.

Inputs must already exist:
- accepted Activity;
- Evidence attributable to that Activity's SourceObservation;
- deterministic PolicyDecision with action `ACCEPT_COMMITMENT`, disposition
  `ALLOW` and complete evidence;
- optional safely resolved counterparty Person from that Activity.

Fail closed when:
- Activity is missing/cross-tenant;
- Evidence is missing/cross-tenant/not attributable to the source Activity;
- policy does not name the exact Activity or is not ALLOW/evidence-complete;
- supplied Account/Facility/Person is cross-tenant;
- supplied Facility does not belong to supplied Account when both are present;
- supplied counterparty Person is not an accepted resolved participant of the
  source Activity;
- the same commitmentKey replays with conflicting attributable payload.

No connector/model may write Commitment directly.

## Persistence target

Use the next forward-only migration after `0007_participant_identity_authority.sql`.

Expected minimum schema:
- `commitments`;
- `commitment_evidence`.

Requirements:
- tenant scope;
- tenant-consistent foreign keys;
- exact Activity lineage;
- attributable Evidence linkage;
- PolicyDecision attribution;
- deterministic `commitmentKey` uniqueness within tenant;
- no destructive historical rewrite;
- supersession remains attributable.

## Repository/domain target

Minimum repository behavior:
- promote/get Commitment;
- list Commitments for Activity;
- list Commitments for Person/Account when linked;
- evidence access or equivalent join;
- deterministic replay/conflict handling.

Pure domain sensors for:
- state distinctions;
- owedBy semantics;
- date-only preservation;
- unknown date/condition;
- participant Person authority;
- job-change historical context;
- replay/conflict.

Do not add a Work persistence writer in this package.

## Required synthetic golden cases

At minimum:

1. REQUEST/PROMISE/AGREED_NEXT_STEP remain distinct;
2. SUGGESTED does not become CONFIRMED automatically;
3. CONFIRMED does not become FULFILLED from Work completion;
4. accepted source-derived Commitment requires existing Activity;
5. attributable Evidence is mandatory;
6. REVIEW/DENY/incomplete policy cannot promote;
7. exact ALLOW/evidence-complete policy can promote;
8. dueDate null remains null;
9. date-only dueDate remains a calendar date with no invented time;
10. conditionText may remain null;
11. unresolved counterparty remains valid;
12. arbitrary Person not participating in source Activity fails closed;
13. safely resolved source Activity participant may be linked;
14. cross-tenant Activity/Evidence/Account/Facility/Person fails closed;
15. Facility/Account mismatch fails closed;
16. identical commitmentKey replay is stable;
17. conflicting replay fails closed;
18. superseding record preserves prior Commitment history;
19. Person job change does not move prior Account/Facility commitment context;
20. no Relationship/BuyerRole inference;
21. no JEV/model/provider/live Gmail path;
22. no outbound/A3/A4/deployment authority.

## Explicit non-goals

Not in DCRM-04D:
- LLM/JEV commitment extraction;
- live Gmail/OAuth;
- Relationship implementation/score;
- BuyerRole;
- procurement graph;
- Opportunity/Pursuit changes;
- Work persistence writer;
- automatic fulfillment inference;
- warm introductions;
- outbound/draft/send;
- A3/A4;
- deployment.

## Completion contract

DCRM-04D may close only when:
- contracts compile;
- next forward-only migration and migration sensors are green;
- tenant isolation and attribution are proven;
- source-derived Person linkage cannot bypass ActivityParticipant authority;
- date-only/unknown temporal semantics are preserved;
- Commitment/Task/Work distinctions are sensor-backed;
- replay/conflict/supersession behavior is deterministic;
- no model/provider/live-writer path exists;
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
