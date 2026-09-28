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

DCRM-03A and DCRM-04A are closed with post-merge CI green.

The post-parity executable inspection confirms the product canon is ahead of the
runtime relationship model. Account/Facility, minimal Contact, Evidence,
IdentityEvidence/EntityMatchDecision and Work exist; canonical Person, Identity,
Employment, Relationship, Buyer Role and Commitment do not yet exist as executable
objects.

The smallest next dependency is durable human continuity: Person + canonical
Identity + temporal Employment, including explicit Contact -> Person linkage.
Relationship, Buyer Role and Commitment remain required product concepts, but they
should build on that foundation rather than be scope-smuggled into one giant graph
package.


## Post-DCRM-04B executable consequence — 2026-09-28

DCRM-04B is closed with post-merge CI green and now provides durable Person,
canonical Identity, temporal Employment and explicit Contact -> Person linkage.

The next executable dependency is accepted interaction history. Conversation,
Activity and ActivityParticipant are canonical product concepts but are not yet
implemented. Gmail still correctly stops at Observation/Evidence/candidate state.

Relationship recency/reciprocity and communication-derived Commitment state must not
skip this boundary by treating provider message/thread refs as accepted CRM truth.

DCRM-04C is therefore selected as the next foundation:
Conversation + Activity + ActivityParticipant + explicit evidence/policy-controlled
promotion. Relationship, Commitment and BuyerRole remain later explicit gates.


## Post-DCRM-04C executable consequence — 2026-09-28

DCRM-04C is closed with post-merge CI green and now provides accepted
Conversation/Activity/ActivityParticipant history with Observation/Evidence/Policy
lineage and safe source-participant Person linkage.

The next smallest relationship-memory dependency is Commitment.

The Work Engine can already say what should happen next, but without Commitment the
system cannot preserve who requested/promised what, which side owes the next move,
the account/facility context, date/condition and confirmation state without
flattening those facts into Task/Work state.

DCRM-04D is therefore selected as Commitment Memory Foundation.

Relationship remains required after Commitment and must stay attributable,
explainable and free of a universal trust score. Buyer Role remains aligned with
DCRM-07 commercial authority/procurement scope.
