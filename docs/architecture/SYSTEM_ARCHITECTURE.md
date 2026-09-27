# DROWK CRM System Architecture

Status: FOUNDATION DRAFT

## Product boundary

DROWK CRM is a standalone multi-tenant Revenue Intelligence & Prospecting Operating System. It must not depend on any single mailbox, employer domain, SSD, AI provider, enrichment vendor or cloud account for its core intellectual property or business state.

## Canonical layers

### 1. Source Connectors
Examples:
- Gmail / Google Workspace
- future IMAP/other mail providers
- LinkedIn export and approved live evidence providers
- AIsa capability fabric
- web research
- manual operator input
- imported legacy CRM data

Connectors preserve source identifiers and do not directly own CRM truth.

### 2. Observation Layer
Captures what was observed:
- source
- source object ID
- source timestamp
- observed timestamp
- source watermark/cursor
- parser version
- content fingerprint/hash
- raw metadata reference
- labels/state where relevant

### 3. Evidence Ledger
Immutable or append-oriented facts derived from source observations.

Evidence must carry:
- provenance;
- subject candidate;
- attribute/claim;
- observed value;
- freshness;
- confidence where applicable;
- raw source reference;
- run ID;
- provider/tool version.

### 4. Identity Resolution
Produces candidate mappings between evidence and CRM entities.

Identity resolution may emit:
- exact match;
- strong candidate;
- ambiguous candidate;
- conflict;
- quarantine/review.

Identity merge is policy-controlled, not model-controlled.

### 5. Signal Engine
Signals are first-class objects.

A signal is an event or state change backed by evidence, for example:
- new facilities leader;
- buyer role change;
- new location;
- procurement route found;
- inbound reply;
- supplier registration requirement;
- expansion signal.

Signal != opportunity.

### 6. Judgment Layer
Combines:
- deterministic features;
- domain lexicons;
- TypeSafe/JEV typed judgments;
- optional generative models for bounded research/synthesis.

Raw judgments remain replayable.

### 7. Policy / Authority Layer
Determines:
- whether evidence is complete enough;
- whether an action is allowed;
- whether human review is mandatory;
- whether capability is read-only or write-enabled;
- cost/budget ceilings;
- autonomy class.

### 8. Accepted CRM Projection
Canonical business entities are the current accepted projection over attributable source/evidence history. They are not an excuse to erase prior knowledge or corrections.

Initially:
- Tenant
- User
- Account
- Facility
- Contact
- Identity
- Conversation
- Activity
- Pursuit
- Opportunity
- Task
- Cadence
- Work Item

### 9. Work Engine
Compiles eligible CRM/evidence/signal state into deterministic work.

Work must record source watermarks and policy version used for compilation.

### 10. Action / Execution
Execution is physically isolated by capability.

Examples:
- read Gmail;
- prepare draft;
- send email;
- update external CRM;
- call provider write endpoint.

Read capability and write capability are separate permissions.

Every external side effect should produce an ActionAttempt. If success/failure cannot be proven after timeout, crash or ambiguous provider response, the attempt enters UNKNOWN and must be reconciled rather than blindly retried.

### 11. Outcome Intelligence
Every material action should produce an outcome record so policy, messaging, timing and signal usefulness can be evaluated over time.

## External capability fabric

AIsa is treated as a capability/provider fabric, not a system of record.

A provider adapter must expose:
- provider;
- capability;
- operation;
- READ/WRITE classification;
- input/output schema;
- cost estimate;
- actual cost;
- freshness;
- run ID;
- response fingerprint;
- failure semantics.

## Runtime direction

Target runtime:
- Web application: authenticated operator UI
- Domain/API service: canonical business logic
- PostgreSQL: canonical business state
- background/durable worker layer: research, sync, enrichment and long-running jobs
- provider adapters: AIsa, Google, future providers
- observability/evals: traceable AI/tool execution

Apps Script may remain as a temporary Google connector during migration, but must not remain the long-term system of record.

## Multi-tenancy

Every business object that can contain tenant-specific data must be tenant-scoped.

Tenant data, secrets and policies must be logically separated.

Initial reference tenant: PWM / Pacific West, subject to lawful data ownership and migration rules.
