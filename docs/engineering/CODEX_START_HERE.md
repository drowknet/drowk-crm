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

The next queued work package is:
`docs/work-packages/DCRM-02A-identity-membership-context.md`.

Do not execute it from foundation. The owner must first create/switch to the
dedicated DCRM-02A feature branch.
