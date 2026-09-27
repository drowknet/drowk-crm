# Canonical Data Model — v0 Draft

Status: DESIGN INPUT, not final database schema.

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

### Task
Operator task.

### Cadence
Reusable ordered prospecting/research play.

### CadenceEnrollment
A subject enrolled into a cadence.

### WorkItem
Compiled deterministic next action.

## Evidence objects

### SourceObservation
Immutable observation of source state.

### Evidence
A normalized claim/fact with provenance and freshness.

### IdentityCandidate
Candidate entity linkage with match reason/confidence.

### Signal
First-class commercial/research signal backed by evidence.

### ResearchRun
Bounded research execution with budget, tools and output lineage.

### ProviderRun
Exact provider/tool call audit record.

### Judgment
Typed semantic/model result, replayable against preserved inputs.

### PolicyDecision
Deterministic authorization/recommendation decision.

### Approval
Human approval bound to exact action context.

### Outcome
Observed result of a commercial or system action.

## Required cross-cutting fields

Where applicable:
- id
- tenant_id
- created_at
- updated_at
- version
- source
- source_id
- observed_at
- source_timestamp
- freshness/expires_at
- run_id
- policy_version
- created_by
- audit metadata

## Rules

- Raw evidence must never silently overwrite CRM truth.
- Contact/account promotion must preserve evidence lineage.
- A provider ID alone never becomes canonical identity.
- Domain match alone never creates an Account/Contact relationship.
- Fuzzy identity matches require review unless a future policy explicitly proves safe.
- SENT state is not delivery confirmation.
