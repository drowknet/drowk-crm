# Codex Orchestration

Status: ACTIVE ENGINEERING GUIDE

The root `AGENTS.md` contains only rules that apply everywhere. Detailed guidance
belongs near the code or in task/work-package documents.

## Operational bootstrap boundary

Owner-local Git bootstrap happens before Codex writing. The bootstrap stage proves the expected
repo root, branch, HEAD and worktree policy; Codex must not make Git topology/state changes merely
to reach the requested starting point. On mismatch, STOP and report.

Absent a separate explicit owner gate, the writer must not fetch, pull, switch/checkout branches,
create/delete branches, reset, rebase, merge, stash, clean, run gc/repack/maintenance or repair a
commit graph. One operational stage must finish and have its evidence reviewed before dependent
commands for the next stage are issued.

A native stderr warning or wrapper exception is not sufficient evidence that a Git mutation failed.
Revalidate the actual result and remote authority before retrying a mutation.

Passing a sensor proves only its defined observation. It does not authorize merge, provider access,
deployment or a later gate. See [State & Authority Semantics](STATE_AND_AUTHORITY_SEMANTICS.md).

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
