# EF-01B — Repository Governance & Branch Protection

Status: CLOSED/GREEN — MERGED TO PROTECTED MAIN — POST-MERGE CI GREEN — NO DEPLOY

Authorized base: `c74cb8415fee6e550661d5a64645e5320763110d`

Authorized branch: `feat/ef-01b-repository-governance`

Canonical runbook: `docs/engineering/REPOSITORY_GOVERNANCE.md`

## Purpose

Make GitHub enforcement match DROWK's owner-gated proof-carrying engineering process before
any deployment boundary opens.

## Opening evidence

- `main` is not protected;
- required checks are not enforced by branch protection;
- current CI checks are `verify` and `postgres-foundation`, both from GitHub Actions app id `15368`;
- `allow_update_branch=false`;
- `delete_branch_on_merge=false`;
- all three merge methods are enabled and auto-merge is disabled;
- no PR is open;
- ChatGPT's connected GitHub surface cannot perform repository-administration writes.

## Authorized implementation surfaces

Codex may change only:
- `tooling/governance/**`;
- root `package.json` for governance scripts/test wiring;
- EF-01B docs/canon required to reflect implementation reality.

No dependency is expected. Stop for review instead of adding one silently.

## Required repo-owned contract

Implement:
- `tooling/governance/main-protection-policy.json`;
- `tooling/governance/verify-main-protection.mjs`;
- synthetic unit tests;
- `tooling/governance/README.md`;
- root `governance:test` and `governance:verify` scripts;
- include governance unit tests in the ordinary harness test gate without calling remote admin APIs in CI.

The live verifier must be read-only, use authenticated `gh api`, compare exact repository and
`main` protection state, fail closed on partial/malformed/API/auth failures, and never print
tokens, environment values, response headers or raw error bodies.

Tests must cover required-check names/app ids, strict mode, admin enforcement, PR requirement,
approval count, conversation resolution, force/deletion controls, merge settings, repo settings,
extra/missing checks and malformed/partial API shapes.

## Required final live state

`main`:
- protected;
- strict `verify` + `postgres-foundation`, GitHub Actions app id `15368`;
- PR requirement enabled, zero required approvals;
- admin enforcement enabled;
- conversation resolution required;
- force pushes/deletion disabled;
- no bypass allowance;
- no linear-history requirement and no branch lock.

Repository:
- `allow_update_branch=true`;
- `delete_branch_on_merge=true`;
- `allow_auto_merge=false`;
- merge/squash/rebase remain enabled.

## Explicitly forbidden

- deploy/staging;
- product/domain/provider behavior changes;
- DB migrations/schema changes;
- provider/AIsa calls;
- Gmail live/OAuth or outbound;
- Docker/runtime packaging;
- signed-commit migration;
- CODEOWNERS/reviewer-topology changes;
- approvals above zero;
- auto-merge/merge queue;
- ruleset migration;
- deletion of historical branches;
- EF-02 or DCRM-06 implementation.

## Review/apply sequence

Completed before merge gate:
1. Codex implemented the repo-owned verifier.
2. Exact-head CI and deep review passed.
3. Owner applied repository settings and the corrected checks-only branch-protection payload.
4. Local `governance:verify` passed.
5. Independent GitHub metadata confirmed protected `main`, exact required checks/app id and repository settings.

Completed after live apply:
6. final exact-head CI after the docs-only live-evidence correction passed;
7. PR #20 entered the explicit owner merge gate;
8. PR #20 merged through protected `main` as `c70ba3e0a68794a4dadae7568107ba29eb4cfce1`;
9. post-merge CI `36589368723` is green;
10. merged head branch was automatically deleted;
11. this closure records EF-01B CLOSED/GREEN.

No implementation work package is currently active. EF-02 is next in the Execution Foundation
sequence but requires a separate owner gate.

No deployment is included.
