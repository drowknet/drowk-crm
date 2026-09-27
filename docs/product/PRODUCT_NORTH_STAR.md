# DROWK CRM Product North Star

Status: OWNER-APPROVED PRODUCT DIRECTION
Date: 2026-09-27

## Mission

Build a single Revenue & Relationship Operating System where an operator can:
- discover the market worth pursuing;
- detect new commercial perspectives and timing signals;
- understand accounts, facilities and buyer/procurement structure;
- preserve relationship history and evidence over time;
- manage conversations and opportunities;
- know what needs attention now;
- research missing information without leaving the operating context;
- prepare and eventually execute bounded actions under explicit authority;
- learn from outcomes.

The product should remove the need to assemble a fragile stack of prospecting,
enrichment, CRM, inbox, research, pipeline and task tools just to understand what
to do next.

## Core product promise

DROWK should answer five questions continuously:

1. Who matters?
2. Why do they matter now?
3. What do we actually know, and what is still missing?
4. What should happen next?
5. What happened after we acted?

Product expression:

DROWK tells you who matters, why they matter now, what you know, what you are
missing, and what you should do next.

## One operating loop

Market
-> Target Universe
-> Accounts / Facilities
-> People / Buyer Graph
-> Evidence + Signals
-> Opportunity / Relationship detection
-> Conversations
-> Work / Next Best Action
-> Pursuits / Pipeline
-> Human / Bounded Execution
-> Outcomes
-> Learning

The user should experience this as one coherent system even though the architecture
keeps source, evidence, identity, policy, work and action boundaries separate.

## Product ambition

DROWK is not intended to be another generic CRM with more menus.

The target is a system that combines the useful operating surfaces people expect
from modern CRM/prospecting products while reducing fragmentation and cognitive
load.

The product should be:
- broader in commercial context than a conventional CRM;
- more relationship-aware than a campaign-centric outreach tool;
- more evidence-aware than an enrichment database;
- more action-oriented than a reporting dashboard;
- more deterministic and auditable than an AI-first black box;
- simpler at the surface than the system beneath it.

Market leadership is an aspiration, not a claim. We earn it through operator speed,
decision quality, trustworthy context, low-friction workflows and measurable
outcomes.

## Persistent relationship intelligence

A relationship is a durable asset, not a pipeline row.

DROWK must preserve useful context across:
- campaigns;
- opportunity stages;
- company changes;
- long periods without an active pursuit;
- channels;
- buyer/procurement role changes;
- positive, negative and ambiguous interactions.

A person may move from discovered evidence to candidate identity to verified contact
to conversation to dormant relationship to new-company signal to renewed pursuit
without losing attributable history.

## New Perspectives

The system should proactively surface high-value perspectives instead of requiring
the operator to repeatedly ask what to search for.

Examples:
- a newly discovered account matching territory/ICP;
- a new facility or expansion signal;
- a procurement route becoming visible;
- a known relationship moving to a new company;
- a buyer role becoming vacant or newly identifiable;
- an old relationship becoming commercially relevant again;
- a combination of weak signals becoming strong enough for review.

Every surfaced perspective should explain:
- why it appeared;
- evidence used;
- what is unknown;
- freshness;
- recommended next step;
- autonomy/approval boundary.

No signal automatically becomes an Opportunity.

## Today is a cockpit, not a report

The default operator experience should prioritize actionable state such as:
- replies needing review;
- overdue work;
- ready-to-act items;
- blocked work;
- waiting/scheduled work;
- accounts with newly material signals;
- relationships becoming stale;
- opportunities requiring attention.

Reports and analytics remain important but should not displace current work.

## Account as the commercial workspace

An Account workspace should unify, without collapsing truth boundaries:
- overview;
- facilities;
- people/buyer graph;
- conversations;
- signals;
- pursuits/opportunities;
- work;
- evidence;
- research gaps;
- outcome history.

The operator should be able to ask:
- Why now?
- Who matters here?
- What are we missing?
- What changed?
- What should I do next?

## AIsa as ambient intelligence

AIsa is not a separate chatbot that owns business truth.

It should appear contextually where a decision exists and may:
- summarize;
- identify evidence gaps;
- research;
- compare;
- suggest;
- prepare drafts;
- explain recommendations.

Authority remains with deterministic policy and explicit human/approved action.

AIsa output must preserve source/evidence linkage, uncertainty where applicable,
provider/run lineage, cost/freshness and autonomy class.

## Product truths that must remain visible

Evidence != CRM Truth
Signal != Opportunity
Candidate != Match
Contact != Source Identity
Work != Activity History
AI Suggestion != Authority
Draft != Sent
Sent != Delivered
Unknown != No

Complexity may be hidden until needed; semantic distinctions may not be hidden.

## Progressive intelligence

Research should deepen only when expected value justifies it:

cheap deterministic filters
-> inexpensive evidence
-> multi-source triangulation
-> deeper research
-> human-reviewed pursuit

The operator should not need to choose providers manually for ordinary work. DROWK
asks for capabilities and returns attributable Evidence.

## Single-place experience

The intended product surface converges:
- Today;
- Inbox / Conversations;
- Work;
- Accounts;
- Contacts / Relationships;
- Pipeline / Pursuits / Opportunities;
- Research;
- New Perspectives / Signals;
- Automations / Cadences;
- Reports;
- Settings / Policies.

These are views over one operating model, not isolated mini-products.

## What we deliberately do not optimize for

Do not chase:
- maximum menu count;
- maximum dashboard count;
- fields/configuration for their own sake;
- autonomous mass outbound;
- opaque AI recommendations;
- fake pipeline volume;
- automatic fuzzy identity merges;
- duplicated provider organization/role models;
- infrastructure work with no plausible product consequence.

## Work-package product test

Every material future work package should answer:

1. Which operator outcome does this unlock or protect?
2. Where will the capability appear in the operating experience?
3. What canonical object/evidence boundary does it depend on?
4. What can go wrong, and how does it fail closed?
5. Does it reduce fragmentation or add another surface?
6. Can success be measured with a sensor, user outcome or both?

Infrastructure-only work is valid when it protects an explicit product invariant or
unblocks a named operator outcome. It should not become the roadmap by default.

## Product success signals

As the product becomes usable, measure at least:
- time from signal/reply to correct operator action;
- percentage of work items with explainable source/evidence lineage;
- relationship context recovered without manual cross-tool search;
- false-positive opportunity/signal rate;
- research cost per useful evidence gap closed;
- operator edits/overrides to AI suggestions;
- stale/overdue work reduction;
- outcome attribution coverage;
- cross-tenant/security sensor health.

The goal is not only feature parity. The goal is a faster, clearer and more
trustworthy commercial operating loop.
