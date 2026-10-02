# GitHub Cross-Repository Reference Harvest

Status: **COMPLETE / READY FOR BROAD ACCESS REVOCATION**

Purpose: preserve the engineering knowledge needed by DROWK CRM before broad GitHub access is removed.

## Authority boundary

Only `drowknet/drowk-crm` is an implementation target.

All other repositories were inspected READ-ONLY. This harvest does not make them dependencies and does not authorize future writes to them.

## Repositories inspected

- `drowknet/drowk-platform` — substantial architectural/engineering prior art.
- `drowknet/invoice-builder` — application/session/deployment prior art; unrelated business domain.
- `drowknet/hds` — empty at harvest time.
- `drowknet/drowk-crm` — target/canonical CRM repository.

Branches were also checked for unique ahead-of-main work. The only materially relevant unmerged platform branch was `wp-osci-01-stage0-offline`; its useful findings are preserved locally.

## Harvest documents

- [Pinned source manifest](source-manifest-2026-09-27.json) — repositories, heads, source files/blob SHAs and branch audit.
- [DROWK Platform transfer](drowk-platform-transfer.md) — canonical state, identity, signals, idempotency, temporal lineage, harness, CI and provider patterns.
- [Invoice Builder transfer](invoice-builder-transfer.md) — session/workspace/deployment lessons and explicit non-transfer items.
- [Open-source pattern transfer](open-source-patterns-transfer.md) — prior-art inventory and adoption boundaries.
- [OSCI Stage 0 transfer](osci-stage0-transfer.md) — dlt/Splink/libpostal/Overture/OpenAddresses benchmark state.
- [Access Revocation Handoff](ACCESS_REVOCATION_HANDOFF.md) — what is now safe to lose broad repository access to.
- [Prospecting Open-Source Harvest — 2026-10-01](PROSPECTING_OSS_HARVEST_2026-10-01.md) — later public-repository harvest for DCRM-05D; exact upstream SHAs/licenses/dispositions and prospecting capability boundaries. This is separate from the original private/internal access-revocation harvest.

## What was harvested

Transferable engineering consequences include:

- canonical state / Domain API boundaries;
- durable idempotency;
- Evidence / Identity / deterministic Entity Resolution;
- Signal source/revision/time semantics;
- immutable/superseding decision and hypothesis lineage;
- event and provenance patterns;
- agent/harness governance;
- deterministic Sensors and human Gates;
- provider-neutral capability routing;
- provider evaluation and cost/freshness/rights semantics;
- memory/trace/agent-workcell patterns;
- PostgreSQL CI and forward-only migration discipline;
- session/workspace isolation lessons;
- HTTPS/reverse-proxy/session-cookie lessons;
- explicit negative lessons such as:
  - session isolation != authentication;
  - external provider output != canonical truth;
  - model output != verified output;
  - missing source != negative fact;
  - fuzzy match != canonical identity.

## What was not copied

No:
- customer/prospect dataset;
- private Gmail/LinkedIn/CRM export;
- credential/secret;
- production connection string;
- private provider payload;
- unrelated business-domain source code;
- repository clone.

## Source discipline

The source material remains prior art/reference.

DROWK CRM adoption decisions are explicitly separated from source-derived observations.

External provider/API/open-source behavior is time-sensitive and should be revalidated when actually used.

legacy CRM source live source remains on the owner-controlled D: workspace and is governed separately by the repository standing orders.
