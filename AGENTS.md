# AGENTS.md — DROWK CRM

This repository is the canonical engineering source for DROWK CRM.

## Hard boundaries

- The only repository authorized for writes is `drowknet/drowk-crm`.
- All other repositories are read-only reference sources.
- `D:\Workspace\Projects\PWM\PWM_CRM` is read-only unless the owner explicitly authorizes a specific write.
- Never run destructive Git/disk operations, `clasp push`, Apps Script writer functions, outbound messaging, production deploys, credential rotation, or provider write-capabilities without an explicit owner gate.
- Never commit secrets, OAuth/session material, raw Gmail/LinkedIn/CRM exports, production dumps, or tenant/customer/prospect PII. Use synthetic or redacted fixtures.

## Mission

Build a provider-independent Revenue Intelligence & Prospecting Operating System that preserves source facts, separates evidence from accepted business state, keeps authority deterministic and auditable, and supports human-governed AI assistance.

## Non-negotiable invariants

1. Human/policy authority outranks model output.
2. Source observations preserve provenance and freshness.
3. Provider/model output enters Observation/Evidence before accepted CRM state.
4. Identity ambiguity fails closed for risky actions; ambiguity does not block evidence collection.
5. Account != Facility.
6. Draft != Sent; Sent != Delivered.
7. Spam != commercial irrelevance.
8. Unknown != No; bounded empty response != universal absence.
9. Signal != Opportunity; Forecast != Fact.
10. Read and write capabilities are independently authorized.
11. Material writes preserve tenant, actor/run, policy and audit lineage.
12. Current CRM state is a projection over attributable history, not an excuse to erase history.

## Working style

- Prefer the smallest reversible implementation that advances an approved architecture.
- Do not re-litigate settled architecture unless evidence changes.
- Do not introduce frameworks, services or databases without a measured need.
- Before editing a scoped area, read the nearest `AGENTS.md` and relevant ADR/spec.
- For material tasks, follow `docs/engineering/CODEX_ORCHESTRATION.md`.
- Use subagents for independent review/research/testing when useful; do not let multiple agents edit the same files concurrently.
- Model output is a candidate. Tests/sensors and owner gates determine promotion.

## Canonical flow

```text
Source
-> Observation
-> Evidence
-> Identity
-> Signal
-> Judgment
-> Policy
-> Accepted CRM Projection
-> Work
-> Human / Bounded Action
-> Outcome
-> Learning
```

## Pull requests

Material PRs should state: problem, scope, affected objects, migration impact, provider/security impact, test/eval evidence, and rollback path.
