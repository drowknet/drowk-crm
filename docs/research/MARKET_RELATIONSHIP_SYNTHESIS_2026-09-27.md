# Market + Relationship Intelligence Synthesis — 2026-09-27

Status: PRODUCT RESEARCH — INCORPORATION CANDIDATE
Source: owner-provided external-agent research
Canonical product direction remains:
- `docs/product/PRODUCT_NORTH_STAR.md`;
- `docs/product/UX_OPERATING_MODEL.md`.

## Executive decision

The two research tracks reinforce the existing DROWK direction rather than replace it.

The strongest opportunity is not feature-count parity. It is to make the transition
from attributable relationship context to the correct next commercial action clearer,
safer and faster than fragmented prospecting/CRM stacks.

The research adds several product concepts that are not yet explicit enough in the
canonical roadmap and should be considered for incorporation after the active
DCRM-03A implementation gate closes.

## High-value product deltas

### 1. Relationship memory should be first-class and temporal

Future product modeling should keep these concepts distinct:

- Person;
- Source Identity;
- Employment;
- Organization;
- Relationship;
- Interaction;
- Conversation;
- Buyer Role;
- Commitment;
- Relationship Owner;
- Introduction Path;
- Signal;
- Evidence;
- Outcome.

`Contact` should remain an operational CRM representation, not the universal
identity of a person.

A job change must not:
- create a new human identity by default;
- move old conversations into the new company's context;
- copy buyer authority into the new role;
- erase the gap left in the former account;
- silently relax prior contact restrictions.

### 2. Relationship state should be multidimensional, not one score

Do not optimize for a universal relationship-strength number.

Useful explainable dimensions include:
- significant recency;
- reciprocity;
- continuity across time/context;
- contextual depth;
- team relationship coverage;
- dated human assessment.

Keep separate:
- relationship health;
- readiness/timing to re-engage;
- observation/coverage quality;
- contact permission/restrictions.

A priority ordering may be task-specific, but it must not masquerade as objective
human trust.

### 3. Significant interaction != activity

Product surfaces should distinguish at least:
- latest activity;
- latest reciprocal interaction;
- latest meaningful interaction/decision;
- latest buyer-confirmed progress.

Automated outbound must not make a relationship appear active.
Seller activity must not reset the apparent clock of buyer progress.

### 4. Commitments deserve first-class memory

A commercially useful system should represent:
- who promised/requested what;
- who owes the next move;
- context/account/facility;
- expected date or condition;
- evidence for completion;
- whether the item was suggested, confirmed, fulfilled, declined or unresolved.

This is more actionable than generic reminders and should eventually integrate with
the deterministic Work Engine.

### 5. Observation coverage is a product state

The UX must distinguish:
- no observed event;
- no accessible event;
- source disconnected;
- period not covered;
- identity unresolved;
- evidence absent.

`Unknown != No` applies to relationship intelligence as strongly as to CRM truth.

Source coverage, permission scope and last synchronization should be inspectable
without exposing restricted content.

### 6. Warm introduction needs a state machine, not an edge

Potential future states:
- possible path;
- verified relationship;
- intermediary availability unknown;
- request prepared;
- request sent;
- intermediary accepted/declined;
- introduction made;
- recipient response/outcome.

A known relationship does not imply willingness to introduce.
A possible path does not imply a warm relationship.

### 7. Account/facility workspace should expose procurement path

A buyer graph is insufficient for service businesses when purchasing can differ by
facility, region, third-party manager or central procurement.

Future workspace should be able to answer:
- who experiences the problem;
- who specifies the service;
- who influences;
- who authorizes;
- who contracts;
- where vendor registration occurs;
- which facility/region/service scope applies;
- which link remains unknown.

This strengthens the existing DCRM-06/07 direction.

### 8. AIsa should resolve the next evidence gap

AIsa research should start from a named uncertainty, not a blank prompt.

A bounded research action should communicate:
- question/objective;
- missing evidence;
- planned capability depth;
- budget/cost boundary;
- evidence returned;
- conflicts;
- stopping reason;
- unresolved unknowns.

