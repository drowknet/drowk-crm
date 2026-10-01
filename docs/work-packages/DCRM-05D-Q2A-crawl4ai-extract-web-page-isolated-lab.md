# DCRM-05D-Q2A — Crawl4AI EXTRACT_WEB_PAGE Isolated Lab

Status: STATIC HARNESS IMPLEMENTED / ACTUAL LAB EXECUTION PENDING / NO LIVE PROVIDER AUTHORITY

Current stage is static/repo-owned only. The already-pulled image must not be pulled
again; no Docker commands, container execution or network access are authorized in
this stage. The later execution gate described below remains closed for this stage.
No successful lab-evidence document or LAB_PASS is claimed. Q2B/Q3 remain closed.

Implementation: `tooling/prospecting-lab/crawl4ai/`; static sensors:
`tooling/harness/crawl4ai-lab.test.mjs`. The planner has no execution path; synthetic
output doubles test result handling without claiming candidate execution.

Static-stage validation on 2026-10-01: dedicated lab sensors passed (8 tests);
combined lab/runtime/staging static tests passed (30 tests); `corepack pnpm
harness:test` passed (63 tests); `corepack pnpm lint` passed. `corepack pnpm
harness:ci` executed and failed closed: local Node is 24.19.0, while CI requires
Node 22. Full `runtime:verify` and `staging:verify` were not executed because their
implementations invoke Docker, forbidden in this stage. These static results are
not substitutes for those gates or an actual candidate run. Commit remains pending
all required gates; push remains blocked by this stage's no-network instruction.

Parent:
[DCRM-05D — Prospecting Open-Source Harvest & Capability Qualification](DCRM-05D-prospecting-oss-harvest-capability-qualification.md)

Q1 prerequisite:
DCRM-05D-Q1 is CLOSED/GREEN on protected `main` through merge
`f082003a56dc6398b71f599b342b756b2d63b240`.

Feature branch:
`feat/dcrm-05d-q2a-crawl4ai-extract-lab`

## Owner outcome

Qualify exactly one open-source candidate for exactly one DROWK capability cell:

```text
candidate: Crawl4AI
candidate runtime: 0.9.4
capabilityId: EXTRACT_WEB_PAGE
workloadCell: EXTRACT_WEB_PAGE / synthetic raw HTML
authority: LAB ONLY
```

This lab proves whether the pinned Crawl4AI runtime can deterministically extract structured
facts from synthetic HTML while remaining inside a no-network, no-provider, no-LinkedIn boundary.

It does **not** validate arbitrary internet crawling.

## Why Crawl4AI 0.9.4

Q0 recorded Crawl4AI as an `ADOPT_CANDIDATE` for bounded public-web extraction.

The runtime selected for Q2A is the current 0.9.4 release rather than an unpinned latest tag.
0.9.4 is a security release and includes fixes for SSRF paths and a server trust-boundary issue.

Research/source review references:

- Q0 inspected source head:
  `e5d2e786d1a101225f3f6a3e6fd344d76eeb13af`
- selected runtime release:
  `0.9.4`
- selected Docker multi-platform index digest:
  `sha256:9021b3cb5c6f12570bbcd5395638495e0a06969b3148e377b953d174af2ebc9b`
- observed linux/amd64 manifest digest:
  `sha256:048848e548fad60c670bd656cbb3eb204fd999709a30365d3697c411ce50796d`
- observed linux/arm64 manifest digest:
  `sha256:5370d96c9a6288ae4949d76c300385b0262d8ed1c0512cea90b233dc19fb9269`

Runtime references must use the version + digest, never `latest`.

## Lab design decision

Use Crawl4AI's local/raw HTML path, not a public URL fetch.

Conceptual execution:

```text
synthetic fixture.html
        |
        v
raw:<html...>
        |
        v
Crawl4AI 0.9.4 pinned Docker image
        |
        |  --network none
        |  no host port
        |  no provider key
        |  no browser profile
        |  no external URL fetch
        v
deterministic CSS/XPath-style extraction
        |
        v
safe lab result JSON
        |
        v
assert against expected synthetic facts
```

The normalized DROWK Q1 input may retain an example URL as the semantic/base URL, but the
candidate must receive the actual synthetic document through the local/raw input path.

No external web request is part of Q2A.

## Candidate image contract

Use exactly:

```text
unclecode/crawl4ai:0.9.4@sha256:9021b3cb5c6f12570bbcd5395638495e0a06969b3148e377b953d174af2ebc9b
```

Fail closed if:
- the command references `latest`;
- the version differs;
- the digest differs;
- Docker resolves an unexpected architecture manifest;
- the image cannot be pulled/inspected.

Image pull is artifact acquisition only. It does not authorize the container runtime to have network access.

## Runtime boundary

The actual candidate execution must use:
- `--rm`;
- `--network none`;
- no `-p` / `--publish`;
- no host network;
- no privileged mode;
- no Docker socket mount;
- no SSH agent mount;
- no browser-profile/user-data mount;
- no credential directory mount;
- no workspace-wide writable mount;
- lab input/script mounted read-only;
- writable temp/cache only via bounded tmpfs if required;
- `--cap-drop ALL` unless a concrete candidate startup requirement proves otherwise and the lab STOPs for review;
- `--security-opt no-new-privileges`;
- bounded memory/PIDs/CPU where Docker supports it.

Do not grant the container access to:
- DROWK secrets;
- environment provider keys;
- Gmail/OAuth tokens;
- LinkedIn cookies/sessions;
- host Docker socket;
- staging secrets;
- `drowktribe`.

## Fixture

Use reserved synthetic data only.

