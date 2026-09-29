# DROWK CRM Engineering Harness Model

Status: FOUNDATION DESIGN

This model is derived from successful patterns observed in DROWK engineering prior art and adapted for this standalone CRM.

## Principle

`MODEL OUTPUT != VERIFIED OUTPUT`

A coding or research agent produces a candidate. Completion depends on evidence.

## Control layers

### Standing Orders
Owned by `AGENTS.md`.

Examples:
- repository/write boundary;
- security invariants;
- authority limits;
- data restrictions.

### Scoped Plan
Each material work package should state:
- objective;
- allowed files/surfaces;
- prohibited effects;
- inputs;
- expected outputs;
- migration impact;
- test/eval plan;
- rollback path.

### Guides
Feed-forward rules that tell an agent how to act.

### Sensors
Computational checks that produce evidence.

Initial future sensor families:
- REPOSITORY
- GUIDANCE
- SECRETS
- DEPENDENCIES
- STATIC_ANALYSIS
- CONTRACTS
- MIGRATIONS
- DATABASE_INTEGRATION
- IDENTITY
- TENANT_ISOLATION
- POLICY
- PROVIDER_CAPABILITY
- EVALS
- FAIL_CLOSED

### Human Gates
Properties that cannot yet be reliably established computationally.

Initial gates:
- SEMANTIC_ARCHITECTURE
- BOUNDARY_EXPANSION
- HIGH_IMPACT_WRITE
- IDENTITY_AMBIGUITY
- PRODUCTION_DEPLOYMENT
- PROVIDER_RIGHTS_AMBIGUITY

## Suggested modes

Once implementation exists:

- `preflight`: repo/path/branch/base/cleanliness/context checks.
- `fast`: deterministic local checks for bounded iteration.
- `full`: fast + complete unit/contract/eval/security suite.
- `ci`: reproducible clean-environment gate.
- `integration`: disposable real PostgreSQL/provider test environment; never implicit in ordinary local work.

## Correction policy

Ordinary in-scope failures may receive at most two bounded correction attempts before escalation.

Never self-remediate by:
- weakening a sensor;
- deleting a failing golden case;
- resetting unexpected state;
- broad cleanup;
- expanding credentials;
- switching repository;
- changing architecture outside the approved plan.

## Agent workcell

For high-value work:

```text
goal
-> worker
-> deterministic sensors
-> independent critic
-> bounded repair
-> human question gate when knowledge is missing
-> owner/promotion gate
```

Reviewer disagreement is an escalation signal, not a majority vote.

## Trace lineage

Every material agent run should eventually distinguish:
- Actor
- Agent
- Session/Run
- Tenant
- Tool/Capability
- Provider/Model
- Approval
- Result/Disposition

Another model's approval is not authorization.
