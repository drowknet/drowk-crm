# Current Execution Sequence — PWM -> DROWK Bridge

Status: DCRM-01A/B/C + DCRM-02A/B + DCRM-03A + DCRM-04A/B/C GREEN — DCRM-04D NEXT
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

### Next gate — DCRM-04D Commitment Memory Foundation

`docs/work-packages/DCRM-04D-commitment-memory-foundation.md`

Operator/product outcome:
- preserve attributable requests/promises/agreed next steps and who owes the next
  move without converting internal Work completion into external fulfillment.

Required proof:
- accepted Activity/Evidence/Policy lineage;
- safe optional counterparty Person linkage through ActivityParticipant authority;
- date-only and unknown temporal semantics;
- deterministic replay/conflict and append/supersede history;
- Commitment != Task != WorkItem;
- no Relationship/BuyerRole/model/live Gmail/outbound expansion.

Do not execute DCRM-04D from foundation. It requires a dedicated feature branch and
explicit owner/ChatGPT handoff.

### Foundation release gate

PR #1 (`foundation/drowk-crm-00` -> `main`) remains intentionally draft and unmerged.
It has accumulated multiple work packages. Before any production deployment or live
provider connector, perform a dedicated foundation-to-main release review and obtain
an explicit owner merge gate.

### Coupling rule for DCRM-03A / DCRM-04A

After DCRM-00B closes, Gmail and Work Engine extraction may proceed in parallel
only if each produces artifacts consumed by the same DROWK contracts/tests.

No independent legacy feature development is allowed.

## Writer ownership

Current writer state:

- DCRM-03A and DCRM-04A feature implementations are closed and merged;
- DCRM-04B is closed and merged;
- DCRM-04C is closed and merged;
- DCRM-04D is selected as the next implementation WP but no Codex writer is active yet;
- ChatGPT may update repo-owned planning/canonical docs before DCRM-04D handoff;
- DCRM-04D requires an explicit owner/ChatGPT handoff and a dedicated feature branch;
- once Codex starts that future branch, Codex is the sole writer on its implementation surfaces;
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
