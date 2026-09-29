# Post-DCRM-04F capability-lab checkpoint — 2026-09-28

Status: COMPLETE  
Inspected foundation: `a9690e8ff8ff898b2769eac378dde44838794bc5`

## Result

The relationship-memory foundation series is complete.

Executable core now includes:
- Account / Facility;
- Person / canonical Identity / temporal Employment / Contact -> Person;
- SourceObservation / Evidence / EntityMatchDecision;
- Conversation / Activity / ActivityParticipant with correction history;
- Commitment with current-participant authority;
- Relationship with attributable ACTIVITY / RECIPROCAL / MEANINGFUL memory;
- deterministic Work.

No additional DCRM-04 structural object is required before returning to the main roadmap.

BuyerRole remains intentionally aligned with DCRM-07 because it is commercial
authority scoped to Account/Facility/Pursuit/procurement context rather than a
generic relationship-memory property.

## Next roadmap phase

The next canonical roadmap phase is:

**DCRM-05 — AIsa Capability Lab**

The repository already contains:
- provider-neutral `ResearchRun` / `ProviderRun` contracts;
- `research_runs` / `provider_runs` foundation tables;
- provider-neutral capability architecture;
- a provider evaluation protocol;
- an AIsa capability boundary document.

What is still missing is an executable, deterministic lab harness over those
contracts and persistence primitives.

## Selected next dependency

**DCRM-05A — Capability Lab Harness**

This first DCRM-05 slice is deliberately synthetic and READ-only.

It should prove:
- typed provider-neutral capability requests;
- deterministic request/response fingerprints;
- durable ResearchRun / ProviderRun persistence;
- explicit PRESENT / EMPTY_WITHIN_RESPONSE / UNKNOWN / ERROR / PENDING / PARTIAL semantics;
- cost-known vs cost-unknown handling;
- provenance / rights / latency capture;
- bounded research budgets and stop conditions;
- provider/capability-cell evaluation without a universal provider score.

Synthetic fixtures do **not** count as `LIVE_VALIDATED_CAPABILITY`.

## Why live providers are not in 05A

The product canon requires documented capability to remain distinct from live
validation, and provider outputs must enter evidence boundaries without silently
mutating CRM truth.

Before credentials or network probes are enabled, the lab itself must prove:
- deterministic audit records;
- budget enforcement;
- result-state semantics;
- immutable ProviderRun history;
- provider-neutral replacement boundaries.

A later explicit DCRM-05 live-validation gate may authorize selected READ-only
providers/capability cells after rights, credentials, cost and security review.

## Still deferred

- any WRITE provider capability;
- live Gmail/OAuth;
- live enrichment/research credentials in 05A;
- provider preference/winner decisions based only on documentation or synthetic fixtures;
- canonical Account/Person/Facility mutation from provider output;
- BuyerRole/procurement graph until DCRM-07;
- Signal Fusion until DCRM-08;
- outbound/draft/send/A3/A4/deployment.
