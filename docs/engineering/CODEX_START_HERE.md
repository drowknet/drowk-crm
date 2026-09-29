# Codex Start Here

This file is the local entrypoint for Codex when working on DROWK CRM.

## 1. Establish exact repository state

Before edits, report:
- machine/user;
- repository path;
- branch;
- HEAD SHA;
- `git status --short`.

Do not assume a worktree is current merely because the directory exists.

## 2. Read only the context required for the active task

Always read:
1. root `AGENTS.md`;
2. `docs/engineering/CURRENT_EXECUTION_SEQUENCE.md`;
3. the active work package named there;
4. the nearest scoped `AGENTS.md` files for directories you will edit.

Do not load the entire docs tree by default.

## 3. Writer discipline

- One branch / one active writer per file surface.
- When Codex is implementing on a feature branch, ChatGPT reviews that branch but
  does not edit the same files concurrently.
- Use subagents as narrow critics/researchers/test reviewers, not concurrent
  writers on the same files.
- If a required change falls outside the active WP, report it instead of silently
  broadening scope.

## 4. Canonical source

The GitHub repository `drowknet/drowk-crm` is the canonical product source.

`D:\Workspace\Projects\PWM\PWM_CRM` is a legacy/source/regression oracle and is
read-only by default. Do not propagate DROWK product changes back into PWM_CRM.

## 5. Completion contract

Before asking for review:
- run the WP's deterministic sensors;
- report exact files changed;
- report test/typecheck/integration results;
- report unresolved findings and scope deviations;
- do not merge or deploy unless explicitly authorized.

## Current direction

The active engineering sequence lives in:
`docs/engineering/CURRENT_EXECUTION_SEQUENCE.md`.

That file, not chat history, tells Codex which work package is currently active.

DCRM-02A, DCRM-02B, DCRM-03A, DCRM-04A, DCRM-04B, DCRM-04C, DCRM-04D, DCRM-04E, DCRM-04F and DCRM-05A are closed.

DCRM-05A merged as `d6f89e40ede689a23508ba3a3accda07d0bd6810` and its
post-merge CI is green.

The foundation release was merged into `main` as
`99c3900aa2e9aa074c2d9f97ccce811557be922f` with post-merge CI green.

EF-01A is closed and merged to `main` through PR #18 as
`1d7e4453e101c8ac79d9084c1a25547b4b917b7f`; post-merge CI `36581115791` is green.

EF-01B Repository Governance & Branch Protection is CLOSED/GREEN.

PR #20 merged through protected `main` as
`c70ba3e0a68794a4dadae7568107ba29eb4cfce1`; post-merge CI `36589368723` is green.
The docs-only closure PR #21 merged as
`154b34b61c7f6082f7fa5aa4ba1c5347cfa49efd`; post-merge CI `36590845123` is green.

Read [the work package](../work-packages/EF-01B-repository-governance-branch-protection.md)
and [the governance runbook](REPOSITORY_GOVERNANCE.md) for the frozen policy and evidence.

EF-02 Reproducible Runtime Packaging is the currently authorized implementation work package:

`docs/work-packages/EF-02-reproducible-runtime-packaging.md`

Authorized branch:
`feat/ef-02-reproducible-runtime-packaging`

Authorized base:
`8e4a290b9336005b31e32b02bea8d8deeb542074`

Read `docs/engineering/RUNTIME_PACKAGING.md` before implementation.

Scope is local/reproducible packaging, runtime config/lifecycle hardening and deterministic
container sensors only. No deployment, staging, image push, provider live call, Gmail live,
outbound, queue/orchestrator selection, DB migration or CRM business-semantics change is authorized.

DCRM-05B provider selection is closed.

Selected path:
`AIsa REST -> DataForSEO Business Listings Search Live -> FACILITY_LOCATION_DISCOVERY`.

DCRM-05C live validation was executed exactly once and accepted by the owner:
`docs/work-packages/DCRM-05C-aisa-dataforseo-business-listings-live-validation.md`.

The exact cell is `LIVE_VALIDATED_CAPABILITY`; its full tuple and safe audit are in
[the accepted evidence](../research/DCRM-05C_LIVE_VALIDATION_EVIDENCE_2026-09-29.md). No other AIsa cell is promoted.

DCRM-05C merged to `main` as `93cca53023c75ee52d86a3df1d7cdb4749c019eb`, and post-merge CI `36535730059` is green.
No new live call or credential use is authorized. Deployment, Gmail live, outbound,
reconciliation and DCRM-06 remain closed pending separate owner-authorized work packages.
`Provider output != CRM truth`.
