# DCRM-05C — AIsa/DataForSEO Business Listings Live READ Validation

Status: CLOSED — MERGED TO MAIN — POST-MERGE CI GREEN — LIVE_VALIDATED_CAPABILITY

The owner authorized one bounded READ request, accepted its technical PASS on
2026-09-29, and authorized docs/canon promotion of only the exact selected cell.
PR #15 merged to `main` as `93cca53023c75ee52d86a3df1d7cdb4749c019eb`; post-merge CI `36535730059` is green.

## Accepted live evidence — 2026-09-29

- Executed HEAD: `1432d2ab1042c7a8fcc5f200c411315cb55b45df`
- ResearchRun ID: `94bf1347-f5ac-47e8-bb02-56cb6565b9f2`
- ResearchRun status: `EXHAUSTED`
- ProviderRun ID: `6e9ad9ab-e416-4a5b-8046-e85899db6d13`
- Exit code: `0`; resultState: `PRESENT`; dispatch disposition: `RECORDED`
- estimatedCostUsdMicros: `13800`
- actualCostUsdMicros: `13080`; actualCostKnown: `true`
- Live requests executed: `1`; retries: `0`; reconcile: `0`
- Canonical CRM mutation: `0`
- Final counts: `research_runs=1`, `provider_runs=1`

[Safe live evidence](../research/DCRM-05C_LIVE_VALIDATION_EVIDENCE_2026-09-29.md) records provenance and owner acceptance.

`Provider output != CRM truth`.

Only this exact workload/tuple is promoted. This does not validate other AIsa tools,
providers or capability cells, or establish universal superiority for AIsa or
DataForSEO. No new live request is authorized. PR #15 is merged and post-merge CI is green.
Deployment remains closed, and DCRM-06 still requires a separate owner-authorized work package.

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
- geography/locale: `US` / `en-US`;
- maxCostUsdMicros per call: `15000`;
- maxCostUsdMicros per ResearchRun: `15000`;
- maxToolCalls: `1`;
- stopCondition: `EVIDENCE_PRESENT`;
- timeout: 12 seconds;
- retries: 0;
- adapterVersion: `aisa-dataforseo-business-listings-v1`.

## Authorized implementation scope (historical)

The separately authorized implementation scope was:

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

Implementation and the single live request are complete and merged to `main`.
The owner accepted the live evidence; post-merge CI `36535730059` completed successfully.

## Repo-owned one-shot and reconciliation procedure

`pnpm --filter @drowk/aisa-capability prelive:plan` prints the exact selected
request fingerprint and budget without database access, key use or transport calls.
The versioned `live:once` command was used once under the owner-authorized live gate;
it requires `DROWK_AISA_LIVE_VALIDATION_ENABLED=true`, runtime `AISA_API_KEY`,
`DATABASE_URL`, `DROWK_TENANT_ID` and `APP_ENV`. It creates and starts one bounded
ResearchRun, claims one irreversible dispatch, and emits only safe identifiers,
result state, known cost and disposition. It exits non-zero on failure or ambiguity.
No automatic retry exists. The one-call authorization is consumed. Do not run
`live:once` again. No new live request or reconciliation is authorized.

After a claim, the durable disposition is `UNKNOWN` until a ProviderRun is safely
recorded. A crash with no ProviderRun leaves `UNKNOWN`; `--status <researchRunId>`
exposes it without dispatch. The repository can close a stranded run as `BLOCKED`
while preserving `UNKNOWN`. `--reconcile <researchRunId> <actorUuid>
<evidenceSha256> <UNKNOWN_AFTER_REVIEW|CONFIRMED_NO_DISPATCH>` appends an immutable,
attributed review. `RECONCILED` records review, not a license to dispatch again;
`UNKNOWN_AFTER_REVIEW` preserves uncertainty. The original claim never clears.

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

The exact selected cell is now `LIVE_VALIDATED_CAPABILITY`, following technical
PASS and formal owner acceptance. Promotion criteria for the accepted run were:
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

DCRM-05C is closed. The completion contract is satisfied:
- implementation was reviewed on a dedicated branch;
- exact-head GitHub CI was green;
- owner explicitly authorized the bounded live execution;
- exactly the authorized live request executed;
- ProviderRun/ResearchRun evidence was reviewed;
- no unauthorized side effect occurred;
- owner explicitly authorized merge;
- PR #15 merged to `main` as `93cca53023c75ee52d86a3df1d7cdb4749c019eb`;
- post-merge CI `36535730059` is green.

No deployment was performed or authorized.
