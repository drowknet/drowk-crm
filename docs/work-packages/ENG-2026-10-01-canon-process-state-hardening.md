# ENG-2026-10-01 — Canon / Process / State Hardening

Status: DOCS-ONLY CORRECTION / NO LIVE AUTHORITY

## Purpose

Correct demonstrated canon drift and operational ambiguity without changing application, database,
provider, runtime or deployment behavior.

## Evidence basis

Direct GitHub revalidation on 2026-10-01 established protected `main`
`175c23e78033aa6705783371cf858044460178f8`, required checks `verify` and
`postgres-foundation`, an unmerged Q2B working branch, and deletion of the historical Q2A branch
after merge. Owner-confirmed provider configuration state is DigitalOcean UNCONFIGURED, Neon
UNCONFIGURED and Apollo UNCONFIGURED.

## Corrections

1. Promote owner-bootstrap/Codex STOP/no-repair lessons into repo-owned engineering canon.
2. Clarify that EF-01A `harness:preflight` is repository preflight, not owner-local writer bootstrap.
3. Separate remote GitHub, local workspace, tool availability, provider configuration and owner
   authority semantics.
4. Correct stale provider/configuration and EF-03 deployment-identity statements.
5. Correct stale Q2A/Crawl4AI execution wording and historical branch labels.
6. Preserve ordinary Docker-backed CI; no sensor is weakened to satisfy documentation.

## Explicit non-goals

No provider inspection/configuration/call, no DigitalOcean/Neon/Cloudflare resource mutation,
no Apollo call, no Gmail/LinkedIn live action, no DB/migration change, no runtime/app change,
no image push, no deploy, no Q2B candidate execution, no PR and no merge are authorized here.

## Harness disposition

The EF-01A harness implementation is intentionally unchanged. Deep review confirmed that the
existing preflight semantics match the EF-01A specification. The correction belongs in
orchestration/state semantics, not in `tooling/harness/run.mjs`.

## Completion

- all changed paths remain documentation/README surfaces;
- no manifest/lockfile/application/runtime/database/CI configuration delta;
- exact changed-path review and content sanity;
- repository CI remains green at exact branch head;
- independent review finds no blocking contradiction before any PR/merge decision.
