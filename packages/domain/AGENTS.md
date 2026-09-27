# Domain scope

This directory owns business invariants and deterministic domain behavior.

Rules:
- domain code must be infrastructure/provider neutral;
- model confidence never grants authority;
- identity ambiguity must not auto-merge;
- fail closed on risky action, not on evidence collection;
- preserve point-in-time knowledge semantics;
- keep Signal, Pursuit, Opportunity, Work and Outcome distinct;
- prefer pure functions with deterministic tests.
