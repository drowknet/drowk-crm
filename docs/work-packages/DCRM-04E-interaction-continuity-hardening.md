# DCRM-04E — Interaction Continuity Hardening

Status: CLOSED — MERGED + POST-MERGE CI GREEN

## Closure evidence

- PR #12 merged into `foundation/drowk-crm-00`.
- Feature head: `0a3be336d075250bb133dac5d605bdb9446324e6`.
- Merge commit: `d36cbe68d30f2ee6cb0dde1b6b9be14b00fe597d`.
- Exact-head CI `36441476373`: SUCCESS.
- Post-merge push CI `36449747837`: SUCCESS.
- Foundation/PR validation CI `36449754965`: SUCCESS.
- Deep review: NO BLOCKING FINDING after Commitment current-participant authority correction.
- Migrations `0010_interaction_continuity.sql` and
  `0011_commitment_current_participant_authority.sql` are included in the green migration chain.
- Relationship, BuyerRole, AIsa/model, live Gmail, outbound and deployment remained
  outside the package.

Non-blocking operational note:
- source-derived callers should use `claimSourceConversation(...)`; direct
  `createConversation(...)` remains appropriate for manual/source-less creation,
  while PostgreSQL uniqueness still prevents duplicate source-derived canonical rows.

## Why this work package exists

DCRM-04C created accepted Conversation / Activity / ActivityParticipant history.
DCRM-04D added attributable Commitment memory.

The DCRM-04C closure recorded two prerequisites before richer Relationship
consumption:
- explicit idempotent Conversation source identity;
- participant supersession/retraction semantics.

DCRM-04E closes only those interaction-history continuity gaps.

## Operator / product outcome

DROWK can safely reuse the same source conversation across replay and can correct a
previously accepted participant projection without deleting history.

This protects future Relationship views from:
- splitting one source conversation into duplicate CRM containers;
- retaining an obsolete Person link as if it were still the current participant;
- hiding the attributable history of how participant resolution changed.

## Scope

Implement only:

1. idempotent source-derived Conversation claim/get-or-create behavior;
2. database uniqueness/authority for namespaced source Conversation identity;
3. append-only ActivityParticipant supersession/retraction;
4. deterministic current-participant projection.

No Relationship object is part of this package.

## Canonical invariants

Preserve:

- provider thread/reference != universal Conversation identity;
- source Conversation identity is namespaced and channel-scoped;
- exact source replay must not create another canonical Conversation;
- conflicting context for an already-claimed source Conversation fails closed;
- manual/internal Conversation without source refs may remain independently created;
- ActivityParticipant history is append-only;
- correction != destructive rewrite;
- retraction may return a source participant to unresolved state;
- a corrected Person link still requires canonical Identity authority;
- one accepted participant version has at most one direct successor;
- supersession must remain within the same tenant and Activity;
- source participant lineage/role must not silently jump to a different source subject;
- current participant state is a projection over attributable history;
- Relationship/BuyerRole/trust/permission/readiness are not inferred here.

## Conversation source identity

For source-derived Conversation, define deterministic identity using:

- tenant;
- channel;
- sourceNamespace;
- sourceConversationRef.

Required behavior:
- sourceNamespace/sourceConversationRef remain an all-or-none pair;
- same exact source identity + same accepted context returns the same Conversation;
- same raw thread/ref under another namespace may coexist;
- another channel does not become the same canonical Conversation merely from the
  raw provider ref;
- same claimed source identity with conflicting Account/Facility or other accepted
  immutable context fails closed rather than silently rewriting;
- direct SQL cannot create a duplicate source-derived Conversation;
- source-less/manual Conversation remains allowed and is not forced into provider
  identity semantics.

Repository may expose a focused method such as
`claimSourceConversation` / `getOrCreateSourceConversation`; naming is secondary
to deterministic semantics.

## ActivityParticipant correction history

Extend ActivityParticipant with the minimum history needed to correct accepted
participant projection without update/delete.

Expected semantics:
- existing participant row remains immutable;
- successor row may supersede one earlier participant row;
- one predecessor has at most one direct successor;
- successor belongs to the same tenant and Activity;
- source-derived successor preserves the same source participant namespace/ref and
  participant role;
