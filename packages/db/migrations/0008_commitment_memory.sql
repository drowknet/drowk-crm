-- DCRM-04D: attributable obligation memory, separate from Activity and Work.
ALTER TABLE facilities
  ADD CONSTRAINT facilities_commitment_account_uq UNIQUE (tenant_id, id, account_id);
ALTER TABLE activity_participants
  ADD CONSTRAINT activity_participants_commitment_authority_uq
  UNIQUE (tenant_id, id, activity_id, person_id, identity_id);

CREATE TABLE commitments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  commitment_key text NOT NULL CHECK (length(btrim(commitment_key)) > 0),
  kind text NOT NULL CHECK (kind IN ('REQUEST','PROMISE','AGREED_NEXT_STEP')),
  state text NOT NULL CHECK (state IN ('SUGGESTED','CONFIRMED','FULFILLED','DECLINED','UNRESOLVED')),
  statement text NOT NULL CHECK (length(btrim(statement)) > 0),
  source_activity_id uuid NOT NULL,
  source_observation_id uuid NOT NULL,
  account_id uuid NULL,
  facility_id uuid NULL,
  counterparty_person_id uuid NULL,
  counterparty_participant_id uuid NULL,
  counterparty_identity_id uuid NULL,
  owed_by text NOT NULL CHECK (owed_by IN ('TENANT','COUNTERPARTY','MUTUAL','UNKNOWN')),
  due_date date NULL,
  condition_text text NULL CHECK (condition_text IS NULL OR length(btrim(condition_text)) > 0),
  recorded_at timestamptz NOT NULL,
  promotion_policy_decision_id uuid NOT NULL,
  promotion_action text NOT NULL DEFAULT 'ACCEPT_COMMITMENT'
    CHECK (promotion_action = 'ACCEPT_COMMITMENT'),
  promotion_disposition text NOT NULL DEFAULT 'ALLOW'
    CHECK (promotion_disposition = 'ALLOW'),
  promotion_evidence_complete boolean NOT NULL DEFAULT true
    CHECK (promotion_evidence_complete = true),
  evidence_count integer NOT NULL CHECK (evidence_count > 0),
  accepted_payload_digest text NOT NULL CHECK (accepted_payload_digest ~ '^[a-f0-9]{64}$'),
  supersedes_id uuid NULL,
  CHECK (supersedes_id IS NULL OR supersedes_id <> id),
  CHECK (
    (counterparty_person_id IS NULL AND counterparty_participant_id IS NULL
      AND counterparty_identity_id IS NULL)
    OR (counterparty_person_id IS NOT NULL AND counterparty_participant_id IS NOT NULL
      AND counterparty_identity_id IS NOT NULL)
  ),
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, commitment_key),
  UNIQUE (tenant_id, id, source_activity_id, source_observation_id),
  FOREIGN KEY (tenant_id, source_activity_id, source_observation_id)
    REFERENCES activities(tenant_id, id, source_observation_id),
  FOREIGN KEY (tenant_id, account_id) REFERENCES accounts(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id, account_id)
    REFERENCES facilities(tenant_id, id, account_id),
  FOREIGN KEY (tenant_id, counterparty_participant_id, source_activity_id,
    counterparty_person_id, counterparty_identity_id)
    REFERENCES activity_participants(tenant_id, id, activity_id, person_id, identity_id),
  FOREIGN KEY (tenant_id, promotion_policy_decision_id, source_activity_id,
    promotion_action, promotion_disposition, promotion_evidence_complete)
    REFERENCES policy_decisions(tenant_id, id, subject_id, action, disposition, evidence_complete),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES commitments(tenant_id, id)
);

CREATE INDEX commitments_activity_idx ON commitments (tenant_id, source_activity_id, recorded_at, id);
CREATE INDEX commitments_person_idx ON commitments (tenant_id, counterparty_person_id, recorded_at, id)
  WHERE counterparty_person_id IS NOT NULL;
CREATE INDEX commitments_account_idx ON commitments (tenant_id, account_id, recorded_at, id)
  WHERE account_id IS NOT NULL;

CREATE TABLE commitment_evidence (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  commitment_id uuid NOT NULL,
  source_activity_id uuid NOT NULL,
  source_observation_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, commitment_id, evidence_id),
  FOREIGN KEY (tenant_id, commitment_id, source_activity_id, source_observation_id)
    REFERENCES commitments(tenant_id, id, source_activity_id, source_observation_id),
  FOREIGN KEY (tenant_id, source_activity_id, evidence_id)
    REFERENCES activity_evidence(tenant_id, activity_id, evidence_id),
  FOREIGN KEY (tenant_id, evidence_id, source_observation_id)
    REFERENCES evidence(tenant_id, id, observation_id)
);

CREATE FUNCTION require_commitment_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  checked_tenant uuid;
  checked_commitment uuid;
  expected_count integer;
  actual_count integer;
BEGIN
  IF TG_TABLE_NAME = 'commitments' THEN
    checked_tenant := NEW.tenant_id;
    checked_commitment := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    checked_tenant := OLD.tenant_id;
    checked_commitment := OLD.commitment_id;
  ELSE
    checked_tenant := NEW.tenant_id;
    checked_commitment := NEW.commitment_id;
  END IF;
  SELECT evidence_count INTO expected_count FROM commitments c
    WHERE c.tenant_id = checked_tenant AND c.id = checked_commitment;
  IF expected_count IS NOT NULL THEN
    SELECT count(*)::integer INTO actual_count FROM commitment_evidence ce
      WHERE ce.tenant_id = checked_tenant AND ce.commitment_id = checked_commitment;
    IF actual_count <> expected_count THEN
      RAISE EXCEPTION 'accepted Commitment Evidence set is incomplete or altered';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER commitments_evidence_required
  AFTER INSERT OR UPDATE ON commitments DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION require_commitment_evidence();
CREATE CONSTRAINT TRIGGER commitment_evidence_count_guard
  AFTER INSERT ON commitment_evidence DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION require_commitment_evidence();
CREATE CONSTRAINT TRIGGER commitment_evidence_last_delete_guard
  AFTER DELETE ON commitment_evidence DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION require_commitment_evidence();

CREATE FUNCTION reject_commitment_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Commitment history is immutable; append a superseding record';
END;
$$;
CREATE TRIGGER commitments_rewrite_guard
  BEFORE UPDATE OR DELETE ON commitments FOR EACH ROW EXECUTE FUNCTION reject_commitment_rewrite();
CREATE TRIGGER commitment_evidence_rewrite_guard
  BEFORE UPDATE OR DELETE ON commitment_evidence
  FOR EACH ROW EXECUTE FUNCTION reject_commitment_rewrite();
