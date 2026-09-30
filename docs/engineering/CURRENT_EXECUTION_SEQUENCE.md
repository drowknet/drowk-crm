# Current Execution Sequence — PWM -> DROWK Bridge

Status: EXECUTION FOUNDATION — EF-01A CLOSED/GREEN — EF-01B CLOSED/GREEN — EF-02 CLOSED/GREEN — EF-03 NEXT / NOT YET AUTHORIZED — NO DEPLOY
Owner gate: explicit
Canonical product repository: drowknet/drowk-crm
Legacy/source repository: D:\Workspace\Projects\PWM\PWM_CRM (read-only by default)

## Principle

There is one engineering stream, not two independent projects.

```text
PWM_CRM on D:
  source/reference/extraction
        ↓
verified Codex local findings
        ↓
DROWK extraction decision
        ↓
drowk-crm contracts/tests/migrations
        ↓
new executable product
```

The local PWM repository is not a second product branch. It exists to preserve,
audit and extract proven behavior into DROWK CRM.

## Closed gate: DCRM-00B — PWM extraction bridge

The local WP-03 source ambiguity is closed. See
`docs/engineering/DCRM-00B_CLOSURE.md`.

The canonical stream has resumed in DROWK CRM.

### Step 1 — Local PWM alignment

On the owner machine:

1. verify machine/user/path/Git state;
2. place the authoritative 2026-09-26 WP-03 checkpoint in the PWM repo;
3. give Codex the local rebase/extraction task;
4. allow only local/static/synthetic edits and tests;
5. no Gmail/Sheets/Apps Script writer runtime;
6. no clasp push;
7. no Git commit yet.

Expected Codex deliverable:
- exact HEAD observed;
- exact files changed;
- git diff --stat;
- revised WP-03 test count;
- parser/static results;
- legacy mechanics preserved;
- superseded behaviors removed/reclassified;
- blockers/owner decisions;
- no commit.

### Step 2 — Reconcile into DROWK

The owner returns the Codex output/diff to ChatGPT.

ChatGPT then:
- compares local evidence to the DROWK WP-03 extraction note;
- updates DROWK contracts/golden tests where the source proves useful behavior;
- records any remaining legacy-only behavior;
- decides whether the PWM local patch should be committed as preservation history;
- closes DCRM-00B when source and target semantics are aligned.

### Completed — DCRM-01A / DCRM-01B

- [DONE] foundation migrations execute on disposable PostgreSQL;
- [DONE] relational tenant-isolation sensors;
- [DONE] typed PostgreSQL repositories for:
  Account -> Facility -> SourceObservation -> Evidence;
- [DONE] transaction rollback sensor;
- [DONE] source identity/revision idempotency semantics;
- [DONE] PR #2 merged into `foundation/drowk-crm-00`;
- [DONE] post-merge CI green.

### Completed — DCRM-01C

- [DONE] deterministic forward-only migration runner;
- [DONE] checksum ledger and advisory-lock protection;
- [DONE] plan/status/apply commands;
- [DONE] minimal `/health` and `/ready` runtime shell;
- [DONE] disposable PostgreSQL runtime sensors;
- [DONE] PR #3 merged into `foundation/drowk-crm-00`;
- [DONE] post-merge CI green.

### Completed — DCRM-02A

- [DONE] provider-neutral external principal boundary;
- [DONE] DROWK user + tenant membership persistence;
- [DONE] explicit tenant selection with membership validation;
- [DONE] protected read-only `GET /operator/context` proof endpoint;
- [DONE] PR #4 merged into `foundation/drowk-crm-00`;
- [DONE] post-merge CI green.

### Completed — DCRM-02B

- [DONE] Cloudflare Access alpha verifier behind provider-neutral PrincipalVerifier;
- [DONE] exact issuer+subject remains DROWK identity key;
- [DONE] ACTIVE DROWK tenant membership remains mandatory;
- [DONE] fail-closed/no-provider behavior preserved;
- [DONE] PR #5 merged into `foundation/drowk-crm-00`;
- [DONE] post-merge CI green.

### Completed — DCRM-03A Gmail observation boundary

- [DONE] PR #6 merged into `foundation/drowk-crm-00`;
- [DONE] merge commit `24df7cece88048fe7dcbb036343d3943c97d59a8`;
- [DONE] exact-head CI `36338743226` green;
- [DONE] post-merge CI `36341467573` green;
- [DONE] source preservation, replay/conflict, controlled History recovery and
  candidate-only promotion boundary proven;
