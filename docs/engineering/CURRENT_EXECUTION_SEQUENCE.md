# Current Execution Sequence — PWM -> DROWK Bridge

Status: DCRM-00B CLOSED — DCRM-01A ACTIVE
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

### Current gate — DCRM-01A implementation

DCRM-00B is reconciled. Proceed with:

- [DONE] run the foundation migration against disposable PostgreSQL in CI;
- [DONE] add executable PostgreSQL migration sensor;
- [DONE] add initial relational tenant-isolation integration tests;
- [NEXT] implement repository/persistence layer for:
  Account -> Facility -> SourceObservation -> Evidence;
- keep Gmail network/OAuth disabled.

### Step 4 — DCRM-03A / DCRM-04A extraction in parallel only when coupled

After DCRM-00B closes, Gmail and Work Engine extraction may proceed in parallel
only if each produces artifacts consumed by the same DROWK contracts/tests.

No independent legacy feature development is allowed.

## Writer ownership

During DCRM-01A:

- drowk-crm branch is the active product implementation surface;
- PWM local files are preservation/regression reference only unless a new explicit extraction gate is opened;
- do not develop new product features in PWM_CRM;
- Codex does not need GitHub access until a later implementation gate explicitly gives it a DROWK checkout.

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
