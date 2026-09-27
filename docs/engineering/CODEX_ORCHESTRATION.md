# Codex Orchestration

Status: ACTIVE ENGINEERING GUIDE

The root `AGENTS.md` contains only rules that apply everywhere. Detailed guidance
belongs near the code or in task/work-package documents.

## Default workcell

For a material change, the coordinating Codex agent should keep one writer for each
file surface and use subagents primarily as independent critics/researchers.

Useful subagent roles:
- domain reviewer — invariants, naming, compatibility;
- database reviewer — migrations, temporal history, idempotency;
- tenant/security reviewer — cross-tenant isolation, capability boundaries, secrets;
- failure-mode reviewer — retries, uncertain external effects, recovery;
- test/eval reviewer — missing golden/regression cases;
- provider reviewer — API semantics, rights, cost, freshness.

Do not spawn agents merely to create activity. Short dependent steps stay with the
main agent.

## Context discipline

1. Read root `AGENTS.md`.
2. Read the nearest scoped `AGENTS.md` for the surface being changed.
3. Read only the ADR/spec/work-package relevant to the task.
4. Give subagents a narrow question and expected output.
5. Prefer review findings over parallel edits.
6. Never let two agents edit the same files concurrently.

## Writer rule

One task / one branch / one active writer per file surface.

Subagents that discover required changes should report:
- exact file/path;
- issue;
- evidence;
- proposed correction;
- severity.

The coordinating writer applies the patch after reconciling conflicting findings.

## Completion

A task is complete only when the relevant deterministic checks pass and unresolved
review findings are dispositioned. Another model's approval is not authorization.
