# DCRM-05B Provider Selection Research — 2026-09-28

Status: COMPLETE — ONE LIVE-VALIDATION TUPLE SELECTED, NO LIVE REQUEST MADE

## Decision

Select the first external validation cell as:

**AIsa REST -> DataForSEO Business Data -> Business Listings Search Live**

Capability cell:
**FACILITY / BUSINESS-LISTING DISCOVERY**

The first live validation should prove the network/provider boundary and ProviderRun
semantics only. It must not create or update Account, Facility, Person, Relationship,
Commitment, Work or any other canonical CRM object.

## Why this cell is first

The first live test should be low-risk, cheap, public-data oriented and easy to
verify manually.

DataForSEO Business Listings is a strong first cell because:
- the endpoint is purpose-built for business/location discovery rather than generic web search;
- returned business records are described as public business listing data;
- the live endpoint exposes provider-native task IDs, status codes and cost fields;
- price is deterministic from task + item count;
- result count can be tightly bounded;
- business-native IDs such as `cid` / `feature_id` can be preserved as provider evidence;
- the cell is directly relevant to DCRM-06 Territory + Target Universe without
  authorizing DCRM-06 itself.

AIsa is selected as the first transport because:
- one AIsa bearer key can access DataForSEO;
- AIsa publishes the exact REST route;
- AIsa states API usage is charged at the upstream provider rate with no markup;
- pay-as-you-go has no monthly subscription;
- AIsa API request/response content is documented as transient beyond processing,
  subject to billing/fraud/compliance exceptions;
- the connected provider still applies its own terms and retention behavior.

## Shortlist considered

### AIsa -> DataForSEO Business Listings

Selected for this capability cell.

Current public facts checked:
- AIsa REST route:
  `POST https://api.aisa.one/apis/v1/dataforseo/business_data/business_listings/search/live`
- AIsa auth:
  `Authorization: Bearer $AISA_API_KEY`
- AIsa PAYG:
  no monthly subscription; 1x upstream API pricing; 100 requests/minute overall.
- DataForSEO Business Listings live pricing:
  $0.012 per task + $0.00036 per item.
- DataForSEO live endpoint:
  `POST https://api.dataforseo.com/v3/business_data/business_listings/search/live`
- direct DataForSEO endpoint allows one task per live request and publishes task IDs,
  status fields, cost, result count and business listing records.

### Exa Search

Good future challenger for generic web discovery.

Current public pricing checked:
- Search base: $7 / 1,000 requests with up to 10 results.
- Strong fit for broad web discovery, but less directly business/facility-specific
  than the selected Business Listings cell.

No conclusion about universal provider quality is made.

### Tavily Search

Good future challenger for generic web search/research.

Current public pricing checked:
- free tier includes API credits;
- pay-as-you-go is credit-based;
- search is a general web-search capability rather than a purpose-built business
  listings source.

Tavily's public privacy policy states query data may be used to improve future
responses unless otherwise specified by contract. For the first low-risk provider
cell, DataForSEO business listings has a more directly bounded business-data shape.

No conclusion about universal provider quality is made.

## Selected exact tuple

- `capabilityId`: `DISCOVER_BUSINESS_LISTINGS`
- `workloadCell`: `FACILITY_LOCATION_DISCOVERY`
- provider: `dataforseo`
- provider transport: `aisa`
- operation:
  `POST /apis/v1/dataforseo/business_data/business_listings/search/live`
- interface: `AISA_REST`
- accessClass: `READ`
- geography/locale: United States / English; first fixture uses a bounded public
  metro-area coordinate search
- provider contract/version: endpoint version is provider-returned; no hard-coded
  semantic version is assumed
- auth mechanism: AIsa bearer API key
- internal rightsClass label for the first run:
  `PUBLIC_BUSINESS_LISTING`
- retention classification:
  `AISA_TRANSIENT_CONTENT__UPSTREAM_PROVIDER_RETENTION_APPLIES`
- per-call cost ceiling:
  **15,000 USD micros ($0.015)**
- ResearchRun cost ceiling:
  **15,000 USD micros ($0.015)**
- maxToolCalls:
  **1**
- stopCondition:
  `EVIDENCE_PRESENT`
- timeout:
  **12 seconds**
- automatic retries:
  **0** for the first live validation
- source-native request ID:
  DataForSEO task `id`
- source-native business IDs:
  preserve `cid` and `feature_id` when present
- retrievedAt:
  DROWK timestamp immediately after successful response receipt
- observedAt:
  preserve provider/source observation time only if explicitly supplied;
  otherwise `null`
- adapterVersion:
  proposed `aisa-dataforseo-business-listings-v1`
- credential injection:
  runtime environment/secret injection only; never source control, normalized
  request, fingerprint or ProviderRun
- kill/disable:
  live adapter must be disabled by default and require an explicit runtime
  enablement switch in addition to presence of `AISA_API_KEY`

## First bounded request fixture

The implementation package should use one non-sensitive public-business fixture,
for example:

