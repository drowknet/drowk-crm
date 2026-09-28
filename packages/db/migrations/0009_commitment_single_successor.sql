-- One attributable continuation per predecessor; roots may remain independent.
CREATE UNIQUE INDEX commitments_single_successor_uq
  ON commitments (tenant_id, supersedes_id)
  WHERE supersedes_id IS NOT NULL;
