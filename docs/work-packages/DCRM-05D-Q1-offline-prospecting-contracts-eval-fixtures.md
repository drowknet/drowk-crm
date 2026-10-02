# DCRM-05D-Q1 — Offline Prospecting Contracts & Evaluation Fixtures

Status: AUTHORIZED / IMPLEMENTATION PENDING

Parent:
[DCRM-05D — Prospecting Open-Source Harvest & Capability Qualification](DCRM-05D-prospecting-oss-harvest-capability-qualification.md)

Protected-main base at authorization:
`5a137ac7114e032d30c9d599ed75ab74eff4c790`

Feature branch:
`feat/dcrm-05d-q1-offline-contracts`

## Owner outcome

Make the prospecting capability cells executable as **offline deterministic contracts and fixtures**
before any candidate OSS service, Apollo/AIsa provider, LinkedIn source or network path is allowed.

Q1 must answer:

- what exact normalized input does each capability accept;
- what result semantics are allowed;
- what remains UNKNOWN;
- what provenance/freshness facts are mandatory;
- how professional-email finding differs from verification;
- how public professional-profile discovery differs from Employment truth;
- how deterministic fingerprints change when material inputs/outputs change;
- how a future provider implementation plugs into the existing DCRM-05A Capability Lab.

Q1 does not determine a provider winner.

## Existing foundation to reuse

Do not create a second lab architecture.

Reuse:
- `CapabilityLabCase`;
- `SyntheticCapabilityFixture`;
- `ProviderResultState`;
- `ResearchRun`;
- `ProviderRun`;
- `normalizeLabJson`;
- `requestFingerprint`;
- `labFingerprint`;
- DCRM-05A result/cost/READ-only semantics.

Existing provider result states remain exactly:

```text
PRESENT
EMPTY_WITHIN_RESPONSE
UNKNOWN
ERROR
PENDING
PARTIAL
```

Q1 must not add a competing generic provider-state vocabulary.

## Capability cells in scope

Exactly these capability IDs:

1. `SEARCH_WEB`
2. `EXTRACT_WEB_PAGE`
3. `DISCOVER_COMPANIES`
4. `DISCOVER_PUBLIC_PROFESSIONAL_PROFILE`
5. `FIND_BUYER_CANDIDATES`
6. `ENRICH_COMPANY`
7. `FIND_PROFESSIONAL_EMAIL`
8. `VERIFY_PROFESSIONAL_EMAIL`
9. `VERIFY_EMPLOYMENT`
10. `FIND_PROCUREMENT_ROUTE`

`CapabilityId` is already a branded string. Do not introduce a migration or DB enum for these values.

## Required normalized input contracts

The exact TypeScript naming may vary; semantics may not.

### SEARCH_WEB

Required:
- `query`;
- `locale`;
- `geography`;
- `maxResults`.

Optional bounded filters may exist only as deterministic JSON-compatible values.

### EXTRACT_WEB_PAGE

Required:
- absolute HTTP(S) `url`;
- `extractionGoal`.

The offline contract validates shape only. It does not fetch the URL.

### DISCOVER_COMPANIES

Required:
- `marketQuery`;
- `geography`;
- `maxResults`.

Optional:
- facility/service/category terms.

Output remains AccountCandidate/Evidence semantics, never Account truth.

### DISCOVER_PUBLIC_PROFESSIONAL_PROFILE

Required:
- `fullName`.

At least one disambiguator:
- `companyName`;
- `companyDomain`;
- `titleHint`.

This cell represents indexed/public profile discovery only.

It must not claim:
- current Employment truth;
- LinkedIn authenticated access;
- relationship degree;
- connection status.

### FIND_BUYER_CANDIDATES

Required:
- `companyName`;
- `companyDomain`;
- non-empty `roleTerms`.

Optional:
- geography;
- facility context;
- service category.

Output represents Person/Employment/BuyerRole candidates plus evidence gaps, not accepted BuyerRole truth.

### ENRICH_COMPANY

Required:
- `companyDomain`;
- non-empty requested `fields`.

Optional:
- companyName.

Per-field provenance/freshness must remain representable.

