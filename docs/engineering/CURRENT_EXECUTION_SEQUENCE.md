# Current Execution Sequence — PWM -> DROWK Bridge

Status: DCRM-01A/B/C + DCRM-02A/B + DCRM-03A GREEN — DCRM-04A NEXT
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

### Next gate — DCRM-04A Work Engine contract parity

Execute only after the owner/ChatGPT handoff creates or switches to the dedicated
feature branch:

`docs/work-packages/DCRM-04A-work-engine-contract-parity.md`

Operator outcome:
- deterministic Today/Work semantics can consume attributable state without
  confusing source activity, human/core work, Shadow suggestions or future
  relationship commitments.

Required proof:
- deterministic compiler;
- explicit source precedence/conflict behavior;
- PWM WP-02 synthetic golden parity;
- idempotency/supersession behavior;
- no JEV/model path in deterministic compilation;
- no Gmail write path.

Research guardrail:
- DCRM-04A must keep Work distinct from Commitment and relationship facts;
- seller effort must not be mistaken for buyer-confirmed progress;
- missing coverage must not become a negative relationship fact;
- full temporal relationship-memory implementation is a post-parity architecture
  checkpoint, not scope to smuggle into DCRM-04A.

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

- DCRM-03A feature implementation is closed and merged;
- no Codex DCRM-04A feature writer is active until the dedicated DCRM-04A branch is
  created/switched and the owner hands execution to Codex;
- ChatGPT may update repo-owned planning/canonical docs before that handoff;
- once Codex starts DCRM-04A, that feature branch has one active writer: Codex;
- ChatGPT reviews but does not edit the same feature branch while Codex is active;
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
