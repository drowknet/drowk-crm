-- DCRM-04C: accepted interaction is a separate, policy-gated projection.
-- Stable (tenant, source_namespace, source_native_id) gets one accepted Activity;
-- a changed source revision fails closed rather than rewriting accepted history.
-- Preserve old source metadata. A one-time backfill uses proven Gmail mailbox
-- context; future writes supply a provider-neutral namespace override.
ALTER TABLE source_observations
  ADD COLUMN source_namespace_override text NULL;

UPDATE source_observations SET source_namespace_override =
  CASE
    WHEN length(btrim(source_metadata->>'sourceNamespace')) > 0
      THEN btrim(source_metadata->>'sourceNamespace')
    WHEN source_system = 'gmail'
      AND length(btrim(source_metadata->'gmail'->>'connectorRef')) > 0
      AND length(btrim(source_metadata->'gmail'->>'mailboxRef')) > 0
      THEN 'gmail:' ||
        octet_length(source_metadata->'gmail'->>'connectorRef')::text || ':' ||
        (source_metadata->'gmail'->>'connectorRef') || ':' ||
        octet_length(source_metadata->'gmail'->>'mailboxRef')::text || ':' ||
        (source_metadata->'gmail'->>'mailboxRef')
    ELSE NULL
  END;

ALTER TABLE source_observations
  ADD COLUMN source_namespace text GENERATED ALWAYS AS (
    COALESCE(source_namespace_override, source_system)
  ) STORED,
  ADD CONSTRAINT source_observations_namespace_ck CHECK (
    length(btrim(source_namespace)) > 0 AND
    (source_namespace = source_system OR
      left(source_namespace, length(source_system) + 1) = source_system || ':')
  );

DROP INDEX source_observations_source_revision_uq;
CREATE UNIQUE INDEX source_observations_source_revision_uq
  ON source_observations (tenant_id, source_namespace, source_native_id, source_revision)
  NULLS NOT DISTINCT;

ALTER TABLE source_observations
  ADD CONSTRAINT source_observations_activity_lineage_uq
  UNIQUE (tenant_id, id, source_namespace, source_native_id);
ALTER TABLE evidence
  ADD CONSTRAINT evidence_observation_lineage_uq UNIQUE (tenant_id, id, observation_id);
ALTER TABLE policy_decisions
  ADD CONSTRAINT policy_decisions_interaction_authority_uq
  UNIQUE (tenant_id, id, subject_id, action, disposition, evidence_complete);
ALTER TABLE person_identities
  ADD CONSTRAINT person_identities_participant_person_uq UNIQUE (tenant_id, id, person_id);

CREATE TABLE conversations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  channel text NOT NULL CHECK (length(btrim(channel)) > 0),
  account_id uuid NULL,
  facility_id uuid NULL,
  source_namespace text NULL,
  source_conversation_ref text NULL,
  recorded_at timestamptz NOT NULL,
  supersedes_id uuid NULL,
  CHECK (
    (source_namespace IS NULL AND source_conversation_ref IS NULL)
    OR (source_namespace IS NOT NULL AND source_conversation_ref IS NOT NULL
      AND length(btrim(source_namespace)) > 0 AND length(btrim(source_conversation_ref)) > 0)
  ),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, account_id) REFERENCES accounts(tenant_id, id),
  FOREIGN KEY (tenant_id, facility_id) REFERENCES facilities(tenant_id, id),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES conversations(tenant_id, id)
);

CREATE INDEX conversations_source_lookup_idx
  ON conversations (tenant_id, channel, source_namespace, source_conversation_ref);

