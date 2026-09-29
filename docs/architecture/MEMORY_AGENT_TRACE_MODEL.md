# Memory, Agent and Trace Model

Status: FOUNDATION DESIGN

## Memory classes

### Canonical Memory
Durable business truth and durable evidence owned by DROWK CRM.

### Working Memory
Bounded context for one run/task.

### Derived / Compressed Memory
Summaries/checkpoints derived from attributable inputs. Rebuildable and not automatically true.

### Retrieval Context
Selected source/evidence/derived context supplied for a specific task.

### Model Internal State
Transient provider/model state. Never authoritative.

## Preferred retrieval flow

```text
durable attributable history
-> exact metadata/FTS retrieval
-> optional semantic/vector/rerank layer when justified
-> bounded context budget
-> model/tool work
-> reviewed promotion
```

Vector retrieval must not create a second system of record.

## Learned artifacts

Agent-created:
- memory;
- skills;
- procedures;
- prompts;
- summaries;
- heuristics;
- tool definitions;
- configuration

remain Working/Derived until an explicit promotion decision.

Promotion requires:
- provenance;
- version;
- owner;
- relevant tests/evals;
- security review proportional to impact;
- rollback/revocation/supersession path.

## Durable work

Long-running/external work should preserve:

```text
source event
-> verified admission
-> actor/workstream queue
-> bounded run
-> tool/action evidence
-> durable receipt
-> business outcome
```

`EVENT DELIVERED != ACTION VERIFIED`

Stateful work for the same actor/workstream may require serialization. Independent actors may remain parallel.

Approval/human-question gates should resume the exact run rather than reconstruct intent from prose.

## Material execution trace

A trace may include:
- tenant_id
- actor_id
- agent_id
- session_id / run_id
- correlation_id / causation_id
- model/provider
- prompt/skill/tool versions
- linked CRM objects
- linked Evidence IDs
- tool-call metadata
- controlled input/output hashes or artifact refs
- latency
- tokens
- cost
- verifier/sensor results
- approval/review events
- final status/disposition

## Data minimization

Do not default to plaintext logging of all prompts, email bodies or tool payloads.

Trace storage must support:
- redaction;
- minimization;
- access control;
- retention;
- tenant separation;
- controlled raw-artifact references.

## Adversarial deliberation

For rare high-value semantic decisions, useful roles can be:
- evidence workers;
- supporting thesis;
- challenging thesis;
- independent judge;
- risk perspectives.

This is not a vote and does not grant authority. Its purpose is to expose missing evidence and decision sensitivity before a typed disposition reaches a human/policy gate.

## Outcome-settled learning

Preserve:
- decision as made at time T;
- evidence knowable at T;
- outcome observed later;
- later reflection/lesson.

Historical replay must not leak future outcomes into the reconstructed past decision context.
