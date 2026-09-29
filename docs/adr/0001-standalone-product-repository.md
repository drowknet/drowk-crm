# ADR-0001 — DROWK CRM is a standalone product repository

Status: Accepted for foundation

## Context

DROWK CRM must evolve independently from other DROWK experiments and projects while remaining interoperable with them.

## Decision

Use `drowknet/drowk-crm` as the canonical engineering repository for the CRM product.

The repository owns:
- CRM domain contracts;
- product application code;
- CRM-specific services/connectors;
- CRM migrations;
- CRM evals;
- CRM infrastructure definitions;
- product security and architecture documentation.

It does not own unrelated DROWK projects.

## Consequences

Positive:
- independent lifecycle and releases;
- reduced project coupling;
- clearer security boundary;
- clearer Codex/agent scope;
- easier Cloudflare deployment mapping.

Trade-off:
- shared DROWK components may later need explicit packages/interfaces instead of implicit monorepo reuse.
