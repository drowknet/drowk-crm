-- A new Person-linked Commitment needs the current resolved participant.
-- Existing Commitments remain immutable history when that participant is corrected.
CREATE FUNCTION require_current_commitment_participant() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.counterparty_participant_id IS NULL THEN RETURN NEW; END IF;

  -- Serialize a new Commitment with a correction of the same participant.
  PERFORM 1 FROM activity_participants p
    WHERE p.tenant_id = NEW.tenant_id
      AND p.id = NEW.counterparty_participant_id
      AND p.activity_id = NEW.source_activity_id
      AND p.person_id = NEW.counterparty_person_id
      AND p.identity_id = NEW.counterparty_identity_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commitment counterparty participant is not resolved';
  END IF;
  IF EXISTS (SELECT 1 FROM activity_participants successor
    WHERE successor.tenant_id = NEW.tenant_id
      AND successor.supersedes_id = NEW.counterparty_participant_id) THEN
    RAISE EXCEPTION 'Commitment counterparty participant has been superseded';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER commitments_current_participant_guard
  BEFORE INSERT ON commitments
  FOR EACH ROW EXECUTE FUNCTION require_current_commitment_participant();

-- The predecessor lock gives both insert paths the same ordering under concurrency.
CREATE OR REPLACE FUNCTION require_participant_correction_lineage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  predecessor activity_participants%ROWTYPE;
BEGIN
  IF NEW.supersedes_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO predecessor FROM activity_participants
    WHERE tenant_id=NEW.tenant_id AND id=NEW.supersedes_id AND activity_id=NEW.activity_id
    FOR UPDATE;
  -- The composite FK reports a missing or cross-tenant/activity predecessor.
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM predecessor.role
    OR NEW.source_participant_namespace IS DISTINCT FROM predecessor.source_participant_namespace
    OR NEW.source_participant_ref IS DISTINCT FROM predecessor.source_participant_ref THEN
    RAISE EXCEPTION 'participant correction changes role or source lineage';
  END IF;
  RETURN NEW;
END;
$$;