- [CLOSED] live Gmail/OAuth/network access;
- [CLOSED] Gmail draft/send and Apps Script writer authority;
- [CLOSED] accepted CRM mutation from the connector.

### Completed — DCRM-04A Work Engine contract parity

- [DONE] PR #8 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `966764fbc802459895c8c7eb15236aeaf851ce46`;
- [DONE] merge commit `79594c5377d779685466c591aab8c0f5200cca12`;
- [DONE] exact-head CI `36363387085` green;
- [DONE] post-merge CI `36364058535` green;
- [DONE] deterministic compiler, source precedence/conflicts, PWM WP-02 goldens,
  idempotency/supersession and authority sensors proven;
- [DONE] date-only `dueDate` preserves policy calendar dates without invented
  midnight timestamps;
- [CLOSED] JEV/model and Gmail writer paths inside deterministic compilation;
- [DEFERRED] durable/atomic Work persistence writer remains a later explicit gate.

### Current checkpoint — executable relationship-memory gap

Repository inspection after DCRM-04A closure shows the product canon is ahead of
the executable relationship model.

Executable today:
- Account and Facility;
- a minimal Contact;
- Evidence / IdentityEvidence / EntityMatchDecision;
- deterministic Work.

Not yet executable as canonical objects:
- Person;
- canonical Identity;
- Employment;
- Relationship;
- Buyer Role;
- Commitment.

The minimum next dependency is durable human continuity: Person + canonical Identity
+ temporal Employment, including explicit Contact -> Person linkage.

### Completed — DCRM-04B Durable Human Continuity Foundation

- [DONE] PR #9 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `806dd9b6b174719c125451bf8daac5faf0298b57`;
- [DONE] merge commit `84c8de486695fb00497c3f3cb215f2051784b80e`;
- [DONE] exact-head CI `36370602136` green;
- [DONE] post-merge CI `36371069501` green;
- [DONE] foundation/PR validation `36371072200` green;
- [DONE] Person, canonical Identity, temporal Employment and explicit Contact -> Person linkage;
- [DONE] MATCHED_SAFE/exact-target and tenant isolation fail closed;
- [CLOSED] Relationship/BuyerRole/Commitment and live-provider scope remained outside the package.

### Post-DCRM-04B checkpoint

The executable model now has durable human continuity, but canonical
Conversation/Activity/ActivityParticipant objects are still absent.

The Gmail connector remains correctly observation/candidate-only. Relationship and
communication-derived Commitment should not bypass the accepted interaction
projection by treating Gmail thread/message refs as CRM truth.

See:
`docs/architecture/POST_DCRM04B_INTERACTION_GAP_2026-09-28.md`.

### Completed — DCRM-04C Accepted Interaction Foundation

- [DONE] PR #10 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `af717e1656e8d50ee93607489c7c57e66a11933a`;
- [DONE] merge commit `136525a8c6443f6a6b3a83d73181d809613527b7`;
- [DONE] exact-head CI `36386478992` green;
- [DONE] post-merge push CI `36386917696` green;
- [DONE] foundation/PR validation CI `36386920548` green;
- [DONE] Conversation / Activity / ActivityParticipant accepted projection;
- [DONE] Observation/Evidence/Policy authority and participant Identity->Person authority;
- [DONE] migrations 0006/0007 and Gmail namespace compatibility sensors;
- [CLOSED] live Gmail, Relationship, BuyerRole, Commitment, AIsa/model, outbound and deploy remained outside the package.

### Post-DCRM-04C checkpoint

Accepted interaction history now exists. The next structural gap is bilateral
Commitment memory: who requested/promised what, which side owes the next move,
context/date/condition, and confirmation state.

Commitment must remain distinct from Activity, Task and WorkItem.

See:
`docs/architecture/POST_DCRM04C_COMMITMENT_GAP_2026-09-28.md`.

### Completed — DCRM-04D Commitment Memory Foundation

- [DONE] PR #11 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `504ae86102fa81f82d04cfe3a83087df0ea59189`;
- [DONE] merge commit `b71205d8ee79b8ea2d1ce22cabf31004ad3ac4eb`;
- [DONE] exact-head CI `36432687225` green;
- [DONE] post-merge push CI `36433066848` green;
- [DONE] foundation/PR validation CI `36433073983` green;
- [DONE] Commitment remains distinct from Activity/Task/Work;
- [DONE] Activity/Evidence/Policy authority, counterparty participant authority,
  calendar-date semantics and immutable supersession history;
