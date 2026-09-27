-- Preserve the distinction between unknown (NULL) and a literal empty revision.
-- PostgreSQL 16 supports NULLS NOT DISTINCT, so duplicate unknown revisions
-- remain idempotent without collapsing them into empty strings.
BEGIN;

DROP INDEX source_observations_source_revision_uq;

CREATE UNIQUE INDEX source_observations_source_revision_uq
  ON source_observations (
    tenant_id,
    source_system,
    source_native_id,
    source_revision
  ) NULLS NOT DISTINCT;

COMMIT;
