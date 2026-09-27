# GitHub Cross-Repository Reference Harvest

Status: REFERENCE SNAPSHOT / DROWK CRM-LOCAL CONTEXT

Purpose: preserve the engineering knowledge needed by DROWK CRM before broad GitHub access is removed.

## Authority boundary

Only `drowknet/drowk-crm` is an implementation target.

The repositories listed here were inspected READ-ONLY. This harvest does not make them implementation dependencies and does not authorize future writes to them.

## Repositories inspected

- `drowknet/drowk-platform` — substantial architectural/engineering prior art.
- `drowknet/invoice-builder` — useful application/session/deployment patterns; unrelated business domain.
- `drowknet/hds` — empty at harvest time; no implementation knowledge available.
- `drowknet/drowk-crm` — target repository.

## What was harvested

Only transferable engineering consequences were retained:

- canonical state / Domain API boundaries;
- Evidence / Identity / Signal semantics;
- event and provenance patterns;
- agent/harness governance;
- deterministic Sensors and human Gates;
- provider-neutral capability routing;
- provider evaluation and cost/freshness/rights semantics;
- memory/trace/agent-workcell patterns;
- PostgreSQL CI and migration discipline;
- session/workspace isolation lessons;
- HTTPS/reverse-proxy/session-cookie lessons;
- explicit negative lessons: session isolation is not authentication; external provider output is not canonical truth.

No customer/prospect dataset, private export, credential, provider secret or production connection information was copied.

## Source discipline

Every detailed transfer document names the source repository, commit/file path and relevant blob SHA or commit SHA where available.

The source material remains prior art/reference. DROWK CRM adoption decisions are explicitly separated from source-derived observations.