### FIND_PROFESSIONAL_EMAIL

Required:
- `fullName`;
- `companyDomain`.

Optional:
- known published-email pattern evidence.

This capability may yield an email candidate.
It does not verify deliverability merely by generating a pattern.

### VERIFY_PROFESSIONAL_EMAIL

Required:
- `email`.

Optional:
- expected company domain.

The cell-specific verification state is exactly:

```text
VERIFIED
REJECTED
CATCH_ALL
UNKNOWN
ERROR
```

This is distinct from the outer ProviderResultState.

Rules:
- syntax-valid != VERIFIED;
- domain-resolves != VERIFIED;
- MX-exists != VERIFIED;
- blocked/unavailable SMTP/network proof -> UNKNOWN or ERROR, never VERIFIED;
- catch-all uncertainty remains CATCH_ALL;
- provider service error remains ERROR.

### VERIFY_EMPLOYMENT

Required:
- `fullName`;
- `companyName`.

Optional:
- companyDomain;
- claimedTitle;
- publicProfileUrl.

Output is an attributable evidence set / status candidate.
No fuzzy auto-promotion to Employment truth.

### FIND_PROCUREMENT_ROUTE

Required:
- `companyName`;
- `companyDomain`;
- `serviceCategory`.

Optional:
- geography;
- facility identifier/context.

Output is a route candidate with attributable public source(s), freshness and unresolved gaps.

## Common offline fixture contract

Q1 should introduce one fixture contract capable of representing:

- case ID;
- capability ID;
- workload cell;
- normalized input;
- synthetic provider ID;
- adapter version;
- expected outer ProviderResultState;
- synthetic output;
- provenance completeness;
- rights class;
- retrieved/observed time;
- estimated cost;
- actual cost + actual-cost-known;
- expected evidence gaps;
- expected semantic assertions.

Fixture data must be entirely synthetic/reserved-example data.

No real:
- prospect email;
- LinkedIn profile;
- legacy reference contact;
- Apollo response;
- Gmail content;
- provider secret;
- customer/prospect dataset.

## Common candidate-output invariants

Synthetic outputs may represent evidence candidates, but must preserve:

- source URL/reference when the fixture claims a sourced fact;
- retrievedAt;
- observedAt only when the fictional source explicitly supplies source time;
- source/provider/method attribution;
- rights class;
- unresolved gaps;
- no canonical CRM ID invention;
- no accepted Account/Person/Employment/BuyerRole/ProcurementRoute mutation.

A missing source timestamp stays unknown.

## Required deterministic fixture set

At minimum implement fixtures/sensors proving:

1. SEARCH_WEB PRESENT with source provenance;
2. SEARCH_WEB EMPTY_WITHIN_RESPONSE != universal absence;
3. SEARCH_WEB UNKNOWN != empty;
4. EXTRACT_WEB_PAGE PARTIAL preserves missing fields/gaps;
5. EXTRACT_WEB_PAGE ERROR does not produce facts;
6. DISCOVER_COMPANIES PRESENT returns candidates, not Account truth;
7. DISCOVER_PUBLIC_PROFESSIONAL_PROFILE PRESENT is low-authority public/indexed evidence only;
8. public profile result cannot claim connection degree or authenticated LinkedIn state;
9. FIND_BUYER_CANDIDATES PARTIAL preserves BuyerRole gaps;
10. ENRICH_COMPANY per-field provenance remains distinguishable;
11. FIND_PROFESSIONAL_EMAIL may return an UNVERIFIED candidate;
12. generated-pattern email is not VERIFIED;
13. VERIFY_PROFESSIONAL_EMAIL VERIFIED requires explicit verification evidence in the fixture;
14. MX-only fixture cannot become VERIFIED;
15. CATCH_ALL remains distinct from UNKNOWN;
16. unavailable verification path becomes UNKNOWN/ERROR, not valid;
17. VERIFY_EMPLOYMENT UNKNOWN does not promote Employment;
18. conflicting Employment evidence remains PARTIAL/UNKNOWN with conflict visible;
19. FIND_PROCUREMENT_ROUTE PRESENT has attributable source URL/reference;
20. missing procurement source yields UNKNOWN/PARTIAL, not an invented route;
21. materially changed normalized input changes request fingerprint;
22. reordered equivalent JSON remains fingerprint-stable;
23. credential/session/cookie-like normalized input keys fail closed;
24. all Q1 cases are READ-only;
25. Q1 source contains no network calls/provider SDK execution;
26. Q1 source contains no LinkedIn session/cookie/browser automation;
27. no live capability-state promotion occurs;
28. no universal score/winner/ranking is created;
29. no canonical CRM write path exists;
30. fixture outputs are deterministic and synthetic.

