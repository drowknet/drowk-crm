-- DCRM-04B: accepted human continuity, separate from evidence and operator auth.
-- Existing Contacts remain unlinked. Decision tuples enforce safe Person promotion
-- even for writes that bypass the TypeScript repository.
CREATE TABLE persons (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  display_name text NULL,
  recorded_at timestamptz NOT NULL,
  supersedes_id uuid NULL,
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES persons(tenant_id, id)
);

ALTER TABLE entity_match_decisions
  ADD CONSTRAINT entity_match_decisions_person_promotion_uq
  UNIQUE (tenant_id, id, resolution_scope, status, selected_entity_id);

CREATE TABLE person_identities (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  person_id uuid NOT NULL,
  kind text NOT NULL CHECK (length(btrim(kind)) > 0),
  namespace text NOT NULL CHECK (length(btrim(namespace)) > 0),
  normalized_value text NOT NULL CHECK (length(btrim(normalized_value)) > 0),
  temporal_state text NOT NULL CHECK (temporal_state IN ('CURRENT','HISTORICAL','UNKNOWN')),
  effective_from date NULL,
  effective_to date NULL,
  match_decision_id uuid NOT NULL,
  decision_scope text NOT NULL DEFAULT 'PERSON' CHECK (decision_scope = 'PERSON'),
  decision_status text NOT NULL DEFAULT 'MATCHED_SAFE' CHECK (decision_status = 'MATCHED_SAFE'),
  recorded_at timestamptz NOT NULL,
  supersedes_id uuid NULL,
  CHECK (effective_from IS NULL OR effective_to IS NULL OR effective_from <= effective_to),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id),
  FOREIGN KEY (tenant_id, match_decision_id, decision_scope, decision_status, person_id)
    REFERENCES entity_match_decisions(tenant_id, id, resolution_scope, status, selected_entity_id),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES person_identities(tenant_id, id)
);

CREATE INDEX person_identities_person_idx
  ON person_identities (tenant_id, person_id, recorded_at, id);
CREATE INDEX person_identities_value_lookup_idx
  ON person_identities (tenant_id, kind, namespace, normalized_value);

CREATE TABLE employments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  person_id uuid NOT NULL,
  account_id uuid NOT NULL,
  title text NULL,
  state text NOT NULL CHECK (state IN ('CURRENT','FORMER','UNKNOWN')),
  started_on date NULL,
  ended_on date NULL,
  recorded_at timestamptz NOT NULL,
  supersedes_id uuid NULL,
  CHECK (started_on IS NULL OR ended_on IS NULL OR started_on <= ended_on),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id),
  FOREIGN KEY (tenant_id, account_id) REFERENCES accounts(tenant_id, id),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES employments(tenant_id, id)
);

CREATE INDEX employments_person_idx
  ON employments (tenant_id, person_id, recorded_at, id);

ALTER TABLE contacts
  ADD COLUMN person_id uuid NULL,
  ADD COLUMN person_match_decision_id uuid NULL,
  ADD COLUMN person_decision_scope text NULL,
  ADD COLUMN person_decision_status text NULL,
  ADD CONSTRAINT contacts_person_link_pair_ck CHECK (
    (person_id IS NULL AND person_match_decision_id IS NULL
      AND person_decision_scope IS NULL AND person_decision_status IS NULL)
    OR
    (person_id IS NOT NULL AND person_match_decision_id IS NOT NULL
      AND person_decision_scope IS NOT NULL AND person_decision_status IS NOT NULL
      AND person_decision_scope = 'PERSON' AND person_decision_status = 'MATCHED_SAFE')
  ),
  ADD CONSTRAINT contacts_person_fk FOREIGN KEY (tenant_id, person_id)
    REFERENCES persons(tenant_id, id),
  ADD CONSTRAINT contacts_person_decision_fk
    FOREIGN KEY (tenant_id, person_match_decision_id, person_decision_scope,
      person_decision_status, person_id)
    REFERENCES entity_match_decisions(tenant_id, id, resolution_scope, status, selected_entity_id);

CREATE INDEX contacts_person_idx ON contacts (tenant_id, person_id) WHERE person_id IS NOT NULL;

CREATE FUNCTION reject_contact_person_relink() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.person_id IS NOT NULL AND (
    NEW.person_id IS DISTINCT FROM OLD.person_id OR
    NEW.person_match_decision_id IS DISTINCT FROM OLD.person_match_decision_id OR
    NEW.person_decision_scope IS DISTINCT FROM OLD.person_decision_scope OR
    NEW.person_decision_status IS DISTINCT FROM OLD.person_decision_status
  ) THEN
    RAISE EXCEPTION 'contact person link is immutable in DCRM-04B';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER contacts_person_relink_guard
  BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION reject_contact_person_relink();
