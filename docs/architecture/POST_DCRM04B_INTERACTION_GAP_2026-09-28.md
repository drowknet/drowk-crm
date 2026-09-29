# Post-DCRM-04B executable relationship-memory checkpoint — 2026-09-28

Status: COMPLETE  
Inspected foundation: `84c8de486695fb00497c3f3cb215f2051784b80e`

## Result

DCRM-04B closed the durable-human-continuity gap.

Executable now includes:
- Account / Facility;
- Person;
- canonical Identity;
- temporal Employment;
- Contact -> Person linkage;
- SourceObservation / Evidence;
- EntityMatchDecision;
- deterministic Work.

The next inspected gap is not yet Relationship, BuyerRole or Commitment.

The repository does **not** currently have canonical executable objects for:
- Conversation;
- Activity / Interaction;
- ActivityParticipant.

The Gmail connector intentionally stops at SourceObservation, derived candidate
classification and eligibility for downstream promotion. It explicitly states that
Gmail thread identity is not universal conversation identity and that its current
implementation does not promote directly into accepted CRM state.

## Why this matters

Relationship memory needs attributable interaction history before it can safely
derive or display:
- latest reciprocal interaction;
- latest meaningful interaction;
- continuity;
- relationship outcomes;
- interaction context across employer changes.

Commitment memory also benefits from a canonical interaction/source anchor when a
request, promise or agreed next step originates in communication.

Implementing Relationship first would therefore encourage refs or derived state that
skip the accepted interaction projection. That would weaken the existing
Observation -> Evidence -> accepted CRM boundary.

BuyerRole remains a later scoped commercial-authority concept. Job title or
Employment alone must not establish it.

## Selected next dependency

The smallest missing foundation is an accepted, provider-neutral interaction layer:

**Conversation + Activity + ActivityParticipant + explicit evidence/policy-controlled
promotion into accepted CRM projection.**

This is selected as DCRM-04C.

DCRM-04C is not an Inbox UI package and does not authorize live Gmail access.
It creates canonical interaction records that future Relationship, Commitment,
BuyerRole and UX can reference without treating provider threads/messages as CRM
truth.

## Still deferred

After DCRM-04C:
- Relationship remains required;
- Commitment remains required;
- BuyerRole remains required.

Their exact order should be re-evaluated against the executable model after DCRM-04C
rather than fixed now.

Do not infer:
- trust from communication volume;
- reciprocity from automated outbound;
- buyer authority from title;
- Commitment from ambiguous communication;
- cross-channel conversation identity from a Gmail thread.
