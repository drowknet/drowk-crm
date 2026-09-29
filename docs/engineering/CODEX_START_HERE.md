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

No implementation WP is currently authorized.

DCRM-05B provider selection is closed.

Selected path:
`AIsa REST -> DataForSEO Business Listings Search Live -> FACILITY_LOCATION_DISCOVERY`.

DCRM-05C live validation was executed exactly once and accepted by the owner:
`docs/work-packages/DCRM-05C-aisa-dataforseo-business-listings-live-validation.md`.

The exact cell is `LIVE_VALIDATED_CAPABILITY`; its full tuple and safe audit are in
[the accepted evidence](../research/DCRM-05C_LIVE_VALIDATION_EVIDENCE_2026-09-29.md). No other AIsa cell is promoted.

No new live call or credential use is authorized. Merge still requires a separate
owner gate; post-merge CI remains pending. Deployment, Gmail live, outbound,
reconciliation and DCRM-06 remain closed. `Provider output != CRM truth`.
