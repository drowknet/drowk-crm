# Contracts scope

This directory owns stable, provider-neutral data contracts.

Rules:
- keep contracts serializable and versionable;
- use explicit UNKNOWN/REVIEW states rather than nullable ambiguity where business semantics matter;
- source/provider IDs remain namespaced;
- do not import Gmail, AIsa, queue, auth or ORM SDK types here;
- temporal fields must not invent unknown source times;
- breaking contract changes require a migration/compatibility note.