CREATE TABLE activities (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  conversation_id uuid NOT NULL,
  kind text NOT NULL CHECK (length(btrim(kind)) > 0),
  direction text NOT NULL CHECK (direction IN ('INBOUND','OUTBOUND','INTERNAL','UNKNOWN')),
  source_observation_id uuid NOT NULL,
  source_namespace text NOT NULL,
  source_native_id text NOT NULL,
  occurred_at timestamptz NULL,
  recorded_at timestamptz NOT NULL,
  promotion_policy_decision_id uuid NOT NULL,
  promotion_action text NOT NULL DEFAULT 'ACCEPT_INTERACTION'
    CHECK (promotion_action = 'ACCEPT_INTERACTION'),
  promotion_disposition text NOT NULL DEFAULT 'ALLOW'
    CHECK (promotion_disposition = 'ALLOW'),
  promotion_evidence_complete boolean NOT NULL DEFAULT true
    CHECK (promotion_evidence_complete = true),
  accepted_payload_digest text NOT NULL CHECK (accepted_payload_digest ~ '^[a-f0-9]{64}$'),
  supersedes_id uuid NULL,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, id, source_observation_id),
  UNIQUE (tenant_id, source_observation_id),
  UNIQUE (tenant_id, source_namespace, source_native_id),
  FOREIGN KEY (tenant_id, conversation_id) REFERENCES conversations(tenant_id, id),
  FOREIGN KEY (tenant_id, source_observation_id, source_namespace, source_native_id)
    REFERENCES source_observations(tenant_id, id, source_namespace, source_native_id),
  FOREIGN KEY (tenant_id, promotion_policy_decision_id, source_observation_id,
    promotion_action, promotion_disposition, promotion_evidence_complete)
    REFERENCES policy_decisions(tenant_id, id, subject_id, action, disposition, evidence_complete),
  FOREIGN KEY (tenant_id, supersedes_id) REFERENCES activities(tenant_id, id)
);

CREATE INDEX activities_conversation_idx
  ON activities (tenant_id, conversation_id, recorded_at, id);

CREATE TABLE activity_evidence (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  activity_id uuid NOT NULL,
  evidence_id uuid NOT NULL,
  source_observation_id uuid NOT NULL,
  recorded_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, activity_id, evidence_id),
  FOREIGN KEY (tenant_id, activity_id, source_observation_id)
    REFERENCES activities(tenant_id, id, source_observation_id),
  FOREIGN KEY (tenant_id, evidence_id, source_observation_id)
    REFERENCES evidence(tenant_id, id, observation_id)
);

CREATE INDEX activity_evidence_evidence_idx ON activity_evidence (tenant_id, evidence_id);

CREATE TABLE activity_participants (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  activity_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('FROM','TO','CC','PARTICIPANT','OWNER','UNKNOWN')),
  person_id uuid NULL,
  identity_id uuid NULL,
  source_participant_namespace text NULL,
  source_participant_ref text NULL,
  recorded_at timestamptz NOT NULL,
  CHECK (
    (source_participant_namespace IS NULL AND source_participant_ref IS NULL)
    OR (source_participant_namespace IS NOT NULL AND source_participant_ref IS NOT NULL
      AND length(btrim(source_participant_namespace)) > 0
      AND length(btrim(source_participant_ref)) > 0)
  ),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, activity_id) REFERENCES activities(tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id),
  FOREIGN KEY (tenant_id, identity_id) REFERENCES person_identities(tenant_id, id),
  FOREIGN KEY (tenant_id, identity_id, person_id)
    REFERENCES person_identities(tenant_id, id, person_id)
);

CREATE INDEX activity_participants_activity_idx
  ON activity_participants (tenant_id, activity_id, recorded_at, id);

CREATE FUNCTION require_activity_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  checked_tenant uuid;
  checked_activity uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    checked_tenant := OLD.tenant_id;
    checked_activity := OLD.activity_id;
  ELSE
    checked_tenant := NEW.tenant_id;
    checked_activity := NEW.id;
  END IF;
  IF EXISTS (SELECT 1 FROM activities a WHERE a.tenant_id = checked_tenant AND a.id = checked_activity)
    AND NOT EXISTS (SELECT 1 FROM activity_evidence ae
      WHERE ae.tenant_id = checked_tenant AND ae.activity_id = checked_activity) THEN
    RAISE EXCEPTION 'accepted Activity requires attributable Evidence';
  END IF;
  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER activities_evidence_required
  AFTER INSERT OR UPDATE ON activities DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION require_activity_evidence();
CREATE CONSTRAINT TRIGGER activity_evidence_last_delete_guard
  AFTER DELETE ON activity_evidence DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION require_activity_evidence();

CREATE FUNCTION reject_interaction_rewrite() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'accepted interaction history is immutable; append a new record';
END;
$$;
CREATE TRIGGER conversations_rewrite_guard
  BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION reject_interaction_rewrite();
CREATE TRIGGER activities_rewrite_guard
  BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION reject_interaction_rewrite();
CREATE TRIGGER activity_evidence_rewrite_guard
  BEFORE UPDATE OR DELETE ON activity_evidence
  FOR EACH ROW EXECUTE FUNCTION reject_interaction_rewrite();
CREATE TRIGGER activity_participants_rewrite_guard
  BEFORE UPDATE OR DELETE ON activity_participants
  FOR EACH ROW EXECUTE FUNCTION reject_interaction_rewrite();