"Still unknown" is a valid outcome.

### 9. Product UI patterns worth preserving

Strong patterns to consider:
- Today/My Day as short decision queue;
- split Inbox with commercial context;
- meaningful-events timeline plus complete raw history;
- Account/Facility workspace;
- saved Smart Lists with inclusion reason;
- global search/command palette;
- side-drawer identity/evidence review;
- Board/List pipeline with buyer-progress state;
- before/after meeting brief with reviewable commitments;
- contextual AIsa actions;
- identity/duplicate review that allows "unknown" and "do not merge";
- lightweight mobile triage and browser capture only when core workflow is proven.

### 10. Reporting must separate effort, progress and outcome

Future reporting should distinguish:
- operator effort/activity;
- buyer-confirmed progress;
- commercial result;
- result still unknown;
- evidence/coverage quality;
- cost of research;
- signal usefulness.

Association between a signal/action and a later outcome is not automatically causal.

## Candidate product experiences to validate

The following scenarios are stronger acceptance tests than feature-count comparisons:

1. Person changes employer/email; DROWK preserves the person and separates old/new
   organization context.
2. Heavy outbound receives no response; relationship state does not become stronger.
3. A healthy annual relationship does not become "cold" because of a universal
   30-day rule.
4. Inbox receives "talk to procurement next month"; system captures responsibility,
   timing and evidence without creating an Opportunity automatically.
5. AIsa cannot find a buyer; state remains "responsible not confirmed", not
   "there is no responsible person".
6. A mailbox/source is disconnected; lack of observations does not become lack of
   relationship.
7. Seller sends many touches but buyer makes no progress; both clocks remain visible.
8. A colleague knows a person but declines to introduce; path is not shown as
   available.
9. A job change creates two review questions: new-company re-engagement and old-account
   coverage gap.
10. A restricted relationship/evidence source does not leak through search, summary,
    graph or AI-derived metadata.

## Deliberate non-goals / anti-bloat rules

Do not respond to the benchmark by building:
- one giant social/relationship graph;
- a universal opaque relationship score;
- automatic capture of every possible channel;
- a separate top-level module for each signal/source;
- opportunity creation from every interesting event;
- AI badges/summaries on every field;
- custom-object/configuration work before first operator value;
- expanded autonomy before outcome evidence exists.

## Roadmap implications to evaluate after DCRM-03A

Do not renumber the roadmap while an implementation gate is active.

After DCRM-03A closes, evaluate these additions:

- DCRM-04 Work Engine: add commitment/obligation semantics where legacy evidence
  supports them, while keeping Work distinct from relationship facts.
- DCRM-06 Territory/Target Universe: make Facility a first-class qualification and
  procurement-scope dimension.
- DCRM-07 Buyer + Procurement Graph: extend explicitly to Employment continuity,
  Relationship evidence, Relationship Owner, introduction paths and committee
  continuity.
- DCRM-08 Signal Fusion: add contraindications, coverage quality and buyer-progress
  evidence; avoid one-dimensional readiness scores.
- DCRM-09 Briefs/Cadences: include meaningful-interaction timeline, commitments,
  expected rhythm and reviewable meeting outputs.
- DCRM-11 Outcome Intelligence: track introduction outcomes, commitment fulfillment,
  reactivation quality and unresolved/unknown results without claiming causality.

Potentially create a dedicated relationship-memory work package before rich UI if
the canonical model still lacks Person/Employment/Relationship/Commitment concepts.

## Product test for superiority

Do not claim superiority from breadth.

Demonstrate it by measuring:
- time to understand an account/facility;
- time to identify the correct next action;
- identity correction rate;
- false relationship claims;
- false opportunity/signal promotions;
- accepted vs corrected AI suggestions;
- commitments fulfilled;
- reactivations with valid timing/reason;
- warm introductions actually accepted;
- research cost per useful evidence gap closed;
- operator context switches avoided;
- permission/privacy incidents.

The benchmark target is a coherent decision loop, not a longer feature checklist.