- [DONE] single-successor correction in migration 0009;
- [CLOSED] Relationship/BuyerRole/model/live Gmail/outbound/deploy remained outside the package.

### Post-DCRM-04D checkpoint

Relationship is the next missing canonical memory object, but DCRM-04C closure
already required two interaction continuity gates before Relationship consumes the
history: idempotent source Conversation identity and participant correction history.

See:
`docs/architecture/POST_DCRM04D_INTERACTION_CONTINUITY_GAP_2026-09-28.md`.

### Completed — DCRM-04E Interaction Continuity Hardening

- [DONE] PR #12 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `0a3be336d075250bb133dac5d605bdb9446324e6`;
- [DONE] merge commit `d36cbe68d30f2ee6cb0dde1b6b9be14b00fe597d`;
- [DONE] exact-head CI `36441476373` green;
- [DONE] post-merge push CI `36449747837` green;
- [DONE] foundation/PR validation CI `36449754965` green;
- [DONE] idempotent namespaced/channel-scoped source Conversation claim;
- [DONE] append-only participant correction/retraction + deterministic current projection;
- [DONE] current-participant authority propagated into new Commitment promotion;
- [CLOSED] Relationship/BuyerRole/model/live Gmail/outbound/deploy remained outside the package.

### Post-DCRM-04E checkpoint

The interaction-history continuity prerequisites are now closed. Relationship is the
next missing canonical relationship-memory object.

See:
`docs/architecture/POST_DCRM04E_RELATIONSHIP_GAP_2026-09-28.md`.

### Completed — DCRM-04F Relationship Memory Foundation

- [DONE] PR #13 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `ee9e76b8418f1e2ebdf309d436451fcaeda8b029`;
- [DONE] merge commit `a9690e8ff8ff898b2769eac378dde44838794bc5`;
- [DONE] exact-head CI `36454614415` green;
- [DONE] post-merge push CI `36461840856` green;
- [DONE] foundation/PR validation CI `36461846945` green;
- [DONE] durable tenant-to-Person Relationship root;
- [DONE] ACTIVITY / RECIPROCAL / MEANINGFUL attributable interaction memory;
- [DONE] independent known-time clocks and current participant authority;
- [CLOSED] BuyerRole/score/model/live provider/outbound/deploy remained outside the package.

### Post-DCRM-04F checkpoint

The relationship-memory foundation series is complete. The roadmap now returns to
DCRM-05 AIsa Capability Lab.

See:
`docs/architecture/POST_DCRM04F_CAPABILITY_LAB_GAP_2026-09-28.md`.

### Completed — DCRM-05A Capability Lab Harness

- [DONE] PR #14 merged into `foundation/drowk-crm-00`;
- [DONE] feature head `c1b8183fae7b117b2540d064e4d0ad58c8d3f078`;
- [DONE] merge commit `d6f89e40ede689a23508ba3a3accda07d0bd6810`;
- [DONE] exact-head CI `36513834498` green;
- [DONE] post-merge push CI `36514783019` green;
- [DONE] foundation/PR validation CI `36514788600` green;
- [DONE] synthetic provider-neutral ResearchRun/ProviderRun harness;
- [DONE] deterministic fingerprints, immutable ProviderRun history, result/cost semantics;
- [DONE] bounded cost/tool-call/stop-condition enforcement including direct-SQL fail-closed correction;
- [CLOSED] live providers/credentials/CRM mutation/universal score/outbound/deploy remained outside the package.

### Post-DCRM-05A checkpoint

The synthetic capability-lab substrate is complete.

Before any live provider connector, execute the already-defined dedicated
foundation-to-main release review.

See:
`docs/architecture/POST_DCRM05A_FOUNDATION_RELEASE_GATE_2026-09-28.md`.

### Completed — Foundation -> main release review