The fixture should contain enough deterministic HTML to prove:
- page/company title;
- facility/location text;
- service/category text;
- one procurement/vendor-registration style route;
- one irrelevant/noise section that must not become a selected fact.

All domains/emails, if any, must use reserved/example data such as `example.com`.

No PWM prospect/company/person data.

## Extraction strategy

Prefer deterministic local extraction:
- CSS or XPath schema;
- no LLM extraction;
- no model API;
- no embeddings;
- no generative inference.

Q2A is testing the crawler/extraction substrate, not JEV/model judgment.

## Required result semantics

Successful candidate output maps conceptually to the existing Q1 cell:

```text
capabilityId = EXTRACT_WEB_PAGE
outer resultState = PRESENT | PARTIAL | ERROR | UNKNOWN
authority = EVIDENCE_CANDIDATE
rightsClass = SYNTHETIC_ALLOWED
synthetic = true
observedAt = null unless fixture contains explicit source time
```

Do not write ProviderRun/ResearchRun rows in Q2A.

No DB is required.

A Q2A lab result is evaluation evidence, not `LIVE_VALIDATED_CAPABILITY`.

## Required lab cases

At minimum:

1. deterministic raw synthetic HTML extracts the expected selected facts;
2. irrelevant/noise HTML is not promoted as a selected fact;
3. materially changed synthetic HTML changes the candidate output fingerprint;
4. identical input produces identical normalized selected facts;
5. malformed/insufficient HTML yields PARTIAL/UNKNOWN/ERROR without invented facts;
6. no provider/model key is required;
7. candidate runtime has no network;
8. no host ports are published;
9. no LinkedIn/session/browser profile material exists;
10. no Account/Person/Employment/BuyerRole/ProcurementRoute truth mutation exists;
11. no DB/migration path exists;
12. runtime reference is exact version + digest;
13. `latest` is rejected by static sensor;
14. external HTTP(S) target fetching is absent from the lab runner;
15. no LLM extraction strategy exists in Q2A;
16. candidate stdout/stderr handling does not persist secrets/raw environment;
17. failure preserves UNKNOWN/ERROR rather than fabricating PRESENT;
18. lab can be removed without affecting application runtime.

## Evidence bundle

A successful local run should create a safe evidence artifact containing only:
- DROWK main/base SHA;
- Q2A feature SHA;
- candidate name/version/image digest;
- Docker platform/architecture;
- exact capability/workload cell;
- synthetic fixture fingerprint;
- selected-facts fingerprint;
- selected safe facts;
- result state;
- elapsed time;
- provider cost facts (`actualCostKnown=false` unless explicitly measured);
- network mode = `none`;
- exit status;
- timestamp of lab execution.

Do not persist:
- full environment;
- Docker auth config;
- home paths beyond generic repo-relative paths;
- tokens;
- cookies;
- raw host metadata;
- unrelated process lists.

## Implementation surfaces allowed

Codex may modify only:

- `tooling/prospecting-lab/crawl4ai/**` (new);
- `tooling/harness/crawl4ai-lab.test.mjs` (new static/deterministic sensors);
- `docs/research/DCRM-05D_Q2A_CRAWL4AI_LAB_EVIDENCE.md` (new, only after an actual successful lab run);
- this work package;
- parent DCRM-05D work package status/reference;
- `docs/roadmap/ROADMAP.md`;
- `docs/engineering/CURRENT_EXECUTION_SEQUENCE.md`;
- `docs/index.md`.

If another file is required, STOP.

## Forbidden surfaces

Do not modify:
- `packages/db/**`;
- `packages/db/migrations/**`;
- `packages/contracts/**`;
- `packages/domain/**`;
- `apps/**`;
- `services/**`;
- `capabilities/aisa/**`;
- `connectors/**`;
- `infra/**`;
- `.github/**`;
- root/package manifests;
- lockfiles;
- staging/runtime deployment code.

## No dependency incorporation

Q2A must not add Crawl4AI to DROWK package manifests.

The candidate exists only as a pinned isolated Docker lab runtime.

Do not vendor/copy Crawl4AI source into DROWK.

## Execution gate

The owner authorization for Q2A permits:
- pulling the exact pinned Docker image;
- inspecting its image identity;
- executing the exact synthetic/raw lab container;
- capturing the safe evidence bundle.

It does not permit:
- crawling public internet targets;
- LinkedIn;
- Apollo/AIsa;
- provider credentials;
- Gmail;
- staging;
- deploy;
- outbound.

If Docker is unavailable, the image cannot be pinned, or the candidate cannot run with `--network none`,
STOP and report the blocker. Do not weaken the boundary to make the lab pass.

## Validation

Static/repo validation:

```text
node --test tooling/harness/crawl4ai-lab.test.mjs
pnpm harness:ci
pnpm runtime:verify
pnpm staging:verify
```

Candidate execution:
- exact pinned image only;
- one synthetic fixture;
- no external network;
- no provider/model credentials.

## Q2A outcome states

Q2A may end as:

- `LAB_PASS`: candidate executed inside the frozen boundary and produced correct deterministic evidence;
- `LAB_PARTIAL`: candidate runs but one or more semantics need bounded follow-up;
- `LAB_BLOCKED`: environment/security boundary prevents safe execution;
- `LAB_REJECT`: candidate cannot satisfy the required boundary/semantics.

None of these states alone promote Crawl4AI to a production dependency.

## Closure

Q2A closes only after:
1. implementation stays inside allowlist;
2. static CI exact-head green;
3. one actual isolated lab execution is captured;
4. safe evidence is reviewed;
5. ChatGPT deep review has no blocking finding;
6. owner explicitly authorizes merge;
7. protected-main post-merge CI green.

Q2A closure does not authorize Q2B, Q3, provider comparison or production adoption.
