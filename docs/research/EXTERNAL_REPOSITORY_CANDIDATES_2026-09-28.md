# External Repository Candidates — 2026-09-28

Status: RESEARCH DECISION NOTE — NOT IMPLEMENTATION AUTHORITY  
Source: owner-provided evaluation of 11 public GitHub repositories, reviewed against the DROWK CRM product and architecture canon on 2026-09-28.

## Decision

Do not install or adopt these repositories as a bundle.

Treat them as candidate implementations, engineering references or future design inputs only when a named DROWK capability or measured development problem justifies them.

The DROWK-owned competitive core remains:
- persistent commercial/relationship memory;
- explainable identity and evidence;
- temporal Employment / relationship continuity;
- Commitment distinct from Task/Work;
- procurement context;
- bounded contextual research;
- deterministic authority and next-action semantics.

Third-party repositories must not redefine canonical DROWK objects, policy authority, autonomy or product truth.

## Active work-package boundary

This research does **not** change or broaden DCRM-04A.

While DCRM-04A is active:
- do not add these repositories to the Work Engine implementation;
- do not add new provider/runtime dependencies because of this research;
- do not replace deterministic Work semantics with agent frameworks;
- do not open Gmail/live-provider/outbound/deployment authority;
- keep PWM_CRM as the read-only regression/source oracle already defined by the active WP.

Re-evaluate relevant candidates only after DCRM-04A parity is reviewed and green.

## Candidate disposition

| Repository | DROWK disposition | Earliest relevant horizon | Primary reason |
|---|---|---|---|
| kepano/defuddle | STRONG CANDIDATE FOR PILOT | DCRM-05 Capability Lab | Challenger implementation for `EXTRACT_WEB_PAGE` / web evidence extraction |
| composiohq/composio | CONDITIONAL CANDIDATE | DCRM-05+ on a concrete integration gap | Potential reduction in integration work behind DROWK capability/provider boundaries |
| browser-use/browser-use | CONDITIONAL / EXCEPTION CAPABILITY | DCRM-07 when a real portal requires it | Read-oriented navigation of authorized procurement/vendor portals without suitable APIs |
| DeusData/codebase-memory-mcp | DEVELOPMENT TOOL CANDIDATE | When code navigation becomes measurably difficult | Code indexing/impact navigation; not CRM relationship memory |
| addyosmani/agent-skills | SELECTIVE REFERENCE | Engineering process only | Adopt only non-overlapping practices that improve context, review, security or UI quality |
| multica-ai/andrej-karpathy-skills | PRINCIPLES REFERENCE | Engineering process only | Small changes, explicit hypotheses and verification; no runtime dependency needed |
| obra/superpowers | ALTERNATIVE PROCESS REFERENCE | Only if current process shows a gap | Useful verification/debugging practices, but broad overlap with existing DROWK orchestration |
| coreyhaines31/marketingskills | FUTURE CONTENT/WORKFLOW REFERENCE | DCRM-09 / DCRM-10 | Research/draft patterns for AIsa/Anderson, without importing generic CRM scoring ontology |
| voltagent/awesome-design-md | DESIGN REFERENCE | Future product UI/design-language work | Reference material for DROWK-specific visual language, not a product dependency |
| Panniantong/agent-reach | DEFER / SANDBOX REFERENCE ONLY | Revisit only for a named missing channel | Heterogeneous third-party access/session dependencies require extra rights/security scrutiny |
| juliusbrussee/caveman | DEFER | Only if measured context-cost problem emerges | Compression value is unproven for DROWK; semantic-loss and licensing considerations remain |

## Evaluation rules

Any future pilot must start from a named DROWK problem or capability, not from repository popularity.

Evaluate candidates against:
- correctness / evidence preservation;
- provenance and source visibility;
- uncertainty preservation;
- rights and data-retention behavior;
- tenant/security boundary;
- READ vs WRITE separation;
- cost and latency;
- dependency/maintenance burden;
- failure and retry semantics;
- compatibility with provider-neutral DROWK contracts;
- operator outcome improved.

A successful third-party tool remains an adapter/capability implementation unless an explicit architecture decision promotes a reusable pattern.

## Candidate-specific notes

### Defuddle

Promising as a deterministic page-extraction challenger.

A pilot should measure not only token/text reduction but loss of commercially important content such as:
- contact details;
- addresses/facility information;
- procurement/vendor links;
- tables;
- structured metadata.

Extraction output remains source-derived evidence input, not verified CRM truth.

### Composio

If evaluated, keep the shape:

`DROWK Capability -> Provider Adapter -> Composio -> External App`

Provider authentication does not confer DROWK business authority. Expose only the minimum required tools/account scope and preserve ProviderRun, cost, tenancy and READ/WRITE semantics.

Do not replace an existing connector merely because a Composio integration exists; compare a concrete workload first.

### Browser Use

Treat browser automation as an exception mechanism for a portal that lacks an adequate integration.

Initial pilots should be read/observe only. Reading procurement requirements and submitting a vendor registration are separate capabilities and separate authority classes.

### Development-agent repositories

DROWK already has:
- repo-owned AGENTS guidance;
- scoped work packages;
- one-writer discipline;
- deterministic sensors;
- GitHub CI;
- owner gates;
- exact-head review.

Do not install multiple overlapping agent-process frameworks. Adapt only isolated practices that demonstrably improve the existing process.

### Marketing and design references

Marketing skills may inform future research and draft preparation, but must not introduce:
- invented pain/urgency;
- generic MQL/SQL/BANT ontology as product truth;
- opaque relationship scores;
- automatic send authority.

Design references may inform a future DROWK design-language document, but visual imitation must not replace domain-specific UX for Evidence, Unknown, Review, conflicts, Work and relationship state.

## Relationship Intelligence boundary

None of these repositories provides DROWK's target Relationship Intelligence model.

They may help capture, extract, navigate, integrate, draft or design around evidence. DROWK remains responsible for:
- Person / Identity / Employment continuity;
- attributable Relationship state;
- Buyer Role scope and uncertainty;
- Commitment memory;
- meaningful interaction vs raw activity;
- observation coverage;
- procurement path;
- introduction permission/lifecycle;
- deterministic Work and policy authority.

## Revisit points

- **After DCRM-04A review:** confirm no external candidate is needed for parity closure.
- **DCRM-05:** evaluate Defuddle and any concrete integration challenger using the provider/capability evaluation protocol.
- **DCRM-07:** consider Browser Use only for a real procurement/vendor portal.
- **DCRM-09/10:** selectively reuse marketing/draft/evaluation practices.
- **UI implementation phase:** create a DROWK-owned design language using external references only as inputs.

## Source-preservation note

The 2026-09-28 evaluation was research, not a benchmark, installation, full security audit or production approval. Licenses, pricing, APIs, security posture and repository behavior are time-sensitive and must be revalidated against the exact version before adoption.
