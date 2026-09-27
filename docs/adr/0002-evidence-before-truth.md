# ADR-0002 — Preserve evidence before promoting CRM truth

Status: Accepted for foundation

## Context

External systems frequently provide incomplete, stale or conflicting data. Previous Gmail/LinkedIn analysis showed that mailbox state, sender identity, spam labels, domain matching and provider enrichment can be misleading if promoted directly into CRM truth.

## Decision

All external data enters through Observation/Evidence first.

Promotion to CRM Truth requires deterministic identity/policy rules or human review.

## Examples

- LinkedIn title -> Employment Evidence, not immediate Contact.title overwrite.
- Apollo person -> Identity Candidate, not immediate Contact creation.
- Gmail message -> Source Observation, then relevance/linkage/promotion.
- website claim -> Evidence with source URL/freshness.
- model classification -> Judgment, not truth.

## Consequences

- provenance remains queryable;
- provider replacement is easier;
- stale/conflicting evidence can coexist;
- migrations become safer;
- CRM truth changes become explainable.
