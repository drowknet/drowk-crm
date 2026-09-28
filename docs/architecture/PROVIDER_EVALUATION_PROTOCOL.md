# DROWK CRM Provider Evaluation Protocol

Status: FOUNDATION DESIGN

Purpose: evaluate AIsa capabilities and direct providers without letting provider schemas or marketing claims become CRM truth.

## Provider roles are workload-specific

Never produce one universal provider score.

Evaluate by capability cell, for example:
- discovery;
- person enrichment;
- company enrichment;
- facility/location discovery;
- external identity crosswalk;
- employment verification evidence;
- procurement-route research;
- change/news signals;
- reputation/review signals;
- web search;
- web extraction;
- route/operational evidence;
- model inference;
- reranking/embeddings;
- sandbox email.

A provider can be strong in one cell and UNKNOWN in another.

## Capability state

Use at least:
- DOCUMENTED_CAPABILITY
- LIVE_VALIDATED_CAPABILITY
- UNSUPPORTED
- UNASSESSED
- TEMPORARILY_UNAVAILABLE
- RIGHTS_BLOCKED

Do not convert a documentation claim into LIVE_VALIDATED.

## Request record

A benchmark request should preserve:
- provider;
- operation/endpoint;
- provider/tool version if exposed;
- interface (AIsa REST/MCP/direct/etc.);
- workload;
- exact normalized inputs;
- locale/geography;
- request fingerprint;
- parser/adapter version;
- tenant/run scope;
- rights/policy reference;
- approved max cost;
- estimated cost.

Never include secrets in fingerprints.

## Observation record

Preserve:
- source-native request/task ID;
- status;
- safe error category;
- source-native entity IDs;
- retrieved_at;
- observed_at if source supports it;
- latency;
- actual cost when known;
- actual-cost-known boolean;
- freshness;
- provenance;
- response/content fingerprint;
- rights/retention classification.

Unknown actual cost != zero.

## Result semantics

Distinguish:
- PRESENT
- EMPTY_WITHIN_RESPONSE
- UNKNOWN
- ERROR
- PENDING
- PARTIAL

An empty bounded response is not proof of universal absence.

## Evaluation gates

Before comparative preference for a capability cell, evaluate:

1. Rights
2. Identity quality
3. Coverage/completeness
4. Freshness
5. Reliability
6. Exportability
7. Economics/TCO
8. Security
9. Latency
10. Replacement cost
11. Evidence/provenance quality

Missing evidence remains UNKNOWN and blocks unsupported conclusions.

## Progressive intelligence

Research should stop when evidence completeness is sufficient.

```text
cheap deterministic filter
-> low-cost provider evidence
-> evidence completeness check
-> deeper provider / multi-source triangulation only if needed
-> human-reviewed commercial action
```

Each ResearchRun should define:
- objective;
- evidence gaps;
- allowed capabilities;
- max cost;
- max tool calls;
- max elapsed time;
- stop conditions;
- output evidence IDs.

## AIsa-specific consequence

AIsa is a major capability fabric, not canonical truth.

The DROWK CRM adapter should preserve:
- capability requested;
- selected AIsa tool/provider;
- operation metadata;
- price/ceiling;
- read/write classification;
- exact evidence provenance;
- call/result fingerprint.

Write-capabilities must be separately authorized from read-capabilities.

## Promotion

Provider output enters Observation/Evidence first.

It may become:
- IdentityCandidate;
- Signal;
- Research finding;
- candidate relationship;
- evidence gap closure.

It never silently becomes Account/Contact/Facility truth.


## Post-DCRM-04F executable consequence — 2026-09-28

The core CRM relationship-memory foundation is now executable through Relationship.

DCRM-05 begins with a synthetic provider-neutral harness rather than live credentials.
DCRM-05A must make ResearchRun/ProviderRun persistence, fingerprints, result states,
cost-known semantics and bounded stopping behavior executable.

Synthetic fixtures validate the DROWK lab, not the external provider. They must never
be labeled `LIVE_VALIDATED_CAPABILITY`.

Selected-provider live validation remains a later explicit DCRM-05 gate after rights,
credentials, security and cost boundaries are approved.
