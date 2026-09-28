# Post-DCRM-04C commitment-memory checkpoint — 2026-09-28

Status: COMPLETE  
Inspected foundation: `136525a8c6443f6a6b3a83d73181d809613527b7`

## Result

DCRM-04C closed the accepted-interaction gap.

Executable now includes:
- Account / Facility;
- Person / canonical Identity / temporal Employment / Contact -> Person;
- SourceObservation / Evidence / EntityMatchDecision;
- Conversation / Activity / ActivityParticipant;
- deterministic Work.

The remaining canonical relationship-memory objects are:
- Relationship;
- Commitment;
- Buyer Role.

Buyer Role remains intentionally aligned with DCRM-07 Buyer + Procurement Graph.
Employment/title alone must not create commercial authority.

## Why Commitment is the next dependency

Accepted Activity now gives communication-derived memory an attributable CRM anchor.
The deterministic Work Engine already knows how to express what should happen next,
but the executable model still cannot represent the bilateral fact that caused that
work:

- who requested/promised what;
- which side owes the next move;
- account/facility/commercial context;
- date or condition when known;
- whether the commitment is merely suggested, confirmed, fulfilled, declined or
  unresolved.

Without a Commitment object, those facts risk being flattened into Task/Work state.
That would violate the canonical rule:

`Commitment != Task != WorkItem`

Relationship is still required, but implementing it before Commitment would push
important "who owes what" semantics into relationship state or opaque derived
summaries. A later Relationship package can consume attributable Activity,
Commitment and Outcome history without becoming a giant graph or trust score.

## Selected next dependency

**DCRM-04D — Commitment Memory Foundation**

The slice is intentionally narrow:
- canonical Commitment contract;
- accepted Activity/Evidence/Policy lineage;
- explicit counterparty Person linkage when known;
- calendar-date/condition preservation without invented timestamps;
- append/supersede history;
- deterministic replay/conflict semantics;
- no model extraction and no Work writer.

## Still deferred

After DCRM-04D:
- Relationship remains required and should be re-evaluated against the executable
  Activity + Commitment model;
- Buyer Role remains DCRM-07;
- Commitment fulfillment/outcome attribution remains richer DCRM-11 territory;
- live Gmail remains separately gated.

Carry forward the DCRM-04C non-blocking gates:
1. Conversation source-identity idempotency before live Gmail/Relationship use;
2. `connectorRef` durability proof before live Gmail ingestion;
3. participant supersession/retraction before richer relationship correction flows.