- successor may:
  - replace Person/Identity with another safely resolved canonical Identity/Person;
  - retract resolution back to Person=null / Identity=null while preserving source
    participant lineage;
- arbitrary Person-only source linkage remains forbidden;
- no Person/Identity is created implicitly;
- original row remains queryable for audit.

Expose both:
- full participant history for an Activity;
- deterministic current participant projection containing only chain heads.

Do not silently change the semantics of already accepted Activity itself.

## Persistence target

Use the next forward-only migration after
`0009_commitment_single_successor.sql`.

Expected changes:
- source-derived Conversation uniqueness/claim support;
- ActivityParticipant supersession/retraction fields/constraints/indexes needed for
  append-only correction.

Database requirements:
- tenant-consistent foreign keys;
- source Conversation uniqueness enforced below the repository;
- participant successor stays in the same Activity/tenant;
- one successor per participant predecessor;
- existing accepted history remains valid;
- no destructive rewrite migration.

## Repository/domain target

Minimum repository behavior:
- claim/get source-derived Conversation idempotently;
- preserve existing manual Conversation creation semantics;
- append participant correction/retraction;
- list participant history;
- list current participant projection;
- deterministic replay/conflict handling.

Pure domain sensors for:
- namespaced source Conversation identity;
- source Conversation context conflict;
- participant replacement;
- participant retraction to unresolved;
- current-head projection;
- single-successor semantics;
- Person/Identity authority after correction.

## Required synthetic golden cases

At minimum:

1. exact source Conversation replay returns the same Conversation;
2. exact replay does not append another source Conversation;
3. same raw thread/ref under another namespace may coexist;
4. same source ref under another channel is not silently unified;
5. source identity replay with conflicting Account context fails closed;
6. source identity replay with conflicting Facility context fails closed;
7. direct SQL duplicate source Conversation fails;
8. manual/source-less Conversations may coexist;
9. participant correction preserves original row;
10. safely resolved Person/Identity may supersede prior unresolved participant;
11. safely resolved Person/Identity may supersede an earlier resolved participant;
12. retraction may supersede a resolved participant back to unresolved;
13. Person-only source correction without Identity fails closed;
14. successor cannot cross tenant;
15. successor cannot cross Activity;
16. source participant namespace/ref cannot silently change across correction;
17. role cannot silently change across correction;
18. second sibling successor for same participant predecessor fails closed;
19. participant-history query returns prior + successor;
20. current-participant projection returns only chain heads;
21. no Relationship/BuyerRole/Commitment mutation is introduced;
22. no Gmail SDK/live network/model/provider/outbound/deployment authority.

## Explicit non-goals

Not in DCRM-04E:
- Relationship implementation or scoring;
- BuyerRole;
- Commitment redesign;
- Commitment fulfillment;
- Gmail `connectorRef` durability decision;
- live Gmail/OAuth;
- Inbox UI;
- warm introductions;
- AIsa/model/JEV;
- Work persistence writer;
- outbound/draft/send;
- A3/A4;
- deployment.

## Completion contract

DCRM-04E may close only when:
- next forward-only migration and migration sensors are green;
- source-derived Conversation replay is idempotent below repository level;
- conflicting source Conversation context fails closed;
- manual/source-less Conversation behavior is preserved;
- ActivityParticipant correction/retraction is append-only;
- participant successor is single-branch, same-tenant and same-Activity;
- source-derived Person correction cannot bypass canonical Identity authority;
- current-participant projection is deterministic and sensor-backed;
- no Relationship/model/provider/live-writer scope exists;
- exact-head GitHub CI is green;
- ChatGPT deep review has no blocking finding;
- owner explicitly authorizes merge;
- post-merge CI is green.

## Writer / authority boundary

Once handed off on a dedicated feature branch:
- Codex is sole implementation writer;
- ChatGPT reviews GitHub and does not edit implementation surfaces;
- PWM_CRM remains read-only unless a concrete legacy question requires inspection;
- no merge, deploy, live provider or outbound action without explicit owner gate.
