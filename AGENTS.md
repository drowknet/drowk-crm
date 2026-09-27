# AGENTS.md — DROWK CRM

This repository is the canonical engineering source for DROWK CRM.

## Repository authority boundary — HARD RULE

The only repository authorized for write operations in this project is:

`drowknet/drowk-crm`

All other DROWK repositories are READ-ONLY reference sources. They may be inspected only to collect ideas, contracts, conventions, patterns, or technical context needed by DROWK CRM.

Do not:
- create commits in other repositories;
- open or modify pull requests in other repositories;
- create or edit issues in other repositories;
- change repository settings, workflows, branches, secrets, deployments, or permissions outside `drowknet/drowk-crm`;
- treat another DROWK repository as an implementation target for CRM work.

## PWM_CRM source boundary — HARD RULE

The existing PWM_CRM lives on the owner's portable D: workspace and is a source/reference system during extraction.

Canonical local path:

`D:\Workspace\Projects\PWM\PWM_CRM`

Treat PWM_CRM as READ-ONLY unless the owner explicitly authorizes a specific write in a separate gate.

Do not:
- delete, move, rewrite, reset, clean, or reorganize PWM_CRM;
- run destructive Git commands there;
- run Apps Script writer functions;
- run `clasp push`;
- modify Gmail, Sheets, auth, OAuth scopes, or remote Apps Script state;
- copy raw tenant/prospect/customer data from PWM_CRM into this public repository.

PWM_CRM information may be inspected to extract:
- domain contracts;
- architecture;
- schemas;
- policies;
- tests;
- regression cases;
- source/evidence semantics;
- migration requirements.

Any extracted examples committed here must be synthetic, generalized, or redacted.

## Machine / environment rule for PWM_CRM

PWM_CRM may be accessed from more than one Windows machine using the same portable D: drive. Machine-local auth, safe.directory, clasp sessions, Codex sessions, runtimes, and caches must never be assumed portable.

When a future task depends on live PWM_CRM state, verify machine, user, path, Git state, and action risk before proceeding.

## Mission

Build a provider-independent Revenue Intelligence & Prospecting Operating System that preserves source facts, separates evidence from business truth, keeps execution authority deterministic and auditable, and supports human-governed AI assistance.

## Non-negotiable principles

1. Human authority outranks model output.
2. Source observations must be preserved with provenance and freshness.
3. Derived judgments must be reproducible and replaceable.
4. No external provider is a system of record.
5. Identity resolution must fail closed on ambiguity.
6. High-impact writes require explicit policy authority and usually human approval.
7. Every important write must be traceable.
8. Every autonomous action must be bounded by scope, budget, policy, and capability.
9. Provider/model failures must not create false certainty.
10. Never infer delivery from SENT state alone.
11. Never infer account/contact truth from email/domain alone.
12. Never treat a signal as an opportunity by itself.

## Repository safety

Never commit:
- API keys, OAuth tokens, cookies, passwords, private keys, session material;
- Gmail Takeout, LinkedIn exports, CRM exports, production database dumps;
- customer/prospect PII or tenant evidence;
- secrets copied from local .env files;
- credentials from AIsa, Google, Cloudflare, GitHub or model providers.

Use synthetic fixtures or redacted examples in tests.

## Agent operating rules

Before editing:
1. inspect repository state;
2. read this file and relevant ADRs/specs;
3. identify the smallest bounded change;
4. state expected writes and affected surfaces;
5. preserve backward compatibility unless an ADR/spec explicitly changes it.

Agents must not:
- deploy to production without explicit owner approval;
- rotate or create credentials autonomously;
- enable write-capabilities for external providers without a dedicated policy gate;
- bulk-import identities into CRM truth;
- execute outbound messaging autonomously;
- delete or rewrite migration evidence/history;
- bypass tests, evals, policy gates or audit logging.

## Architecture boundaries

Canonical flow:

```text
Source
-> Observation
-> Evidence
-> Identity
-> Signal
-> Judgment
-> Policy
-> CRM Truth
-> Work
-> Human / Bounded Action
-> Outcome
-> Learning
```

Keep these universes distinct:
- Source / Observation
- Evidence
- CRM Truth
- Derived Judgment
- Work State
- Execution / Outcome

## AI authority

AI may:
- research;
- extract;
- classify;
- summarize;
- rank evidence for review;
- draft;
- recommend;
- identify uncertainty.

AI may not independently:
- merge identities;
- mark opportunity Won;
- enforce Do Not Contact as final truth;
- accept pricing/provider/commercial terms;
- send outbound messages;
- mutate high-impact CRM truth;
- bypass approval or policy.

## Migration rule

PWM_CRM is a source system and reference implementation during extraction. Do not destroy or overwrite it as part of DROWK CRM development. Preserve IDs, provenance and historical meaning whenever migrated.

## Pull request expectation

Every material PR should explain:
- problem;
- scope;
- affected domain objects;
- data migrations;
- provider/tool impact;
- security impact;
- test/eval evidence;
- rollback path.
