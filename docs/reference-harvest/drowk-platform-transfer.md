# DROWK Platform -> DROWK CRM Transfer Notes

Status: SOURCE-DERIVED REFERENCE + EXPLICIT CRM ADOPTION NOTES

Source repository: `drowknet/drowk-platform`
Observed main head: `9e3ac79ad80598e6df1e5d56ef0e5a2937d4b1ea`

This document preserves transferable knowledge so DROWK CRM does not require future access to the source repository.

## 1. Canonical-state boundary

### Source-derived

The platform adopted:
- PostgreSQL as canonical business datastore;
- a stable Domain API as the machine/business interface;
- external CRMs, AI tools, automation platforms and data vendors as replaceable adapters;
- DROWK ownership of identity, attribution, evidence and reusable intelligence.

Source: `docs/adr/0001-canonical-postgres-domain-api.md`.

### DROWK CRM adoption

Keep this principle. The CRM may choose its own concrete API/runtime implementation, but canonical business state must not live in Gmail, Sheets, AIsa, Apollo, a model provider or a UI cache.

## 2. Deterministic versus AI authority

### Source-derived

Deterministic workflows own deterministic state changes. AI is used for research, classification, extraction, summarization, drafting and recommendation. High-impact writes are policy-driven and approval-gated.

Source: `docs/adr/0002-deterministic-vs-ai-execution.md`.

### DROWK CRM adoption

This matches the PWM lessons and remains a core invariant.

## 3. Runtime neutrality

### Source-derived

Business schemas, policies, evals, permissions and API contracts remain framework-neutral. Agent runtimes are replaceable.

Source: `docs/adr/0003-agent-runtime-neutrality.md`.

### DROWK CRM adoption

Do not make PydanticAI, LangGraph, Codex, Gemini, MCP, AIsa or any orchestration framework part of the canonical business schema.

## 4. Identity evidence boundary

### Source-derived

Key distinctions:
- Claim != Verified Evidence != Canonical Identity.
- Account != Facility.
- company name / ZIP / city / work-email domain alone do not establish identity.
- database uniqueness is not verification.
- only current, strong, verified evidence may authorize deterministic linking.
- fuzzy/LLM methods may propose candidates, never silently establish identity.
- evidence corrections append/supersede history rather than erase rationale.

Source: `docs/adr/0006-identity-claims-trusted-evidence-boundary.md`.

### DROWK CRM adoption

Directly applicable to:
- Gmail participant linkage;
- Apollo people/company enrichment;
- LinkedIn employment evidence;
- facility/location discovery;
- tenant data imports;
- provider-native identity crosswalks.

## 5. Event envelope

### Source-derived

The shared event envelope includes:
- event_id;
- event_type;
- event_version;
- occurred_at;
- actor;
- correlation_id;
- causation_id;
- entity;
- payload;
- provenance.

Source: `packages/events/event-envelope.schema.json`.

### DROWK CRM adoption

Use this as a design input, not a copied final schema. CRM events additionally need explicit tenant/run/policy lineage where required.

## 6. Original canonical schema lessons

### Source-derived

The platform's first PostgreSQL migration included:
- accounts;
- facilities;
- contacts;
- services;
- providers/provider_capabilities;
- signals;
- opportunities;
- assessments;
- assets;
- evidence;
- activities;
- event_log;
- eval_cases/eval_trials;
- agent_runs;
- tool_permission_policies.

It also enabled pgcrypto and vector.

Source: `packages/database/migrations/0001_canonical_core.sql`.

### DROWK CRM adoption

The object families are valuable prior art, but the CRM must not copy this migration as its final schema. It needs additional concepts from PWM:
- Tenant/User;
- Identity/IdentityCandidate;
- Conversation/ActivityParticipant;
- Pursuit;
- WorkItem;
- Task;
- Cadence/Enrollment;
- SourceObservation;
- ProviderRun/ResearchRun;
- Judgment/PolicyDecision/Approval;
- Outcome;
- source watermark/freshness.

pgvector must remain optional until a measured retrieval requirement exists.

## 7. Source/evidence router pattern

### Source-derived

The PWM reality-baseline contract in the platform preserved source-native IDs, source hashes/version, timestamps and exact source semantics while explicitly separating source fact from canonical DROWK truth.

Notable invariants:
- source-native ID != canonical ID;
- source label != canonical identity;
- source status != authority;
- historical evidence != current truth;
- missing field != negative fact;
- UNKNOWN != NO.

Source: `docs/architecture/pwm-reality-baseline-data-contract-v0.1.md`.

### DROWK CRM adoption

This pattern directly informs Gmail/PWM migration and all external provider adapters.

## 8. External-data governance

### Source-derived

Provider selection uses BUY / INTEGRATE / ADAPT / BUILD / DEFER / REJECT against:
- quality;
- safety;
- capability;
- reliability;
- speed;
- economics/TCO;
- interoperability;
- maintainability;
- rights;
- resilience;
- learning.

Provider possession/access does not automatically grant:
- persistence;
- redistribution;
- embeddings;
- model training;
- indefinite retention.

Source: `docs/architecture/external-data-governance.md`.

### DROWK CRM adoption

Add these dimensions to the Capability Registry and AIsa evaluation lab.

## 9. Provider role separation

### Source-derived

