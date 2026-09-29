# Open-Source and External Pattern Inventory

Status: REFERENCE / PRIOR ART / NOT DEPENDENCY APPROVAL

Purpose: preserve the useful project/tool families identified by earlier DROWK research before cross-repository access is narrowed.

Source basis: `drowknet/drowk-platform/docs/architecture/external-pattern-harvest-agent-memory-growth.md` at the harvested source snapshot.

Naming a project here does not approve installation, code reuse, license compatibility or production adoption.

## Transferable pattern families

### Agent Skills specification / reference implementations
Useful pattern:
- portable scoped skill package;
- `SKILL.md` plus optional scripts/references/assets;
- progressive disclosure;
- explicit metadata.

CRM consequence:
Future DROWK CRM procedural skills should prefer portable, auditable packaging when useful. Third-party skills still require provenance/license/security intake.

### Nango-class integration/auth gateways
Useful pattern:
- treat OAuth/token refresh and provider authentication plumbing as commodity infrastructure when economically justified.

CRM consequence:
Evaluate rather than automatically building every provider credential lifecycle. Any gateway must remain replaceable and must not own CRM truth.

### Firecrawl-class web acquisition
Useful pattern:
- search/crawl/extract behind a provider-neutral evidence adapter.

CRM consequence:
Strong challenger for account/procurement research, but outputs must retain source/provenance/freshness and enter Evidence first.

### n8n
Useful pattern:
- deterministic edge/internal orchestration.

CRM consequence:
May be useful for low-risk deterministic integration, but must not own canonical state, durable side-effect truth, pricing/commercial authority or policy.

### Stirling-PDF-class document operations
Useful pattern:
- commodity PDF transformation/OCR/redaction/conversion infrastructure.

CRM consequence:
Evaluate only when document operations become a recurring CRM workflow. Do not build custom PDF infrastructure prematurely.

### Whisper-class speech-to-text
Useful pattern:
- replaceable transcription capability.

CRM consequence:
Potential future use for calls/field/media evidence. Transcripts remain derived artifacts, not automatically verified truth.

### codebase-memory-mcp-style structural code memory
Useful pattern:
- structural code graph/index may improve repository navigation.

CRM consequence:
Benchmark against normal repository navigation before adoption. Measure correctness, files read, tool calls, tokens, indexing/refresh cost and false/missed dependencies.

### Orca-style worktree/operator coordination
Useful pattern:
- isolated worktree/operator coordination.

CRM consequence:
Only consider after the DROWK CRM multi-machine/Codex operating model is stable. One task/branch should still have one active writer.

### agency-agents / agent-role catalogs
Useful pattern:
- role specialization as prompt/deliverable prior art.

CRM consequence:
Do not create extra agents unless roles have distinct inputs, authority and eval criteria.

### Agent-Reach-style capability probing/fallback
Useful pattern:
- probe tool/channel capability and use bounded fallback.

CRM consequence:
Useful for research routing. Cookie/browser/scraping channels remain higher-risk lab paths subject to rights/reliability/security gates.

### Cloudflare Agentic Inbox / durable agent-event patterns
Useful pattern:
- separate event admission, actor/workstream serialization, execution, durable receipt and outcome.

CRM consequence:
Relevant to Gmail events, long-running research, human-paused approvals and future action executors.

### LibreChat / TradingAgents / multi-agent prior art
Useful pattern:
- role separation, deliberation and orchestration patterns.

CRM consequence:
Multi-agent consensus is not proof. Use opposed/independent roles only when they expose different evidence or risk perspectives.

### Immich-class raw/derived media lineage
Useful pattern:
- original asset identity separate from thumbnails, transcripts, annotations and model-derived artifacts.

CRM consequence:
Apply if CRM later ingests photos/audio/video/documents as evidence.

### AppFlowy / LocalSend / utility references
Useful pattern:
- ownership, portability and local-first/product ergonomics.

CRM consequence:
Pattern inspiration only; no new system of record follows.

### VictorTaelin / memory-computation research and other experimental runtimes
Useful pattern:
- research ideas around computation/memory efficiency.

CRM consequence:
Watch list only until a measured DROWK bottleneck exists.

## DROWK-owned differentiation to preserve

Earlier research concluded the highest-value owned layer is:
- memory semantics and promotion policy;
- evidence/provenance;
- worker/reviewer/verifier contracts;
- verification/eval corpus;
- trace and business lineage;
- vertical qualification/readiness/buyer-route logic;
- outcome learning and attribution.

## Replaceable commodity candidates

Potentially replaceable:
- frontier/model inference;
- generic GPU compute;
- OAuth/integration plumbing;
- web crawl/search/extraction;
- document conversion/OCR/redaction;
- speech-to-text;
- generic telemetry transport/dashboards;
- delivery surfaces with adequate API/export/data-rights posture.

## Intake rule

Before direct third-party code/runtime adoption:
1. verify exact repository/artifact/version;
2. verify license and nested dependencies;
3. inspect secrets/notebook outputs/installers;
4. review supply-chain/security posture;
5. run sandboxed tests;
6. add product-specific evals;
7. obtain explicit promotion/adoption decision.

Patterns can be learned from without copying code.

## Measured / scoped challengers from WP-OSCI-01 Stage 0

The unmerged source branch `wp-osci-01-stage0-offline` contained a synthetic offline benchmark specifically relevant to CRM intelligence infrastructure.

### dlt
Measured source disposition: **PATTERN_ONLY** for the tested acquisition workload.

Useful patterns:
- cross-run incremental state;
- replay suppression across runs.

Measured gap in the tested configuration:
- same-run duplicate `(source_id, revision)` suppression did not match the DROWK thin baseline.

Do not adopt without a new CRM-specific measured advantage.

### Splink
Role considered: probabilistic/fuzzy identity candidate ranking for review.

Harvested state: **UNASSESSED as a measured challenger**.

It must never grant automatic canonical identity.

### libpostal
Role considered: address parsing/expansion.

Harvested state: **UNASSESSED as a measured challenger**.

Parsing/normalization does not establish Facility identity.

### Overture Maps / OpenAddresses
Role considered: open geospatial/address evidence.

Harvested Stage 0 state: rights/provenance/source-family evaluation only; no live public-source validation.

Revalidate current licenses, coverage and access before any future use.

See [OSCI Stage 0 transfer](osci-stage0-transfer.md) for the complete preserved result.

