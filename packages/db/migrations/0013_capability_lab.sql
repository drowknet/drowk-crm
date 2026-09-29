-- DCRM-05A: synthetic capability observations remain audit records, never CRM truth.
ALTER TABLE provider_runs
  ADD COLUMN research_run_id uuid NULL,
  ADD COLUMN case_id text NULL,
  ADD COLUMN workload_cell text NULL,
  ADD COLUMN adapter_version text NULL,
  ADD COLUMN normalized_input jsonb NULL,
  ADD COLUMN lab_case jsonb NULL,
  ADD COLUMN latency_ms integer NULL,
  ADD COLUMN provenance_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN synthetic boolean NOT NULL DEFAULT false;

ALTER TABLE provider_runs
  ADD CONSTRAINT provider_runs_research_fk FOREIGN KEY (tenant_id,research_run_id)
    REFERENCES research_runs(tenant_id,id),
  ADD CONSTRAINT provider_runs_nonnegative_cost CHECK (
    (estimated_cost_usd_micros IS NULL OR estimated_cost_usd_micros >= 0) AND
    (actual_cost_usd_micros IS NULL OR actual_cost_usd_micros >= 0) AND
    (latency_ms IS NULL OR latency_ms >= 0)),
  ADD CONSTRAINT provider_runs_actual_cost_known CHECK (
    actual_cost_known = (actual_cost_usd_micros IS NOT NULL)),
  ADD CONSTRAINT provider_runs_synthetic_read CHECK (
    NOT synthetic OR (access_class = 'READ' AND research_run_id IS NOT NULL
      AND case_id IS NOT NULL AND workload_cell IS NOT NULL
      AND adapter_version IS NOT NULL AND normalized_input IS NOT NULL
      AND lab_case IS NOT NULL));

CREATE INDEX provider_runs_lab_cell_idx ON provider_runs
  (tenant_id,capability,workload_cell,provider,recorded_at,id) WHERE synthetic;
CREATE INDEX provider_runs_research_idx ON provider_runs
  (tenant_id,research_run_id,recorded_at,id) WHERE research_run_id IS NOT NULL;

CREATE FUNCTION drowk_provider_run_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ProviderRun history is immutable';
END $$;
CREATE TRIGGER provider_runs_immutable BEFORE UPDATE OR DELETE ON provider_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_provider_run_immutable();

CREATE FUNCTION drowk_research_run_lifecycle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  evidence_ref jsonb;
BEGIN
  IF jsonb_typeof(NEW.output_evidence_ids) <> 'array' THEN
    RAISE EXCEPTION 'ResearchRun evidence IDs must be an array';
  END IF;
  IF TG_OP = 'INSERT' AND (NEW.status <> 'PLANNED' OR
      NEW.started_at IS NOT NULL OR NEW.completed_at IS NOT NULL OR
      jsonb_array_length(NEW.output_evidence_ids) <> 0) THEN
    RAISE EXCEPTION 'ResearchRun must begin PLANNED without evidence';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.started_at IS NULL OR
      (NEW.status = 'RUNNING' AND NEW.completed_at IS NOT NULL) OR
      (NEW.status IN ('SUFFICIENT','EXHAUSTED','BLOCKED','FAILED')
        AND NEW.completed_at IS NULL)) THEN
    RAISE EXCEPTION 'ResearchRun lifecycle timestamps are incomplete';
  END IF;
  IF NEW.status = 'SUFFICIENT' AND jsonb_array_length(NEW.output_evidence_ids) = 0 THEN
    RAISE EXCEPTION 'ResearchRun cannot be sufficient without evidence';
  END IF;
  IF NEW.status = 'SUFFICIENT' THEN
    FOR evidence_ref IN SELECT value FROM jsonb_array_elements(NEW.output_evidence_ids) LOOP
      IF jsonb_typeof(evidence_ref) <> 'string' OR NOT EXISTS (
        SELECT 1 FROM evidence WHERE tenant_id=NEW.tenant_id
          AND id=(evidence_ref #>> '{}')::uuid) THEN
        RAISE EXCEPTION 'ResearchRun evidence is missing in tenant';
      END IF;
    END LOOP;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status NOT IN ('PLANNED','RUNNING') OR
      (OLD.status = 'PLANNED' AND NEW.status <> 'RUNNING') OR
      (OLD.status = 'RUNNING' AND NEW.status NOT IN
        ('RUNNING','SUFFICIENT','EXHAUSTED','BLOCKED','FAILED')) OR
      (OLD.id,OLD.tenant_id,OLD.run_id,OLD.correlation_id,OLD.question,OLD.question_contract,OLD.recorded_at)
        IS DISTINCT FROM
      (NEW.id,NEW.tenant_id,NEW.run_id,NEW.correlation_id,NEW.question,NEW.question_contract,NEW.recorded_at) THEN
      RAISE EXCEPTION 'Invalid ResearchRun transition or immutable field change';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER research_runs_lifecycle BEFORE INSERT OR UPDATE ON research_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_research_run_lifecycle();
CREATE FUNCTION drowk_research_run_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ResearchRun history cannot be deleted';
END $$;
CREATE TRIGGER research_runs_no_delete BEFORE DELETE ON research_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_research_run_no_delete();

-- Serialize synthetic inserts against lifecycle transitions and other calls.
CREATE FUNCTION drowk_synthetic_provider_budget() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent research_runs%ROWTYPE;
  prior_calls integer;
  prior_cost numeric;
  charge numeric;
BEGIN
  IF NOT NEW.synthetic THEN RETURN NEW; END IF;
  SELECT * INTO parent FROM research_runs
    WHERE tenant_id=NEW.tenant_id AND id=NEW.research_run_id FOR UPDATE;
  IF NOT FOUND OR parent.status <> 'RUNNING' OR
     parent.run_id <> NEW.run_id OR parent.correlation_id <> NEW.correlation_id THEN
    RAISE EXCEPTION 'Synthetic ProviderRun requires matching running ResearchRun';
  END IF;
  IF NEW.estimated_cost_usd_micros IS NULL THEN
    RAISE EXCEPTION 'Synthetic call requires a budget estimate';
  END IF;
  SELECT count(*),coalesce(sum(greatest(actual_cost_usd_micros,estimated_cost_usd_micros)),0)
    INTO prior_calls,prior_cost FROM provider_runs
    WHERE tenant_id=NEW.tenant_id AND research_run_id=NEW.research_run_id AND synthetic;
  charge := greatest(NEW.actual_cost_usd_micros,NEW.estimated_cost_usd_micros);
  IF prior_calls >= (parent.question_contract->>'maxToolCalls')::integer OR
     prior_cost + charge > (parent.question_contract->>'maxCostUsdMicros')::numeric THEN
    RAISE EXCEPTION 'Synthetic ResearchRun budget exhausted';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER provider_runs_synthetic_budget BEFORE INSERT ON provider_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_synthetic_provider_budget();