## Allowed implementation surfaces

Codex may modify only:

- `packages/contracts/src/prospecting.ts` (new);
- `packages/contracts/src/index.ts`;
- `packages/domain/src/prospecting-capability.ts` (new);
- `packages/domain/src/index.ts`;
- `packages/domain/test/prospecting-capability-golden.test.mjs` (new);
- `evals/prospecting/**` (new synthetic fixtures/README if useful);
- this work package;
- parent DCRM-05D work package status/reference;
- `docs/roadmap/ROADMAP.md`;
- `docs/engineering/CURRENT_EXECUTION_SEQUENCE.md`;
- `docs/index.md`.

Do not touch anything else without stopping for owner/ChatGPT review.

## Explicitly forbidden surfaces

Do not modify:

- `packages/db/**`;
- `packages/db/migrations/**`;
- `services/**`;
- `apps/**`;
- `capabilities/aisa/**`;
- `connectors/**`;
- `infra/**`;
- `.github/**`;
- lockfiles/package manifests unless unexpectedly required — if required, STOP instead;
- staging/runtime code.

## No new dependency rule

Q1 must use only current workspace/runtime dependencies and Node built-ins.

Do not install:
- Crawl4AI;
- SearXNG;
- OpenProspector;
- OpenEnrich;
- OpenGTM;
- KeeLead;
- CrossLinked;
- Rowbound;
- enrichment-kit;
- Apollo SDK;
- browser automation;
- scraper packages;
- email-verification packages.

Q1 is contract/eval design, not candidate execution.

## Network prohibition

No Q1 implementation code may execute:
- `fetch`;
- axios;
- browser automation;
- MCP/provider client;
- DNS/MX/SMTP calls;
- HTTP requests;
- subprocesses that perform network access.

Tests may statically sensor the new Q1 source to enforce this.

## LinkedIn prohibition

No:
- `li_at`;
- cookies/sessions;
- authenticated LinkedIn requests;
- browser profile reuse;
- Sales Navigator selectors;
- CAPTCHA/rate-limit handling;
- connect/message/InMail actions.

A string such as `https://www.linkedin.com/in/example-person` may appear only inside explicitly synthetic fixture data if needed to prove URL semantics.

## No DB / persistence work

DCRM-05A already provides ResearchRun/ProviderRun persistence.

Q1 must not add migrations.

If offline contract implementation reveals a real persistence gap, STOP and report it rather than modifying DB.

## Validation rules

At minimum:

```text
pnpm --filter @drowk/contracts build
pnpm --filter @drowk/domain build
pnpm --filter @drowk/domain test
pnpm verify
```

No live/provider/staging command.

## Completion evidence

Codex must report:

- branch and starting SHA;
- final commit SHA;
- changed files;
- exact tests run;
- pass/fail counts;
- confirmation of zero network/provider calls;
- confirmation of zero DB/migration changes;
- confirmation of zero dependencies added;
- confirmation of zero live LinkedIn/Apollo/AIsa/Gmail actions;
- any unresolved contract question.

Required final commit message:

`feat(dcrm-05d): add offline prospecting capability fixtures`

Push only:
`feat/dcrm-05d-q1-offline-contracts`

Do not open/merge PR unless separately instructed.

## Closure

Q1 closes only after:
- exact-head CI green;
- ChatGPT deep review has no blocking finding;
- owner merge authorization;
- protected-main post-merge CI green.

Q1 closure authorizes Q2 only through a new explicit owner gate.
