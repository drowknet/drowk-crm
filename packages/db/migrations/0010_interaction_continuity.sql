-- DCRM-04E: source Conversation claims and append-only participant correction.
CREATE UNIQUE INDEX conversations_source_identity_uq
  ON conversations (tenant_id, channel, source_namespace, source_conversation_ref)
  WHERE source_namespace IS NOT NULL;

ALTER TABLE activity_participants
  ADD COLUMN supersedes_id uuid NULL,
  ADD CONSTRAINT activity_participants_self_supersession_ck
    CHECK (supersedes_id IS NULL OR supersedes_id <> id),
  ADD CONSTRAINT activity_participants_tenant_activity_id_uq
    UNIQUE (tenant_id, id, activity_id),
  ADD CONSTRAINT activity_participants_predecessor_fk
    FOREIGN KEY (tenant_id, supersedes_id, activity_id)
    REFERENCES activity_participants (tenant_id, id, activity_id);

CREATE UNIQUE INDEX activity_participants_single_successor_uq
  ON activity_participants (tenant_id, supersedes_id)
  WHERE supersedes_id IS NOT NULL;

CREATE FUNCTION require_participant_correction_lineage() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  predecessor activity_participants%ROWTYPE;
BEGIN
  IF NEW.supersedes_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO predecessor FROM activity_participants
    WHERE tenant_id=NEW.tenant_id AND id=NEW.supersedes_id AND activity_id=NEW.activity_id;
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

CREATE TRIGGER activity_participants_correction_lineage_guard
  BEFORE INSERT ON activity_participants
  FOR EACH ROW EXECUTE FUNCTION require_participant_correction_lineage();