- [DONE] PR #1 dedicated deep release review: NO BLOCKING FINDING for source merge;
- [DONE] owner explicitly authorized merge;
- [DONE] reviewed foundation head `c0a2b9ceff01dbda5308d15b76eb1db1e77aa9c7`;
- [DONE] merge commit on `main` `99c3900aa2e9aa074c2d9f97ccce811557be922f`;
- [DONE] release-head CI `36515107336` green;
- [DONE] release-head PR validation `36515110766` green;
- [DONE] post-merge main CI `36519721659` green;
- [CLOSED] deployment/live Gmail/live providers/provider WRITE/outbound remained separately gated.

### Completed — DCRM-05B Provider Selection & Live Validation Readiness

- [DONE] public/current provider research performed;
- [DONE] one exact capability cell selected;
- [DONE] selected path:
  `AIsa REST -> DataForSEO Business Listings Search Live`;
- [DONE] workload cell:
  `FACILITY_LOCATION_DISCOVERY`;
- [DONE] READ-only cost/auth/rights/retention/result-state envelope documented;
- [DONE] first request bounded to one call and $0.015;
- [DONE] credentials remain external to Git;
- [DONE] no live request was made;
- [DONE] no Codex implementation branch was created during the 05B selection gate.

Research:
`docs/research/DCRM-05B_PROVIDER_SELECTION_2026-09-28.md`

### Completed — DCRM-05C accepted live validation

[Work package](../work-packages/DCRM-05C-aisa-dataforseo-business-listings-live-validation.md)
and [safe evidence](../research/DCRM-05C_LIVE_VALIDATION_EVIDENCE_2026-09-29.md).

- [DONE] live gate executed exactly once at `1432d2ab1042c7a8fcc5f200c411315cb55b45df`;
- [DONE] technical PASS: `PRESENT`, `RECORDED`, actual cost `$0.01308`;
- [DONE] formal owner acceptance; exact cell promoted to `LIVE_VALIDATED_CAPABILITY`;
- [DONE] zero retries, reconciliation or canonical CRM mutation;
- [DONE] PR #15 merged to `main` as `93cca53023c75ee52d86a3df1d7cdb4749c019eb`;
- [DONE] post-merge CI `36535730059` green;
- [CLOSED] no new live call authorized; deployment, Gmail, outbound and DCRM-06 remain separately gated.

Promotion is limited to the evidence's exact tuple now released on `main`.
`Provider output != CRM truth`.

### Completed — EF-01A Execution Foundation: Engineering Harness, Reproducible CI & Secret Safety

[Work package](../work-packages/EF-01A-executable-engineering-harness-ci-secret-safety.md)
and [Execution Foundation plan](EXECUTION_FOUNDATION_PLAN.md).

Closure evidence:
- base `main`: `4a86eac14a209cd47617285d88419db2fe49a365`;
- final reviewed head: `051cfd91c0eeeb87dd8f451e5d5310f02fd361ec`;
- PR #18 merged to `main` as `1d7e4453e101c8ac79d9084c1a25547b4b917b7f`;
- post-merge CI `36581115791`: `verify` SUCCESS and `postgres-foundation` SUCCESS;
- executable harness modes, real lint, frozen-lockfile CI, immutable Action commit pins and redacted tree/history secret sensors are released on `main`;
- no deploy, external provider call, Gmail live or outbound occurred.

### Active gate - EF-01B Repository Governance & Branch Protection

Status: ACTIVE - REPO-OWNED IMPLEMENTATION COMPLETE - CLOSED/GREEN.

Authorized branch: `feat/ef-01b-repository-governance`; base:
`c74cb8415fee6e550661d5a64645e5320763110d`. The exact policy, GET-only verifier
and synthetic governance tests are implemented under `tooling/governance/`.
`harness:test` includes these offline tests; CI never invokes remote governance APIs.
No GitHub administration state has been changed by this implementation.

[Work package](../work-packages/EF-01B-repository-governance-branch-protection.md) and
[owner runbook](REPOSITORY_GOVERNANCE.md). Owner admin apply, live verification,
independent metadata review, protected merge and post-merge CI remain pending.

Closed EF-01B evidence:
- PR #20 final head `563e2043bcdf4e2eb94bb1916c430f91b5659905`;
- merge commit `c70ba3e0a68794a4dadae7568107ba29eb4cfce1`;
- post-merge CI `36589368723`: verify SUCCESS and postgres-foundation SUCCESS;
- `main.protected=true` remains active after merge;
- required checks `verify` and `postgres-foundation` remain bound to GitHub Actions app id `15368`;
- merged head branch auto-deleted;
- no deploy/provider/Gmail/outbound action occurred.

