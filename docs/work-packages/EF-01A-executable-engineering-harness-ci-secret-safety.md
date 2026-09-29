# EF-01A — Executable Engineering Harness, Reproducible CI & Secret Safety

Status: CLOSED — MERGED TO MAIN — POST-MERGE CI GREEN — NO DEPLOY

Authorized base:
`4a86eac14a209cd47617285d88419db2fe49a365`

Authorized branch:
`feat/ef-01a-engineering-harness-ci-secrets`

## Purpose

Turn the repository's planned engineering harness into an executable proof surface and make
ordinary CI reproducible and secret-safe before containers, staging, durable execution or
broader provider expansion.

This package protects future work; it does not change CRM business behavior.

## Audit facts at authorization

At the authorized base:
- root `verify` runs typecheck + tests but not lint;
- root `lint` exists but no workspace linter/configuration is present;
- CI installs dependencies with `pnpm install --no-frozen-lockfile`;
- `tooling/harness` documents preflight/fast/full/ci/integration modes but has no executable runner;
- no executable secret sensor exists;
- GitHub Actions reference mutable `@v4` action tags;
- CI already uses `permissions: contents: read`;
- PostgreSQL integration sensors already exist and must remain green;
- `main` branch protection is not technically enabled. That administrative gap is tracked as
  EF-01B and is not silently closed by this package.

## Allowed surfaces

Implementation may change only what is necessary in:
- root `package.json` and `pnpm-lock.yaml`;
- lint configuration at repository root;
- `.github/workflows/ci.yml`;
- `tooling/harness/**`;
- repository docs required to keep EF-01A execution/canon accurate;
- `.gitignore` or `.env.example` only when an exact harness/security requirement proves necessary.

Do not modify application/domain/database/provider behavior merely to satisfy the harness.

## Required outcomes

### A. Reproducible dependency gate

1. Declare the canonical package manager as `pnpm@10.17.1` in repository metadata.
2. GitHub CI must use `pnpm install --frozen-lockfile` in every Node dependency-install job.
3. CI remains on Node 22 as the canonical CI runtime for this package.
4. CI must fail rather than mutate or repair `pnpm-lock.yaml`.
5. Do not perform broad dependency upgrades; add only dependencies required for the approved
   lint/harness implementation.

### B. Real lint/static-analysis gate

1. Add an actual repository linter for TypeScript/JavaScript source using a root-owned,
   reviewable configuration.
2. `pnpm lint` must execute the linter, not alias typecheck.
3. CI lint runs read-only with zero automatic fixes.
4. Warnings must fail the gate; do not hide findings with blanket disables.
5. Generated output, third-party/vendor content and intentionally non-source artifacts may be
   excluded only through explicit narrow configuration.
6. Root `verify` must include lint in addition to existing typecheck/tests.

### C. Executable harness modes

Implement repo-owned commands for:
- `harness:preflight`;
- `harness:fast`;
- `harness:full`;
- `harness:ci`;
- `harness:integration`.

Required semantics:
- **preflight**: verify repository identity/root, Git/branch/HEAD availability, lockfile/package
  manager expectations and forbidden tracked secret-file classes; print no secret values;
- **fast**: preflight + secret sensor + lint + typecheck;
- **full**: fast + complete ordinary test suite;
- **ci**: deterministic non-interactive full gate used by GitHub Actions;
- **integration**: explicit disposable PostgreSQL integration gate, never implicit in fast/full.

`harness:integration` must fail closed unless disposable-test guards are present, including
`DROWK_TEST_DISPOSABLE=1` and `APP_ENV=test`. It must not call AIsa, Gmail live, outbound
services or any other external provider.

Do not create a self-recursive script graph.

### D. Executable secret sensor

Add a deterministic repo-owned secret scanner runnable locally and in CI.

Minimum requirements:
1. scan Git-tracked current source/configuration for high-confidence secret material;
2. detect at least private-key material and common high-confidence credential/token forms;
3. include a conservative assignment detector for secret/key/token/password variables without
   treating empty/example placeholders as credentials;
