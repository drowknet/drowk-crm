# ADR-0003 — Proof-carrying engineering and bounded agent work

Status: Accepted for foundation

## Context

DROWK CRM will be developed with coding agents and later contain research/AI agents. Model self-assessment is insufficient evidence that a change or business task is correct.

## Decision

Adopt the invariant:

`MODEL OUTPUT != VERIFIED OUTPUT`

Material engineering work must pair candidate output with appropriate verification evidence. Controls should prefer deterministic Sensors first and explicit human Gates where automation cannot prove the property.

High-value agent work should separate worker and reviewer roles where useful, but reviewer consensus never substitutes for policy or human authority.

Agent-created memory, prompts, skills and procedures are Derived/Working until explicitly promoted.

## Consequences

DROWK CRM will develop a repository-local harness after the concrete runtime stack is selected.

The harness should support bounded self-correction and fail closed on:
- wrong repository;
- secrets;
- unexpected dirty state;
- protected migration changes;
- identity ambiguity;
- architecture expansion;
- production exposure;
- destructive/out-of-scope actions.