Closed EF-01B governance evidence:
- owner-side `governance:verify` PASS;
- independent GitHub metadata: `main.protected=true`;
- required checks `verify` and `postgres-foundation` enforced for everyone and bound to GitHub Actions app id `15368`;
- `allow_update_branch=true` and `delete_branch_on_merge=true`;
- PR #20 merged through protected `main` as `c70ba3e0a68794a4dadae7568107ba29eb4cfce1`;
- post-merge CI `36589368723`: verify SUCCESS and postgres-foundation SUCCESS;
- docs-only closure PR #21 merged as `154b34b61c7f6082f7fa5aa4ba1c5347cfa49efd`;
- closure post-merge CI `36590845123`: verify SUCCESS and postgres-foundation SUCCESS;
- no open PR remains after EF-01B closure.

EF-01B is no longer an active gap.

### Completed — EF-02 Reproducible Runtime Packaging

Status: CLOSED/GREEN / MERGED TO PROTECTED MAIN / POST-MERGE CI GREEN / NO DEPLOY.

Closure evidence:
- authorized base `8e4a290b9336005b31e32b02bea8d8deeb542074`;
- final reviewed head `13ffae8901c6d00f727c775aae7ed68981a1f7e1`;
- PR #23 merged through protected `main` as `65a03df0aaf42447642e130cccf881cff247799d`;
- post-merge CI `36670214400`: `verify` SUCCESS and `postgres-foundation` SUCCESS;
- required `verify` now includes Docker-backed `runtime:verify`;
- API/worker final images are non-root `1000:1000` with exact Git-revision labels;
- Node 22 and PostgreSQL 16-alpine inputs are digest pinned;
- API no-DB proof remains `/health=200`, `/ready=503`;
- local Compose migration exits 0 and composed `/ready=200`;
- API and inert worker signal handling pass;
- runtime verifier cleanup proves 0 containers / 0 networks / 0 volumes;
- APP_ENV vocabulary is exactly `development | test | staging | production`;
- no dependency/lockfile delta;
- no image push, deploy, provider call, Gmail live/outbound or queue/orchestrator work occurred.

EF-03 Staging Boundary is next but NOT YET AUTHORIZED. It is a separate deployment gate.

### Foundation release gate — CLOSED

PR #1 was reviewed and merged into `main` as `99c3900aa2e9aa074c2d9f97ccce811557be922f`.
This closes the source-code foundation release gate only. Production deployment and
live provider/Gmail/outbound authority remain separate explicit gates.

### Coupling rule for DCRM-03A / DCRM-04A

After DCRM-00B closes, Gmail and Work Engine extraction may proceed in parallel
only if each produces artifacts consumed by the same DROWK contracts/tests.

No independent legacy feature development is allowed.

## Writer ownership

Current writer state:

- DCRM-03A and DCRM-04A feature implementations are closed and merged;
- DCRM-04B is closed and merged;
- DCRM-04C is closed and merged;
- DCRM-04D is closed and merged;
- DCRM-04E is closed and merged;
- DCRM-04F is closed and merged;
- DCRM-05A is closed and released to `main` through PR #1;
- DCRM-05C is closed and released to `main` through PR #15;
- DCRM-05B provider selection/research is closed;
- DCRM-05C exact cell is `LIVE_VALIDATED_CAPABILITY`;
- EF-01A is closed and released to `main` through PR #18;
- EF-01B is closed and released through protected `main`;
- EF-02 is closed and released through protected `main` via PR #23;
- no implementation work package is currently active;
- EF-03 Staging Boundary is next but NOT YET AUTHORIZED;
- no additional live request or credential use is authorized;
- post-merge CI is green; deployment remains closed;
- DROWK CRM remains the canonical implementation surface;
- PWM local files remain preservation/regression reference only unless a new
  explicit extraction gate is opened.

Do not have Codex and ChatGPT edit the same repository/file surface concurrently.

## Definition of aligned

The bridge is aligned when all are true:

- the local PWM checkpoint is explicit;
- old direct Gmail-to-Core tests no longer masquerade as target architecture;
- reusable cursor/pagination/idempotency mechanics are preserved;
- Draft/SENT/SPAM/relevance rules match the authoritative checkpoint;
- first runtime gate remains zero-Core-mutation;
- DROWK owns the new canonical contracts;
- no required behavior exists only in chat memory.
