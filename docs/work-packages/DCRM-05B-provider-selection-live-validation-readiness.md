# DCRM-05B — Provider Selection & Live Validation Readiness

Status: RESEARCH/SELECTION GATE — NO LIVE CALL AUTHORIZED

## Purpose

Select the first real external provider/capability cell to validate through the
DCRM-05A Capability Lab without turning provider access into CRM truth or production
authority.

This package is complete only when the live-validation target and safety/rights/cost
envelope are explicit enough for a separate owner-authorized implementation handoff.

## Required selection tuple

Produce exactly one proposed tuple:

- capabilityId;
- workloadCell;
- provider;
- operation;
- interface;
- accessClass = READ;
- geography/locale;
- provider contract/version when exposed;
- auth mechanism;
- rightsClass;
- retention rule;
- maxCostUsdMicros per call;
- maxCostUsdMicros per ResearchRun;
- maxToolCalls;
- stopCondition;
- timeout/retry ceiling;
- source-native request/entity IDs available;
- retrievedAt semantics;
- observedAt semantics;
- response/result state mapping;
- normalized input schema;
- credential injection boundary;
- adapterVersion;
- kill/disable mechanism.

## Research requirements

For shortlisted providers, verify current public facts where available:
- API/interface availability;
- pricing or price-discovery mechanism;
- READ/WRITE classification;
- authentication shape;
- rate/usage constraints;
- data rights/retention terms relevant to the intended case;
- provider-native IDs/provenance;
- error/empty/partial semantics;
- geography/coverage constraints;
- whether AIsa mediation changes price, schema, rights or provenance.

Time-sensitive facts must be revalidated at the exact selection date.

## Selection criteria

Compare by capability cell only:
1. rights fit;
2. evidence/provenance quality;
3. deterministic request shape;
4. cost observability and boundedness;
5. coverage relevant to the cell;
6. freshness/time semantics;
7. error/empty distinction;
8. latency/reliability evidence;
9. replacement cost;
10. security/credential surface.

Do not compute a universal provider score.

## First-live preference

The first live case should be:
- READ-only;
- low cost;
- low data sensitivity;
- small request/response;
- easy to verify manually;
- useful for exercising PRESENT / EMPTY / ERROR / PARTIAL semantics;
- unable to mutate canonical CRM state.

## Explicit non-goals

Not authorized in this gate:
- making a live request;
- adding secrets/credentials;
- purchasing/enabling a provider plan;
- provider WRITE;
- Gmail OAuth/live;
- Account/Facility/Person/Relationship promotion;
- BuyerRole;
- Signal Fusion;
- outbound;
- deploy.

## Completion contract

DCRM-05B selection may close when:
- one exact live-validation tuple is documented;
- public/current provider facts supporting the tuple are cited in the research note;
- rights/retention/cost/security unknowns are explicit;
- credential storage/injection design is explicit;
- max cost/tool calls/timeout/kill path are explicit;
- no universal provider winner is declared;
- owner explicitly authorizes the subsequent live READ-only implementation gate.

Only after that authorization should a feature branch be created.
