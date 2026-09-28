-- DCRM-04F: durable tenant-to-Person memory and attributable interaction assertions.
CREATE TABLE relationships (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  person_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, person_id),
  UNIQUE (tenant_id, id, person_id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id)
);

CREATE TABLE relationship_interactions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  relationship_id uuid NOT NULL,
  person_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('ACTIVITY','RECIPROCAL','MEANINGFUL')),
  authority_participant_id uuid NOT NULL,
  authority_identity_id uuid NOT NULL,
  occurred_at timestamptz NULL,
  recorded_at timestamptz NOT NULL,
  promotion_policy_decision_id uuid NULL,
  promotion_action text GENERATED ALWAYS AS (CASE kind
    WHEN 'RECIPROCAL' THEN 'ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL'
    WHEN 'MEANINGFUL' THEN 'ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL'
    ELSE NULL END) STORED,
  promotion_disposition text NOT NULL DEFAULT 'ALLOW'
    CHECK (promotion_disposition = 'ALLOW'),
  promotion_evidence_complete boolean NOT NULL DEFAULT true
    CHECK (promotion_evidence_complete = true),
  CHECK ((kind = 'ACTIVITY' AND promotion_policy_decision_id IS NULL)
    OR (kind IN ('RECIPROCAL','MEANINGFUL') AND promotion_policy_decision_id IS NOT NULL)),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, relationship_id, activity_id, kind),
  FOREIGN KEY (tenant_id, relationship_id, person_id)
    REFERENCES relationships(tenant_id, id, person_id),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES activities(tenant_id, id),
  FOREIGN KEY (tenant_id, authority_participant_id, activity_id,
    person_id, authority_identity_id)
    REFERENCES activity_participants(tenant_id, id, activity_id, person_id, identity_id),
  FOREIGN KEY (tenant_id, promotion_policy_decision_id, activity_id,
    promotion_action, promotion_disposition, promotion_evidence_complete)
    REFERENCES policy_decisions(tenant_id, id, subject_id, action, disposition, evidence_complete)
);

CREATE INDEX relationship_interactions_history_idx
  ON relationship_interactions (tenant_id, relationship_id, recorded_at, id);
CREATE INDEX relationship_interactions_latest_idx
  ON relationship_interactions (tenant_id, relationship_id, kind, occurred_at DESC, id DESC)
  WHERE occurred_at IS NOT NULL;

CREATE FUNCTION require_relationship_interaction_authority() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  activity_time timestamptz;
BEGIN
  SELECT occurred_at INTO activity_time FROM activities
    WHERE tenant_id=NEW.tenant_id AND id=NEW.activity_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Relationship Activity is missing'; END IF;
  IF NEW.occurred_at IS DISTINCT FROM activity_time THEN
    RAISE EXCEPTION 'Relationship interaction event time must match accepted Activity';
  END IF;

  -- A correction locks this same predecessor. The later transaction sees current state.
  PERFORM 1 FROM activity_participants p
    WHERE p.tenant_id=NEW.tenant_id AND p.id=NEW.authority_participant_id
      AND p.activity_id=NEW.activity_id AND p.person_id=NEW.person_id
      AND p.identity_id=NEW.authority_identity_id
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Relationship participant authority is missing'; END IF;
  IF EXISTS (SELECT 1 FROM activity_participants successor
    WHERE successor.tenant_id=NEW.tenant_id
      AND successor.supersedes_id=NEW.authority_participant_id) THEN
    RAISE EXCEPTION 'Relationship participant authority has been superseded';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER relationship_interactions_authority_guard
  BEFORE INSERT ON relationship_interactions
  FOR EACH ROW EXECUTE FUNCTION require_relationship_interaction_authority();

CREATE FUNCTION reject_relationship_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Relationship memory is immutable; append an attributable assertion';
END;
$$;
CREATE TRIGGER relationships_rewrite_guard
  BEFORE UPDATE OR DELETE ON relationships
  FOR EACH ROW EXECUTE FUNCTION reject_relationship_rewrite();
CREATE TRIGGER relationship_interactions_rewrite_guard
  BEFORE UPDATE OR DELETE ON relationship_interactions
  FOR EACH ROW EXECUTE FUNCTION reject_relationship_rewrite();
