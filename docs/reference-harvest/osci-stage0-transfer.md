# WP-OSCI-01 Stage 0 -> DROWK CRM Transfer

Status: SOURCE-DERIVED REFERENCE FROM UNMERGED READ-ONLY BRANCH

Source repository: `drowknet/drowk-platform`
Source branch: `wp-osci-01-stage0-offline`
Branch state at harvest: 13 commits ahead of harvested `main`, 0 behind.

This branch was not treated as canonical DROWK CRM truth. Its measured results and useful benchmark contracts are preserved here because broad repository access is expected to be removed.

## Objective of the source work

The source branch benchmarked whether selected open-source components/patterns could improve:
- external intelligence acquisition;
- open-data access;
- identity review ranking;
- enrichment routing;

without weakening provenance, rights, identity safety, reproducibility or portability.

Stage 0 was synthetic/offline only:
- no production integration;
- no live provider/public-source calls;
- no credentials;
- no paid calls;
- no business/canonical mutation.

## Challengers / lanes

### Lane A — acquisition mechanics
- DROWK thin deterministic acquisition baseline
- `dlt` challenger

### Lane B — open geospatial sources
- Overture Maps tooling/source-family compatibility
- OpenAddresses as rights-aware source registry
- no live public-source read in Stage 0

### Lane C — identity review support
- conservative deterministic DROWK identity baseline
- Splink as review-ranking challenger only
- libpostal as parsing/expansion challenger only

### Lane D — enrichment/cost routing
- deterministic DROWK-owned router

## Permanent source boundaries worth keeping

- Synthetic-only benchmark records.
- Missing dependency != failed challenger.
- Installed != adopted.
- Benchmark success != canonical authority.
- No fuzzy/probabilistic output may create MATCHED_SAFE by itself.
- Source unavailable remains UNKNOWN, not a negative fact.
- Rights and availability are gates, not score dimensions.
- Official/open evidence may precede commercial providers when eligible.
- Internal verified evidence can short-circuit unnecessary acquisition.
- Component adoption requires measured execution, not static availability.

## Deterministic router order

After rights and availability gates, the source baseline ordered eligible candidates by:

1. authority class;
2. freshness;
3. expected information gain;
4. latency;
5. cost;
6. stable source-name tie break.

Authority classes in the source benchmark:
- INTERNAL_VERIFIED
- OFFICIAL_FIRST_PARTY
- OPEN_PUBLIC
- COMMERCIAL

### DROWK CRM consequence

This is a strong starting heuristic for Progressive Intelligence, but not a universal immutable ordering.

CRM routing should eventually make the order/cutoffs policy-versioned by capability/workload and include evidence completeness and tenant budget.

## dlt 1.30.0 measured result

The source branch records an owner-notebook measurement using:
- Python 3.12.10;
- dlt 1.30.0;
- synthetic fixture only;
- telemetry disabled;
- socket connections blocked;
- temporary machine-local storage;
- zero canonical mutations.

Observed source result:
- cross-run replay suppression: PASS;
- late revision preservation: PASS;
- same-run duplicate suppression under tested primary-key + incremental configuration: FAIL;
- 39-package isolated dependency resolution;
- DROWK thin baseline satisfied the intended unique revision semantics without that extra dependency surface.

Source disposition:

**PATTERN_ONLY**

Reason recorded by the source work: dlt's incremental-state/replay patterns were useful, but the measured configuration did not satisfy DROWK same-run `(source_id, revision)` dedupe semantics without additional DROWK-owned logic, and no measured engineering savings justified adding the runtime dependency.

### DROWK CRM consequence

Do not add dlt merely because it is a mature ingestion tool.

Re-evaluate only if connector breadth, schema evolution, pipeline operations or multi-source scale create a measured advantage.

## Splink

Source role:
- probabilistic/fuzzy candidate ranking for human review only.

Source result:
- no sufficient measured Stage 0 execution result was recorded in the harvested branch material.

### DROWK CRM consequence

Status: **UNASSESSED / CHALLENGER ONLY**.

Splink must never be described as adopted or rejected based on this source snapshot.

If evaluated later:
- benchmark review-ranking quality;
- forbid automatic safe-match authority;
- compare against deterministic identity candidate baselines.

## libpostal

Source role:
- address parsing/expansion challenger only.

Source result:
- no sufficient measured Stage 0 execution result was recorded in the harvested branch material.

### DROWK CRM consequence

Status: **UNASSESSED / CHALLENGER ONLY**.

Potentially relevant for facility/address normalization, but parsing/expansion != canonical identity proof.

## Overture Maps / OpenAddresses

Source role:
- open geospatial/source evidence subject to rights/provenance rules.

Source result:
- Stage 0 did not authorize live public-source reads.

### DROWK CRM consequence

Status: **DOCUMENTED/REFERENCE CANDIDATES, NOT LIVE VALIDATED BY THIS BENCHMARK**.

Potential future use:
- facility/address evidence;
- territory intelligence;
- external crosswalk support.

Do not infer current API/data fitness, coverage or rights from this old offline stage. Revalidate current datasets/licensing before use.

## Acquisition baseline semantics worth preserving

The source thin baseline tested:
- cursor continuity;
- source-native ID + revision dedupe;
- duplicate replay suppression;
- late revision preservation;
- bounded transient retries;
- malformed-record quarantine;
- source references;
- observation time;
- deterministic content digest.

Cursor discontinuity failed closed.

### DROWK CRM consequence

These semantics are directly relevant to:
- Gmail History ingestion;
- AIsa/provider pagination;
- import jobs;
- public-data acquisition.

The exact source implementation should not be copied automatically; the contract is the valuable part.

## Decision vocabulary

Source decision gate allowed:
- ADOPT
- ADAPT
- PATTERN_ONLY
- DEFER
- REJECT

A challenger not actually executed could not receive an evidence-backed disposition.

### DROWK CRM consequence

Use this vocabulary where useful in DCRM-05 AIsa/Open-Source Capability Lab, alongside provider-specific capability states.

## Source artifacts pinned

- `docs/exec-plans/wp-osci-01-stage0-offline.md`
- `docs/harness/wp-osci-01-stage0.md`
- `scripts/wp_osci_stage0.py`
- `scripts/wp_osci_stage0_dlt.py`
- `tests/test_wp_osci_stage0.py`
- `tests/test_wp_osci_stage0_dlt.py`

Their exact blob SHAs are recorded in the harvest source manifest.

## Non-transfer rule

This document preserves results and contracts, not third-party code or runtime dependencies.

Every candidate must be freshly revalidated for:
- current version;
- current license;
- security;
- maintenance;
- compatibility;
- measured CRM workload value
before adoption.