4. include a high-confidence Git-history sensor so obvious credential prefixes/private keys
   cannot hide only in prior commits;
5. emit only detector ID + file/line or commit/path metadata; never echo the matched value;
6. fail non-zero on a finding;
7. precise allowlists only, with path + detector + justification; no global/broad suppression;
8. tests must prove detection and prove redaction. Build synthetic candidate strings at test
   runtime so committed test source does not itself contain complete token-like fixtures;
9. `.env.example` with empty/example values must pass;
10. ordinary CI must invoke the secret sensor before promotion.

This package must not read or require any real provider/OAuth/production credential.

### E. GitHub Actions supply-chain hardening

1. Pin third-party GitHub Actions used by `.github/workflows/ci.yml` to immutable full commit SHAs.
2. Keep a human-readable comment indicating the corresponding action release/tag.
3. Checkout must not persist GitHub credentials after checkout unless a reviewed need is proven.
4. Preserve least-privilege workflow permissions (`contents: read`).
5. If history scanning requires full history, configure checkout explicitly rather than assuming
   the default fetch depth.
6. Preserve the existing PostgreSQL foundation job and its migration/tenant/Gmail-boundary/
   readiness sensors.

### F. Evidence and documentation

Update the harness README so its modes describe executable reality, not future intent.

The implementation handoff must report:
- exact base and final HEAD;
- exact changed files;
- package/dependency changes;
- `git diff --check`;
- secret-sensor tests;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test`;
- `pnpm harness:fast`;
- `pnpm harness:full`;
- disposable `pnpm harness:integration` when a suitable local PostgreSQL environment is available;
- exact-head GitHub CI for both `verify` and `postgres-foundation`;
- explicit confirmation that no credential value was printed or persisted.

## Explicitly forbidden

EF-01A does not authorize:
- production or staging deployment;
- Docker/container/runtime packaging (EF-02);
- GitHub branch/ruleset administration (EF-01B);
- database migrations or canonical-schema changes;
- Account/Facility/Person/Relationship/Commitment/Work/Signal behavior changes;
- AIsa/provider calls, including another DCRM-05C call;
- Gmail OAuth/live/history sync;
- outbound messaging;
- provider WRITE capability;
- credential creation, rotation or storage;
- Cloudflare/Gemini/Hermes integration;
- DCRM-06 Territory implementation;
- weakening or deleting an existing sensor/golden test to make CI pass.

## Review triggers

Stop and escalate rather than silently broadening scope if:
- existing source cannot pass a real linter without broad behavior changes;
- the secret sensor finds a probable real historical credential;
- a required GitHub Action cannot be immutably pinned;
- frozen lockfile install fails because the committed lockfile is inconsistent;
- integration requires a non-disposable database;
- a fix would touch runtime/domain/provider semantics.

A probable real secret finding must be reported only as redacted path/detector/commit metadata.
Do not paste the value into chat, logs, PR comments or GitHub issues.

## Completion contract

EF-01A completion contract is satisfied:
- implementation remained within the authorized surfaces;
- executable harness modes exist and match the specified semantics;
- lint is real and part of `verify`;
- frozen-lockfile CI is enforced;
- third-party Action references are immutable commit SHAs;
- secret sensor + redaction tests pass;
- existing deterministic suites remain green;
- exact-head CI `36580017403` was green;
- independent review found no blocker;
- owner authorized merge of PR #18 at `051cfd91c0eeeb87dd8f451e5d5310f02fd361ec`;
- PR #18 merged to `main` as `1d7e4453e101c8ac79d9084c1a25547b4b917b7f`;
- post-merge CI `36581115791` is green.

No deployment or external provider call was performed or authorized.

## Rollback

Before merge: abandon/revert the feature branch.

After merge: revert the EF-01A commit/merge. No production runtime or external provider state
is changed by this package.
