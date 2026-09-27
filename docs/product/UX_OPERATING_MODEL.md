# DROWK CRM UX Operating Model

Status: OWNER-APPROVED UX DIRECTION
Date: 2026-09-27

## UX principle

The surface should feel simpler than the architecture underneath it.

Use familiar CRM/operations patterns where they reduce learning cost, but do not
copy another product's information architecture blindly.

The operator should rarely need to ask:
- where did this information come from?
- which tool do I open next?
- why is this account important?
- what should I do now?
- did the system actually send/do this?

Those answers should be present in context.

## Primary navigation

Target top-level information architecture:

Today
Inbox
Work
Accounts
Contacts
Pipeline
Research
Perspectives
Automations
Reports
Settings

Navigation labels can evolve with usability evidence. Avoid adding top-level modules
for implementation details.

## Global command/search

A universal command/search surface should eventually support:
- Account lookup;
- Contact/relationship lookup;
- Conversation lookup;
- Work lookup;
- Opportunity/Pursuit lookup;
- evidence/signal lookup where appropriate;
- direct navigation;
- common safe commands.

The operator should be able to move across the product without remembering where an
object lives.

## Today

Today is the default operational cockpit.

It should prioritize:
- Needs You;
- Replies;
- Overdue;
- Ready;
- Needs Human Review;
- Blocked;
- Waiting;
- Scheduled;
- material new perspectives/signals.

Sorting comes from deterministic Work/attention semantics, not from whatever event
happened most recently.

Dashboards/charts belong in Reports unless they directly change today's decision.

## Inbox

Inbox should be conversation-oriented but decision-aware.

Useful filters:
- all;
- replies;
- needs review;
- waiting;
- commercial relevance review;
- noise/system.

A selected conversation should expose bounded context alongside it:
- Account;
- Contact/identity state;
- related Pursuit/Opportunity;
- recent relationship history;
- procurement route;
- open Work;
- relevant Evidence;
- AIsa actions such as summarize/research/draft.

Mailbox state is evidence, not commercial truth.

## Accounts

Account is the main commercial workspace.

Suggested tabs/views:
- Overview;
- People;
- Facilities;
- Conversations;
- Signals;
- Pursuits / Opportunities;
- Work;
- Evidence.

The overview should emphasize:
- why now;
- relationship state;
- buyer/procurement coverage;
- current Work;
- material signals;
- missing evidence;
- active pursuit/opportunity state.

Avoid vanity scores without explainable components.

## Contacts / Relationships

The Contact surface should show the durable relationship, not just contact fields.

Useful dimensions:
- verified/candidate identities;
- current/previous company context;
- conversation history;
- relationship outcomes;
- known objections/interests;
- buyer/procurement role evidence;
- open Work;
- recent/new signals.

A company change should not erase prior relationship context.

## Pipeline

Preserve a familiar Board/List experience for actual Pursuits/Opportunities.

Support saved views such as:
- My opportunities;
- Needs attention;
- No material activity;
- High value;
- Procurement route known;
- Evidence incomplete.

Do not put raw Signals in Opportunity stages.

Promotion path should remain conceptually:

Signal / Perspective -> Review -> Pursuit -> Opportunity

with explicit policy/human gates.

## Perspectives

Perspectives surfaces newly meaningful commercial possibilities.

Each card/item should answer:
- what surfaced;
- why;
- evidence;
- freshness;
- missing information;
- current relationship context;
- recommended action;
- autonomy level.

Primary actions may include:
- Investigate;
- Watch;
- Dismiss with reason;
- Create/attach bounded Work;
- escalate to Pursuit review when policy allows.

Dismissal is feedback, not deletion of source evidence.

## Work

Work is not a generic task list.

Each Work item should make clear:
- next action;
- why;
- subject;
- due/waiting state;
- attention class;
- owner;
- blocker/evidence needed;
- autonomy level;
- approval/human-review state;
- source refs/freshness when expanded.

The UI should make WAITING, SCHEDULED, BLOCKED and NO_ACTION visibly different from
NEEDS_ACTION.

## Research

Research begins with an evidence gap, not a blank search box.

The operator should see:
- objective;
- missing evidence;
- allowed capability depth;
- estimated/actual cost when relevant;
- sources/evidence returned;
- unresolved ambiguity;
- stopping reason.

Provider names may be visible in provenance/detail but should not drive the ordinary
operator workflow.

## AIsa interaction model

AIsa is ambient and contextual.

Preferred actions:
- Why now?
- What changed?
- Summarize this relationship.
- What are we missing?
- Research the missing buyer role.
- Explain this recommendation.
- Draft a response.
- Compare these candidates.

AIsa may suggest or prepare according to autonomy policy; it never silently upgrades
its own authority.

## Progressive disclosure

Default screens show:
- operator-relevant state;
- next action;
- key evidence summary;
- clear uncertainty.

Expanded detail may show:
- provenance;
- source IDs;
- provider run;
- fingerprints;
- policy version;
- timestamps;
- supersession;
- technical audit.

Do not force operators to read audit internals to complete normal work.

## Interaction patterns

Prefer:
- side drawers/overlays for quick Contact/Conversation/Evidence inspection;
- split panes for Inbox and review workflows;
- Board/List toggles where both spatial and dense scanning are valuable;
- saved views/filters;
- command palette and keyboard shortcuts;
- inline explanation before modal dialogs.

Avoid:
- modal chains;
- hidden destructive actions;
- full-page navigation for trivial inspection;
- duplicate object editors;
- generic red/green confidence without explanation.

## Visual semantics

Use a consistent vocabulary for knowledge/authority states:

VERIFIED
OBSERVED
INFERRED
UNKNOWN
REVIEW
HUMAN REQUIRED

The precise visual system will be designed later, but status must never depend on
color alone.

## Operator speed

Common workflows should minimize context switching:
- reply review -> context -> research gap -> draft;
- account review -> buyer gap -> research -> Work;
- perspective -> evidence -> Pursuit review;
- opportunity -> stale relationship -> next action;
- Work -> supporting conversation/evidence -> completion/outcome.

The operator should be able to inspect context without losing their place.

## Trust and reversibility

Every consequential UI action should communicate:
- what will change;
- whether it is internal or external;
- whether approval is required;
- whether it can be reversed;
- whether execution is confirmed or uncertain.

For external actions:
- prepared != dispatched;
- dispatched != accepted;
- accepted != delivered;
- unknown outcome requires reconciliation.

## Responsive and accessible baseline

The primary operator experience is desktop-dense but should remain usable on smaller
screens for review/triage.

Baseline expectations:
- keyboard-operable primary workflows;
- semantic labels;
- visible focus;
- non-color-only status;
- readable density;
- predictable placement of actions;
- no critical context available only on hover.

## Design acceptance test

Before a new major UI surface is approved, ask:
1. What operator decision does it serve?
2. Can the user understand why without leaving the surface?
3. Can evidence/uncertainty be inspected without cluttering the default view?
4. Does it reuse an existing object/view instead of inventing a duplicate module?
5. Does it preserve the canonical authority boundaries?
6. Can an experienced operator move quickly with keyboard/search/saved views?
