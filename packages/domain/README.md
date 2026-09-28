# Domain

Canonical DROWK CRM business behavior.

Owns domain rules and use cases around:
- Tenant / Actor boundaries;
- Account / Facility / Contact;
- Conversation / Activity;
- Pursuit / Opportunity;
- Evidence-aware promotion;
- Signals;
- Research;
- Work;
- Outcomes.

The domain must not import provider-specific schemas as canonical types.

Source connectors, AIsa, Gmail, queue engines, auth providers and observability
systems remain adapters around this boundary.

## DCRM-04A deterministic Work candidate compiler

`compileWork` consumes normalized, tenant-scoped source cases. Upstream identity
linkage supplies an anchor and flags ambiguity; the compiler does not infer
relationships from domains, threads or activity recency. Explicit Tasks outrank
core actions, which outrank eligible Shadow suggestions. Differences become reason
codes and REVIEW rather than silent overwrites. Hard accepted DNC and RED/HOLD
commercial exclusions suppress outbound work. A Shadow DNC label stays a review
candidate and cannot establish accepted DNC authority.

The compiler returns `CompiledWorkCandidate` values and performs no writes or
actions. Only A0, A1, A2 and A5 are emitted; A2 is preparation authority, not
execution. `reconcileWork` is a pure idempotency/supersession projection with an
audit result. A future persistence adapter must apply it atomically and preserve
attributable history; the existing `work_items` unique work key is not an
append-only audit mechanism by itself.

`dueDate` is a source/policy calendar date. `dueAt` remains null unless a separate
upstream obligation actually carries a time. `projectWorkViews` uses operational
date comparisons for Today, Replies and Follow Ups. None of these functions
create a Commitment, mark customer fulfillment or infer a relationship score.

Synthetic goldens in `test/work-golden.test.mjs` cite the PWM WP-02 harness case
numbers used for parity. They are target-domain fixtures, not imports of Apps
Script or Sheet shapes.