The platform explicitly rejected a universal provider score. Provider roles were separated into:
- discovery;
- external identity/crosswalk;
- enrichment;
- change/reputation;
- competitive supply;
- route/operational feasibility.

It distinguished DOCUMENTED_CAPABILITY from LIVE_VALIDATED_CAPABILITY.

Source: `docs/architecture/external-facility-intelligence-fabric.md`.

### DROWK CRM adoption

Apply the same separation to AIsa tools/providers. A provider may be excellent for one capability and unknown for another.

## 10. Benchmark semantics

### Source-derived

The Market Authority benchmark preserved:
- provider/endpoint/version;
- workload/surface;
- exact query and locale;
- requested location;
- provider-native task IDs;
- result status;
- observed vs retrieved time;
- latency;
- estimated vs actual cost;
- parser/provider versions;
- provenance and rights references.

It explicitly separated:
- PRESENT with unknown rank;
- EMPTY_WITHIN_RESPONSE;
- UNKNOWN;
- errors/pending.

Unknown actual cost was not treated as zero.

Source: `docs/harness/market-authority-benchmark.md`.

### DROWK CRM adoption

Use these semantics when benchmarking AIsa/Apollo/LinkedIn/DataForSEO/Similarweb/Exa/Tavily/Firecrawl.

## 11. Agent Harness pattern

### Source-derived

The platform used:
- standing-order AGENTS;
- scoped plans;
- deterministic Guides and Sensors;
- preflight/fast/full/ci modes;
- bounded self-correction;
- human semantic/boundary gates;
- no sensor weakening to get green;
- hard stop on wrong repo, secrets, unexpected dirty state or architecture expansion.

Source: `AGENTS.md`, `docs/harness/README.md`, `docs/harness/controls.json`.

### DROWK CRM adoption

Adopt the pattern, not necessarily the exact scripts. DROWK CRM should develop its own harness once runtime/framework choices are made.

## 12. Cross-runtime governance

### Source-derived

Important distinctions:
- Actor != Agent != Session != Tenant.
- agent-learned memory/skills/config stay Working/Derived until explicit promotion;
- a sandboxed tool does not prove whole-process isolation;
- host capability escalation is default-denied;
- delegated work inherits only an explicit subset of capabilities;
- another model's approval is not canonical truth.

Source: platform `AGENTS.md` and `docs/harness/README.md`.

### DROWK CRM adoption

These should become durable security/agent rules.

## 13. Memory and retrieval

### Source-derived

Memory model:
- Canonical Memory;
- Working Memory;
- Derived/Compressed Memory;
- Retrieval Context;
- Model Internal Memory.

Preferred flow:
`memory events -> derived summaries -> exact/FTS/vector retrieval -> bounded context -> reviewed promotion`.

Source: `docs/architecture/foundation-v0.1.md` and external pattern harvest.

### DROWK CRM adoption

Use PostgreSQL metadata/FTS first. Vector retrieval is an optional enhancement, not a separate source of truth.

## 14. Proof-carrying work

### Source-derived

Preferred result semantics:
`MODEL OUTPUT != VERIFIED OUTPUT`.

Long/high-value work:
`goal -> worker -> deterministic sensors -> independent critic -> bounded repair -> human question gate -> owner/promotion gate`.

Verification evidence can include schemas, static analysis, tests, contract checks, integration checks, migration hashes and explicit human review.

Source: `docs/architecture/external-pattern-harvest-agent-memory-growth.md`.

### DROWK CRM adoption

Strong fit for Codex/subagents and later autonomous research.

## 15. Durable agent-event pattern

### Source-derived

Long-running/external work should separate transport admission from verified execution:

`source event -> verified admission -> actor/workstream mailbox -> bounded run -> tool/action evidence -> durable receipt -> business outcome`.

Invariant:
`EVENT DELIVERED != ACTION VERIFIED`.

Source: external pattern harvest.

### DROWK CRM adoption

Useful for Gmail events, research jobs, approval-paused cadences and future outbound executors.

## 16. Trace model

### Source-derived

A material trace may preserve:
- actor/agent/session/tenant lineage;
- model/provider;
- prompt/skill/tool versions;
- linked business/evidence objects;
- tool-call metadata;
- input/output hashes or artifact refs;
- latency/token/cost;
- verifier results;
- approvals/reviews;
- final disposition.

Raw plaintext logging of every payload was explicitly rejected as a default because of secrets/PII.

### DROWK CRM adoption

Direct input to ProviderRun, AgentRun and Audit design.

## 17. Progressive provider-neutral capability routing

### Source-derived

Preferred shape:

`capability -> ordered eligible providers -> health/probe evidence -> bounded fallback -> result/provenance`.

OAuth/token-refresh and generic integration plumbing were treated as commodity candidates.

### DROWK CRM adoption

This is the architecture for AIsa and any future direct-provider adapter.

## 18. CI / dependency / migration discipline

### Source-derived

The platform demonstrated:
- Python 3.12;
- FastAPI/Pydantic/psycopg;
- locked dependencies with hashes;
- Ruff/Pyright static gates;
- offline unit/contract gates;
- disposable PostgreSQL 17 + pgvector CI;
- forward-only applied migration history;
- explicit development/live integration separated from ordinary CI.

### DROWK CRM adoption

Patterns are valuable. Concrete stack remains undecided until DCRM-00 architecture selection.
