# Worker scope

This service executes tenant-scoped asynchronous work.

Rules:
- every job carries tenant and correlation/run context;
- retries must be idempotent or reconciled;
- external side effects can enter UNKNOWN state and require reconciliation;
- queue/workflow completion does not prove external action completion;
- worker code must not bypass domain/policy authority.
