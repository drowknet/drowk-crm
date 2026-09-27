# Canonical Data Model — v0 Draft

Status: DESIGN INPUT, not final database schema.

This model intentionally combines PWM_CRM lessons with transferable patterns harvested from earlier DROWK engineering. Names and relationships remain subject to DCRM-00 contract review before database implementation.

## Core truth objects

### Tenant
Owns:
- policies;
- lexicons;
- connectors;
- users;
- CRM truth;
- provider budgets.

### User
Represents a human operator or service identity.

Actor, Agent, Session and Tenant are distinct identities and must not be collapsed.

### Account
Commercial organization or institutional target.

### Facility
A physical operating location.

Rule: Account != Facility.

### Contact
Human CRM entity once identity policy permits promotion.

### Identity
Provider/source-specific identifiers connected to a Contact or candidate.

Examples:
- email address;
- LinkedIn URL;
- provider person ID;
- Gmail address identity.

Provider-native identity remains namespaced evidence. Provider ID != canonical entity ID.

### Conversation
Channel-neutral communication container.

### Activity
Atomic communication or business event linked to source evidence.

### ActivityParticipant
Participant role in an Activity.

### Pursuit
Commercial pursuit independent of final opportunity creation.

### Opportunity
Higher-confidence commercial opportunity governed by explicit promotion policy.

Signal != Opportunity.

### Task
Operator task.

### Cadence
Reusable ordered prospecting/research play.

### CadenceEnrollment
A subject enrolled into a cadence.

### WorkItem
Compiled deterministic next action.

Work compilation must preserve source/evidence freshness and policy version.

## Source and Evidence objects

### SourceObservation
Immutable or append-oriented observation of source state.

Candidate fields:
- source system;
- source object/native ID;
- source revision;
- observation ID when source-native identity is unavailable;
- observed_at;
- effective_at;
- retrieved_at;
- ingested_at;
- source watermark/cursor;
- parser/adapter version;
- source fingerprint;
- controlled raw artifact reference;
- source state/labels where applicable.

Unknown source time remains unknown. Do not substitute ingestion time for observation time.

### Evidence
Normalized claim/fact with provenance, freshness and rights/retention metadata.

Evidence must not silently overwrite CRM truth.

### IdentityEvidence
Strong design candidate based on previously implemented DROWK patterns.

Candidate semantics:
- entity type;
- evidence type;
- raw value;
- normalized value;
- normalization version;
- trust state;
- verification method/time/actor;
- source system/native ID/reference;
- observed_at;
- contextual entity where required;
- supersedes_id;
- reason.

Trust states should distinguish at least:
- CLAIMED
- VERIFIED
- REJECTED

Weak evidence must not become strong simply because a provider/model assigns confidence.

### IdentityCandidate
Candidate entity linkage with match reason/confidence/evidence references.

Candidate != Match.

### EntityMatchDecision
Durable resolver decision.

Candidate semantics:
- subject/source object;
- resolution scope;
- policy_version;
- status;
- selected canonical entity only when safely matched;
- method;
- reason codes;
- candidate count;
- evidence references;
- deterministic fingerprint;
- actor/run;
- supersedes_id.

Initial status vocabulary should support equivalents of:
- MATCHED_SAFE
- NO_MATCH
- INSUFFICIENT_STRONG_EVIDENCE
- REVIEW_REQUIRED
- LINK_CONFLICT
- BLOCKED_PARENT_REQUIRED

NO_MATCH never authorizes automatic entity creation.

### Signal
First-class commercial/research signal backed by evidence.

Candidate source families:
- FIRST_PARTY
- RELATIONSHIP
- COMPANY_LOCATION
- PROCUREMENT
- PUBLIC_RESEARCH

A CRM-specific extension may later add additional families only with explicit semantics.

Signal temporal fields should distinguish:
- observed_at;
- effective_at;
- ingested_at;
- processed_at;
- expires_at.

Signal lineage should preserve:
- source namespace;
- source-native ID;
- source revision;
- observation ID alternative;
- ingestion key;
- normalized input digest;
- policy version;
- evidence references.

Signal lifecycle is distinct from truth verification.

### SignalEvidence
Explicit many-to-many linkage between Signal and Evidence.

