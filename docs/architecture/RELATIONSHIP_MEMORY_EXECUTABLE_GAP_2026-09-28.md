# Relationship-memory executable gap — 2026-09-28

Status: POST-DCRM-04A ARCHITECTURE CHECKPOINT COMPLETE  
Inspected foundation: `79594c5377d779685466c591aab8c0f5200cca12`

## Why this checkpoint exists

The product canon requires durable relationship memory without collapsing Person,
Contact, Identity, Employment, Relationship, Buyer Role, Commitment, Activity or
Work into one object.

DCRM-04A deliberately preserved those semantic boundaries without implementing the
relationship model. After its merge and green post-merge CI, the executable core was
re-inspected before opening richer buyer/procurement/research/relationship work.

## Executable state observed

### Present

- `Account` contract and persistence;
- `Facility` contract and persistence;
- `Contact` contract and persistence, currently limited to display name and history fields;
- SourceObservation / Evidence;
- IdentityEvidence persistence;
- EntityMatchDecision contract/persistence and fail-closed linking helper;
- deterministic Work compiler and Work schema.

### Not yet present as canonical executable objects

- Person;
- canonical Identity;
- Employment;
- Relationship;
- Buyer Role;
- Commitment.

There are no branded IDs, contracts, tables, repositories or domain invariants for
those six canonical concepts at this checkpoint.

`Contact` also has no executable link to a durable Person.

IdentityEvidence and EntityMatchDecision preserve evidence and resolution decisions,
but they are not a canonical Identity/Person model.

## Dependency conclusion

The first missing dependency is durable human continuity.

Before DROWK can safely implement relationship history, job-change continuity,
buyer-role scope, warm-introduction paths or richer relationship UX, it needs a
stable way to represent:

1. Person — the durable human subject;
2. canonical Identity — a source/channel identity linked under explicit policy;
3. Employment — temporal Person <-> organization context;
4. Contact -> Person — operational CRM representation linked to the durable human.

This is smaller and safer than implementing the entire Relationship Intelligence
model in one package.

## Deliberately not pulled into the first foundation slice

Do not use this checkpoint to introduce:
- a universal relationship/trust score;
- a giant social graph;
- omnichannel capture;
- automatic job-change reattribution;
- Buyer Role inference from title alone;
- Commitment inference from ambiguous communication;
- automatic warm-introduction authority;
- provider-specific identity schemas;
- Gmail/live-provider/outbound authority.

Relationship, Buyer Role and Commitment remain required canonical product concepts.
They should be added on top of durable Person/Identity/Employment continuity with
their own explicit evidence, temporal and authority semantics.

## Recommended next implementation boundary

The next repo-owned implementation WP should be limited to:

**Person + canonical Identity + temporal Employment + explicit Contact -> Person linkage**

Expected proof should include:
- tenant-scoped contracts and branded IDs;
- forward-only PostgreSQL migration;
- tenant-safe repositories;
- point-in-time Employment semantics with unknown dates preserved;
- identity ambiguity that fails closed;
- job-change history that does not move prior evidence/conversations/authority;
- Contact changes that do not create a new Person implicitly;
- synthetic migration/repository/domain sensors;
- no Gmail/live-provider/write/autonomy expansion.

This recommendation is an architecture result, not an active Codex assignment.
A new implementation WP and feature branch require the next explicit owner/ChatGPT gate.