```json
{
  "title": "Fastenal",
  "location_coordinate": "33.4484,-112.0740,25",
  "limit": 5
}
```

The fixture is an evaluation input, not CRM truth.

At current DataForSEO pricing:
- task cost = $0.012;
- maximum 5 returned items = 5 x $0.00036 = $0.0018;
- bounded provider cost = **$0.0138**.

AIsa states the same upstream API price applies without markup, so the proposed
$0.015 per-call ceiling leaves a small guard band.

Do not add paid options or broaden `limit` in the first run.

## Result-state mapping

The adapter must map provider semantics conservatively.

### PRESENT

Only when:
- AIsa transport succeeds;
- DataForSEO top-level status is successful;
- task status is successful;
- `tasks_error = 0`;
- at least one business listing item is returned.

### EMPTY_WITHIN_RESPONSE

Only when the bounded request itself succeeds but returns no business listing item.

This means only that the bounded provider response was empty. It is not proof that
the business/facility does not exist.

### ERROR

Use for:
- AIsa HTTP/auth/payment/rate/server failures;
- network or timeout failure;
- DataForSEO top-level or task error status;
- schema/adapter failure that prevents deterministic interpretation.

### PARTIAL

Do not synthesize PARTIAL for this endpoint.

Emit PARTIAL only if AIsa/DataForSEO provides explicit usable partial-result
semantics. Otherwise an ambiguous mixed success/error response fails as ERROR.

### PENDING

Do not emit PENDING for this selected live endpoint because the selected operation
is synchronous live mode.

### UNKNOWN

Do not use UNKNOWN as a substitute for a technical error or bounded empty response.
Use it only if the upstream provider explicitly expresses an unknown semantic that
can be preserved without inference.

## Persistence boundary

The first run may persist only:
- ResearchRun / ProviderRun audit data;
- request/response fingerprints;
- provider task ID;
- provider/entity source IDs necessary for provenance;
- safe normalized evaluation summary.

It must not persist a raw provider response as canonical CRM truth.

For the first fixture, deliberately exclude personal-contact fields from any
persisted normalized summary. Public business fields that may be retained for
evaluation include:
- business title;
- category;
- address/address components;
- domain;
- `cid`;
- `feature_id`;
- rating;
- latitude/longitude when returned.

Phone/email/contact-person fields are outside the first live evaluation payload
persistence even if the provider returns them.

## Rights / retention findings

### AIsa

Public terms checked 2026-09-28 state:
- Connected Service Provider terms also apply;
- users are responsible for eligibility and compliance with provider terms;
- AIsa API content is not retained beyond processing/delivery except for
  billing disputes, fraud investigation or legal/compliance needs;
- API metadata may be retained;
- provider-side retention remains governed by that provider.

### DataForSEO

Public documentation states Business Data is based on publicly available business
information and Business Listings data.

DataForSEO general API docs say live-method results are generally not stored
(except separately documented cases such as SERP JSON), while DataForSEO's privacy
policy also states API task data is retained for 365 days.

Because those statements describe different layers and are not fully equivalent,
DROWK should use the conservative interpretation:

**upstream task metadata/data may be retained by DataForSEO for up to 365 days.**

That is acceptable for the selected first fixture only because:
- input is a non-sensitive public business lookup;
- no DROWK customer/prospect secret is sent;
- no personal-contact data is intentionally persisted by DROWK from the result.

This is not a blanket approval for person enrichment.

## Credential / security boundary

For the future live implementation:
- `AISA_API_KEY` is injected at runtime from an owner-controlled secret surface;
- no API key in Git, fixtures, logs, fingerprints or error messages;
- the adapter must refuse to start/call when the explicit live-validation switch is off;
- credentials must never be included in normalized request/response fingerprints;
- safe error categories only;
- one-call ceiling and ResearchRun budget apply before network dispatch.

## Sources checked

AIsa:
- https://www.aisa.one/pricing
- https://www.aisa.one/mcp
- https://www.aisa.one/api/dataforseo
- https://aisa.one/fr/api/dataforseo-business-data
- https://www.aisa.one/TOS
- https://www.aisa.one/privacy

DataForSEO:
- https://docs.dataforseo.com/v3/business_data-business_listings-search-live/
- https://docs.dataforseo.com/v3/business_data-business_listings-overview/
- https://dataforseo.com/pricing/business-data/business-listings-api
- https://docs.dataforseo.com/v3/appendix-errors/
- https://docs.dataforseo.com/v3/
- https://dataforseo.com/terms-of-service
- https://dataforseo.com/privacy-policy

Challengers:
- https://exa.ai/pricing
- https://exa.ai/privacy-policy
- https://www.tavily.com/pricing
- https://www.tavily.com/privacy

## Gate result

DCRM-05B selection is complete.

No external request was made during this gate.

The next possible implementation gate is:

**DCRM-05C — AIsa/DataForSEO Business Listings Live READ Validation**

It requires a new explicit owner authorization before:
- a feature branch is created;
- credentials are injected;
- a live external request is made.
