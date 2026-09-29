# Repository governance verifier

EF-01B: ACTIVE. Repo-owned implementation complete; LIVE PROTECTION PASS; MERGE GATE PENDING.
Live admin apply and the repo-owned verifier now establish that `main` matches the frozen policy; merge remains owner-gated.

`main-protection-policy.json` records the exact owner-approved target for
`drowknet/drowk-crm`, branch `main`. It is a comparison contract, not an admin payload
or an executable apply script. No dependencies are added.

From the canonical repository root:

```text
npx --yes pnpm@10.17.1 governance:test
npx --yes pnpm@10.17.1 governance:verify
```

`governance:test` uses synthetic responses and an injected process boundary. It
requires neither authentication nor network access. These tests are also wired
into `harness:test`, and therefore fast/full/CI; the live verifier is not run by CI.

`governance:verify` requires installed/authenticated `gh`, the physical repository
root, the canonical Git origin and the DROWK root package identity. It accepts no
CLI arguments or alternate target. It executes only these fixed GETs on github.com:

- `repos/drowknet/drowk-crm`
- `repos/drowknet/drowk-crm/branches/main`
- `repos/drowknet/drowk-crm/branches/main/protection`

No auth/login/token command, raw header output, or administration mutation is used.
The existing gh authentication is used without reading or printing its credentials.
Captured API bodies/errors remain in memory and are never relayed or persisted.
Commands have a timeout and bounded captured output; missing gh, authentication,
API, JSON, schema and policy failures all exit nonzero.

## Comparison and safe diagnostics

Every required boolean, approving-review count, check name and app ID is validated
with its exact type. Check order is irrelevant; duplicates, extras, missing checks
and wrong/unbound app IDs fail. PR enforcement requires a review object; null fails.
All repository merge/settings flags are compared independently.

The legacy `contexts` array must be present and either empty or mirror the same
app-bound check names exactly. Disabled optional push/dismissal restrictions may
be omitted or null. A present restrictions object fails. Optional PR bypass
allowances may be omitted; a present block must have all three actor arrays empty
and no unknown fields. Other missing policy fields never receive default values.
Unrelated API metadata such as URLs is not a policy input.

Output is a status plus issue records containing only fixed field names and codes:

```json
{"status":"FAIL","issues":[{"field":"branch.protected","code":"MISMATCH"}]}
```

Neither expected/actual remote values, actor names, check names supplied by a
response, error bodies, headers nor environment values enter diagnostics. A failed
protection GET is `API_READ_FAILED`, never an inferred unprotected/valid policy.
Pre-apply failure is expected and does not authorize remediation by the verifier.

This verifier checks the frozen repository/classic branch-protection contract;
it does not administer rulesets, branches or permissions. A PASS alone does not
authorize a merge or deployment.

## Owner gate

The [canonical runbook](../../docs/engineering/REPOSITORY_GOVERNANCE.md) contains
the separately gated owner-side administration procedure. Codex does not execute
it. After review, the owner must apply the policy, the live verifier and independent
metadata review must pass, and merge/post-merge CI gates must complete before
EF-01B can be CLOSED/GREEN. EF-02 and DCRM-06 remain unauthorized.
