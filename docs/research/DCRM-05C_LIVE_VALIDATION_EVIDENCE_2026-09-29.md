# DCRM-05C Live Validation Evidence — 2026-09-29

Status: CLOSED — OWNER ACCEPTED — LIVE_VALIDATED_CAPABILITY — MERGED + POST-MERGE CI GREEN

## Owner authorization and acceptance

The owner authorized exactly one bounded READ request: title `Fastenal`,
location_coordinate `33.4484,-112.0740,25`, limit `5`, max calls `1`,
max budget `$0.015`, retries `0`. The owner formally accepted the technical
PASS and authorized docs/canon promotion of the exact cell below to
`LIVE_VALIDATED_CAPABILITY`. The one-call authorization is consumed.

## Exact validated tuple

- capabilityId: `DISCOVER_BUSINESS_LISTINGS`
- workloadCell: `FACILITY_LOCATION_DISCOVERY`
- provider: `dataforseo`
- transport: `aisa`
- operation: `POST /apis/v1/dataforseo/business_data/business_listings/search/live`
- interface: `AISA_REST`
- accessClass: `READ`
- geography/locale: `US` / `en-US`
- adapterVersion: `aisa-dataforseo-business-listings-v1`

## Safe execution evidence

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
- providerTaskId: `09290702-1614-0544-0000-8d49c4eaa1c0`
- providerCid: `10029170569212280921`
- providerFeatureId: `0x872ba840997771b7:0x8b2ec57ef1b34059`
- requestFingerprint: `sha256:ad1edb7fff99bc31294b8260a939cfd86463c6710b21f46b7024aa976baaf152`
- responseFingerprint: `sha256:61bbd3c6a16e76ef8b710a7ddf57d34dc0868e78bb434f0e433d64c4bc02f942`
- safeStatusCodes: `{"http":200,"task":20000,"provider":20000,"tasksError":0}`
- safeErrorCategory: `null`
- safeSummary: 3 Fastenal Fulfillment Centers: Gilbert, Peoria and Phoenix;
  domain `www.fastenal.com`.
- AIsa usage corroboration, supplied in the owner acceptance handoff:
  `1 request`; `success`; charged usage `$0.01308`.

## Boundaries and closure

No retry; no reconcile; no secret leak observed in captured output, 11 recent npm
logs checked, or inspected database persistence. No canonical CRM mutation:
before/after counts and hashes of all other database tables were unchanged.
No deploy occurred. PR #15 merged to `main` as `93cca53023c75ee52d86a3df1d7cdb4749c019eb`; post-merge CI `36535730059` completed successfully. The docs/canon promotion handoff executed zero live requests.

`Provider output != CRM truth`.

Only this exact workload/tuple is promoted. This does not validate other AIsa tools,
providers or capability cells, or establish universal superiority for AIsa or
DataForSEO. No new live request is authorized. Merge and post-merge CI are complete.
Deployment remains closed, and DCRM-06 requires a separate owner-authorized work package.