### ResearchRun
Bounded research execution with:
- objective;
- evidence gaps;
- allowed capabilities/providers;
- budget;
- stopping conditions;
- tool/run lineage;
- output Evidence IDs.

### ProviderRun
Exact provider/tool call audit record.

Candidate fields:
- capability;
- provider;
- operation;
- interface;
- read/write class;
- estimated cost;
- actual cost;
- actual-cost-known;
- request fingerprint;
- response fingerprint;
- provider-native task ID;
- freshness;
- rights/retention classification;
- status/error category;
- latency;
- run/correlation lineage.

### Judgment
Typed semantic/model result, replayable against preserved inputs.

Model output != verified output.

### PolicyDecision
Deterministic authorization/recommendation decision with:
- policy version;
- exact subject/action;
- evidence completeness;
- reason codes;
- allowed/denied/review disposition.

### Approval
Human approval bound to exact action context.

Future high-impact approvals should bind to actor, tenant, action, target, payload/body hash, object/thread, policy snapshot, expiration and single-use execution context.

### Outcome
Observed result of a commercial or system action.

Outcome must remain separate from the decision context that preceded it so historical replay does not leak future knowledge.

## Reliability and lineage objects

### IdempotencyClaim
Strong design candidate for durable retried writes.

Candidate semantics:
- scope/operation;
- hashed idempotency key;
- normalized input digest/payload reference;
- canonical result/object reference;
- event/action receipt reference;
- created/completed state;
- conflict semantics.

Do not store reusable raw secret-like keys when a digest is sufficient.

Idempotency != external delivery confirmation and != provider billing exactly-once.

### Event
Versioned event envelope with:
- event_id;
- event_type;
- event_version;
- occurred_at;
- tenant;
- actor;
- agent/session/run where applicable;
- correlation_id;
- causation_id;
- entity/subject;
- payload;
- provenance.

Event delivered != action verified.

### AgentRun / ExecutionTrace
Material execution lineage may preserve:
- actor;
- agent;
- session/run;
- tenant;
- model/provider;
- prompt/skill/tool versions;
- linked business/evidence objects;
- tool-call metadata;
- input/output hashes or controlled artifact references;
- latency/tokens/cost;
- sensor/verifier results;
- approval/review;
- final disposition.

Raw sensitive payloads should be minimized/redacted instead of logged by default.

### TemporalHypothesis / Snapshot
Generic design family for future anticipatory intelligence.

Use only when a real CRM use case justifies it, for example:
- buyer/procurement-route hypothesis;
- commercial timing hypothesis;
- account readiness;
- trend snapshot;
- forecast snapshot.

Required pattern:
- lineage key;
- fingerprint;
- policy/rule version;
- explicit state including abstention/unknown/review where applicable;
- immutable bounded snapshot of evidence known at evaluation time;
- supersedes_id;
- actor/run provenance.

Do not copy HDS-specific anticipatory tables blindly.

## Required cross-cutting fields

Where applicable:
- id
- tenant_id
- created_at
- updated_at
- version
- source
- source_id
- source_revision
- observed_at
- effective_at
- source_timestamp
- freshness/expires_at
- run_id
- correlation_id
- causation_id
- policy_version
- created_by / actor_ref
- supersedes_id
- fingerprint / input_digest
- audit metadata

## Historical / supersession rule

When a material derived decision, evidence state, hypothesis or policy-evaluated snapshot changes, prefer append/supersede history over silent rewrite where auditability matters.

A current head is a projection over history; history remains attributable.

## Rules

- Raw evidence must never silently overwrite CRM truth.
- Contact/Account/Facility promotion must preserve evidence lineage.
- A provider ID alone never becomes canonical identity.
- Domain match alone never creates an Account/Contact relationship.
- Fuzzy/LLM identity matches require review unless a future deterministic policy proves a narrowly bounded case safe.
- SENT state is not delivery confirmation.
- Draft != Sent.
- Inbox != source truth.
- Spam state != commercial irrelevance.
- Unknown != No.
- Empty bounded provider response != universal absence.
- Signal != Opportunity.
- Forecast != Fact.
- Session isolation != authentication.
- Database uniqueness != real-world verification.
- Model confidence != authority.
