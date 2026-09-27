# Current Execution Sequence — PWM -> DROWK Bridge

Status: DCRM-01A/B/C + DCRM-02A GREEN — DCRM-02B DESIGN GATE NEXT
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

### Next design gate — DCRM-02B

No Codex implementation work package is active yet.

Before implementation, revalidate current production-auth/session options and define:
- production verifier/provider boundary;
- secure browser session lifecycle;
- tenant/user/session binding;
- CSRF, expiry, rotation and revocation behavior;
- recovery/owner-access requirements;
- the smallest alpha operator shell that preserves application-level authorization.

Do not select a provider from stale repository assumptions. Current provider behavior,
security capabilities and deployment constraints require fresh research.

### Parallel extraction status — DCRM-03A / DCRM-04A

DCRM-03A already has a partial synthetic connector implementation; explicit
source-observation/deduplication/recovery/promotion-boundary proof remains before any live Gmail gate.

DCRM-04A already has the canonical Work contract/state vocabulary; deterministic
compiler behavior and PWM golden-parity extraction remain pending.

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

- no Codex implementation branch is active now;
- ChatGPT owns architecture/research/spec work for the DCRM-02B design gate;
- do not start Codex implementation until a new work package and dedicated feature branch are explicitly named;
- drowk-crm is the active product implementation surface;
- PWM local files remain preservation/regression reference only unless a new explicit extraction gate is opened.

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
