# DCRM-05C — AIsa/DataForSEO Business Listings Live READ Validation

Status: OWNER AUTHORIZATION REQUIRED — NO BRANCH / NO LIVE CALL YET

## Purpose

Implement and execute exactly one bounded READ-only live validation of the DCRM-05B
selected provider/capability cell:

`AIsa REST -> DataForSEO Business Listings Search Live -> FACILITY_LOCATION_DISCOVERY`

This package exists to validate the real external provider boundary, not to enrich
production CRM.

## Selected tuple

Canonical selection source:
`docs/research/DCRM-05B_PROVIDER_SELECTION_2026-09-28.md`

Required values:
- capabilityId: `DISCOVER_BUSINESS_LISTINGS`;
- workloadCell: `FACILITY_LOCATION_DISCOVERY`;
- provider: `dataforseo`;
- transport: `aisa`;
- operation:
  `POST /apis/v1/dataforseo/business_data/business_listings/search/live`;
- interface: `AISA_REST`;
- accessClass: `READ`;
- maxCostUsdMicros per call: `15000`;
- maxCostUsdMicros per ResearchRun: `15000`;
- maxToolCalls: `1`;
- stopCondition: `EVIDENCE_PRESENT`;
- timeout: 12 seconds;
- retries: 0;
- adapterVersion: `aisa-dataforseo-business-listings-v1`.

## Implementation scope after owner authorization

Only after explicit owner authorization:

1. create a dedicated feature branch from the exact current `main`;
2. add a minimal provider-neutral live adapter behind the DCRM-05A contracts;
3. require an explicit live-validation runtime switch;
4. require `AISA_API_KEY` by runtime secret/environment injection;
5. enforce cost/tool-call/timeout ceilings before dispatch;
6. normalize the selected request without credentials;
7. persist ProviderRun/ResearchRun audit only;
8. perform exactly one bounded live validation fixture;
9. persist no canonical CRM mutation;
10. capture safe provider evidence needed to determine whether this capability cell
    may become `LIVE_VALIDATED_CAPABILITY`.

## First fixture

Unless owner changes the fixture before authorization:

```json
{
  "title": "Fastenal",
  "location_coordinate": "33.4484,-112.0740,25",
  "limit": 5
}
```

No personal or confidential DROWK data may be substituted in the first validation.

## Result-state requirements

Use the DCRM-05B mapping exactly:
- PRESENT;
- EMPTY_WITHIN_RESPONSE;
- ERROR;
- PARTIAL only with explicit upstream partial semantics;
- no PENDING for this synchronous operation;
- UNKNOWN only when upstream explicitly expresses unknown.

No bounded empty result may be converted into universal absence.

## Credential rules

- `AISA_API_KEY` never enters Git;
- never include it in normalized input, logs, ProviderRun fields, error messages or
  fingerprints;
- missing key fails closed;
- explicit live-validation switch defaults off;
- disabling the switch is the kill path.

## Persistence rules

Allowed:
- ResearchRun/ProviderRun audit;
- task/provider IDs;
- request/response fingerprints;
- actual/estimated cost facts;
- result state;
- retrievedAt;
- observedAt when upstream explicitly provides it;
- safe normalized public-business evaluation summary.

Forbidden:
- raw secret material;
- automatic Account/Facility/Person creation;
- Relationship/Commitment/Work mutation;
- person-contact enrichment persistence in the first run;
- provider output -> CRM truth promotion;
- Signal creation;
- BuyerRole;
- outbound;
- Gmail;
- deploy.

## Capability-state gate

The selected cell remains `DOCUMENTED_CAPABILITY` / lab-validated before the run.

It may become `LIVE_VALIDATED_CAPABILITY` only if the actual run proves:
- request executed under the approved tuple;
- cost ceiling respected;
- provenance IDs captured;
- result/error semantics preserved;
- no credential leak;
- no unauthorized persistence or CRM mutation;
- exact-head CI green;
- ChatGPT reviews the live-run evidence and has no blocker;
- owner accepts the validation result.

## Completion contract

DCRM-05C may close only after:
- implementation is reviewed on a dedicated branch;
- exact-head GitHub CI is green;
- owner explicitly authorizes the bounded live execution;
- exactly the authorized live request is executed;
- ProviderRun/ResearchRun evidence is reviewed;
- no unauthorized side effect occurred;
- owner explicitly authorizes merge;
- post-merge CI is green.

No deployment is included.
