# Repository Governance — EF-01B

Status: CLOSED/GREEN — PROTECTED MAIN ACTIVE — POST-MERGE CI GREEN — NO DEPLOY

Canonical repository: `drowknet/drowk-crm`

Protected branch target: `main`

## Opening facts

Observed at base `c74cb8415fee6e550661d5a64645e5320763110d`:
- `main.protected = false`;
- `allow_update_branch = false`;
- `delete_branch_on_merge = false`;
- `allow_auto_merge = false`;
- merge, squash and rebase merge methods are enabled;
- open pull requests = 0;
- current CI checks are `verify` and `postgres-foundation`;
- both checks are emitted by GitHub Actions app id `15368`.

The connected ChatGPT GitHub surface does not expose repository-administration writes.
EF-01B therefore uses a repo-owned contract/verifier plus one explicit owner-side admin apply.

## Canonical target policy

For `main`:
- strict/up-to-date required checks;
- require `verify` from GitHub Actions app id `15368`;
- require `postgres-foundation` from GitHub Actions app id `15368`;
- require pull requests, but `required_approving_review_count = 0` while there is one owner;
- apply protection to administrators;
- require conversation resolution;
- disable force pushes and branch deletion;
- no PR bypass allowance;
- do not require linear history;
- do not lock the branch;
- do not enable fork syncing;
- do not introduce signed-commit enforcement in EF-01B.

Repository settings:
- keep merge commit, squash and rebase methods enabled;
- keep auto-merge disabled;
- enable `allow_update_branch`;
- enable `delete_branch_on_merge` for future merged PR branches.

Zero mandatory approvals is deliberate: requiring one approval would deadlock a single-owner
repository when the owner authored the PR. Raising approval count requires a later governance gate.

## Owner-side admin apply

Run only after EF-01B implementation review is green.

```powershell
gh auth status

gh api --silent --method PATCH `
  -H 'Accept: application/vnd.github+json' `
  -H 'X-GitHub-Api-Version: 2026-03-10' `
  repos/drowknet/drowk-crm `
  -F allow_update_branch=true `
  -F delete_branch_on_merge=true

$policy = @'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "verify", "app_id": 15368 },
      { "context": "postgres-foundation", "app_id": 15368 }
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 0,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
'@

$policy | gh api --silent --method PUT `
  -H 'Accept: application/vnd.github+json' `
  -H 'X-GitHub-Api-Version: 2026-03-10' `
  repos/drowknet/drowk-crm/branches/main/protection `
  --input -
```

After apply, run the repo-owned `governance:verify` command. Merge remains forbidden until
the local verifier and an independent GitHub metadata review both pass.

## Live apply evidence — 2026-09-29

The owner applied the frozen repository settings and branch policy after GitHub Pro was enabled.

Observed sequence:
- repository settings `allow_update_branch=true` and `delete_branch_on_merge=true` applied successfully;
- first protected-branch attempt was blocked by plan entitlement before GitHub Pro;
- second attempt reached the API but failed schema validation because `contexts` and `checks`
  were sent together;
- canonical payload was corrected to app-bound `checks` only;
- final protection PUT succeeded;
- repo-owned `governance:verify` returned `{"status":"PASS","issues":[]}`;
- independent GitHub branch metadata reports `main.protected=true`;
- required check enforcement is `everyone`;
- required checks are `verify` and `postgres-foundation`, each bound to GitHub Actions app id `15368`;
- repository metadata reports `allow_update_branch=true` and `delete_branch_on_merge=true`.

The failed attempts did not create partial branch protection. No deploy, provider call, Gmail
live action or outbound execution occurred.

## Emergency rollback

Opening state was unprotected `main`, `allow_update_branch=false`,
`delete_branch_on_merge=false`. If the new policy causes a governance deadlock, the owner may
restore that exact prior state:

```powershell
gh api --silent --method DELETE `
  -H 'Accept: application/vnd.github+json' `
  -H 'X-GitHub-Api-Version: 2026-03-10' `
  repos/drowknet/drowk-crm/branches/main/protection

gh api --silent --method PATCH `
  -H 'Accept: application/vnd.github+json' `
  -H 'X-GitHub-Api-Version: 2026-03-10' `
  repos/drowknet/drowk-crm `
  -F allow_update_branch=false `
  -F delete_branch_on_merge=false
```

Emergency rollback is not a routine bypass. Record the reason and reopen EF-01B before
subsequent merges.

## Historical branches

EF-01B enables automatic deletion for future merged PR head branches. Existing historical
branches are intentionally retained as audit/reference refs during this package. Their presence
does not bypass protected `main`; no open PR currently targets them.

## Completion evidence

EF-01B completion contract is satisfied:
1. repo-owned verifier implementation reviewed and exact-head CI green;
2. owner applied the exact admin policy;
3. `main.protected = true` independently observed;
4. detailed admin verification matched the frozen policy;
5. PR #20 merged through protected `main` at head `563e2043bcdf4e2eb94bb1916c430f91b5659905`;
6. merge commit `c70ba3e0a68794a4dadae7568107ba29eb4cfce1`;
7. post-merge CI `36589368723`: `verify` SUCCESS and `postgres-foundation` SUCCESS;
8. merged PR head branch was automatically deleted under `delete_branch_on_merge=true`;
9. repository canon records EF-01B CLOSED/GREEN.

No deployment is authorized by this policy.
