# ADR-0004 — Provider-neutral external intelligence

Status: Accepted for foundation

## Context

DROWK CRM expects to use AIsa and multiple underlying/direct data and model providers. Different providers excel at different workloads, and provider outputs can be stale, incomplete, conflicting or rights-constrained.

## Decision

DROWK CRM asks for typed capabilities rather than making provider schemas part of the business domain.

External outputs enter Observation/Evidence first.

Provider evaluation is workload-specific and records provenance, freshness, cost, rights/security state and validation status.

Distinguish documented capability from live-validated capability.

READ and WRITE capabilities are separately authorized.

## Consequences

- AIsa is a major replaceable capability fabric, not a system of record.
- no universal provider score is authoritative;
- provider-native IDs remain namespaced evidence;
- unknown actual cost is never silently zero;
- bounded empty responses do not prove universal absence;
- external enrichment cannot silently mutate canonical Account/Contact/Facility truth.
