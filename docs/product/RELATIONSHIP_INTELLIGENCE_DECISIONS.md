# DROWK CRM — Relationship Intelligence Decisions

Status: CANONICAL PRODUCT / ARCHITECTURE DIRECTION
Date: 2026-09-27
Basis: owner-provided Market/Product/UX and Relationship Intelligence research,
reviewed against the executable DROWK CRM repository after DCRM-03A closure.

This document promotes only the research conclusions that materially affect future
product and architecture decisions. It does not import competitor feature sets and
does not authorize implementation beyond the active work package.

## Core decision

DROWK should make the transition from attributable relationship context to the
correct next commercial action reliable and simple.

The product should help an operator answer who matters, why now, what is known,
what is missing, who owes the next move, what should happen next and what happened
afterward.

The differentiation target is execution coherence, especially around physical
facilities, procurement routes, relationship continuity, commitments and bounded
research of evidence gaps.

## Canonical relationship-memory distinctions

Future modeling and UX must preserve:
- Person — durable human subject across time;
- Identity — source/channel manifestation, possibly uncertain or historical;
- Employment — professional context with a temporal interval;
- Contact — operational CRM representation, not universal person identity;
- Relationship — attributable relationship history;
- Buyer Role — commercial authority/context for a specific scope and period;
- Commitment — request, promise or agreed next step;
- Conversation / Interaction / Activity — observed communication/business events;
- Evidence — attributable basis for a claim;
- Outcome — observed result distinct from prior decision context.

Person != Contact != Identity.
Commitment != Task != WorkItem.

## Job-change rule

When a person changes employer, preserve the Person and historical Identities,
keep prior conversations/evidence attached to their original organization/context,
do not copy buyer authority or confidential old-account context forward, and do not
silently reset contact restrictions. Surface both possible new-company re-engagement
and the coverage gap in the old organization.

## Relationship state

Do not create a universal opaque relationship-strength/trust score.

Explainable components may include significant recency, reciprocity, continuity,
contextual depth, team relationship coverage and dated/scoped human assessment.

Keep relationship health, readiness/timing, observation coverage and
permission/restrictions separate.

## Significant interaction and two clocks

Keep distinct:
- latest activity;
- latest reciprocal interaction;
- latest meaningful interaction/decision;
- latest buyer-confirmed progress.

Automated outbound must not create artificial reciprocity or relationship strength.
Seller effort must not reset the buyer-progress clock.

## Commitment memory

A Commitment should preserve who requested/promised what, who owes the next move,
account/facility/commercial context, date/condition when known, evidence and state
such as suggested, confirmed, fulfilled, declined or unresolved.

Internal Task/Work completion does not prove counterparty fulfillment.

## Observation coverage

Distinguish no observed event, no accessible event, source disconnected, period not
covered, identity unresolved and evidence absent. Unknown != No. Inaccessible
evidence must not leak through search, summaries, graphs or AI-derived metadata.

## Account / Facility procurement path

Future commercial context should represent who experiences the problem, specifies,
influences, authorizes and contracts; vendor-registration/portal route;
facility/region/service scope; and unresolved links. A graph is optional.

## Warm introductions

Known connection != willingness to introduce. Future flows should distinguish
possible path, verified relationship, intermediary availability/permission,
request preparation/sent, accepted/declined, introduction made and outcome.

## AIsa

AIsa should resolve a named evidence gap in context and expose objective, missing
evidence, capability depth, budget/cost boundary, evidence returned, conflicts,
stopping reason and unresolved unknowns. "Still unknown" is a valid result.

## Deliberate deferrals

Do not use this research to justify early omnichannel capture, a giant relationship
graph, opaque universal scoring, opportunity creation from every signal, AI on every
field, unlimited customization, learned scoring before outcomes or higher autonomy
before evidence supports it.

## Consequence for the current engineering sequence

DCRM-03A is closed. DCRM-04A remains the next implementation gate and stays focused
on deterministic Work Engine parity. It must preserve the semantic boundary around
Commitment, relationship facts, coverage and buyer progress without implementing
the entire relationship-memory model.

After DCRM-04A parity is green, inspect executable dependencies and open the
smallest relationship-memory foundation package needed before richer
buyer/procurement, research and relationship UX.
