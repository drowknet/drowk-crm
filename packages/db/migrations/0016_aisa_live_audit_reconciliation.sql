-- DCRM-05C correction: direct-SQL audit parity and an irreversible UNKNOWN claim.
CREATE FUNCTION drowk_aisa_status_codes_valid(codes jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE field record; number_value numeric;
BEGIN
  IF codes IS NULL THEN RETURN true; END IF;
  IF jsonb_typeof(codes) IS DISTINCT FROM 'object' THEN RETURN false; END IF;
  FOR field IN SELECT key,value FROM jsonb_each(codes) LOOP
    IF field.key NOT IN ('http','provider','task','tasksError') THEN RETURN false; END IF;
    IF jsonb_typeof(field.value)='null' THEN CONTINUE; END IF;
    IF jsonb_typeof(field.value) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
    number_value := (field.value #>> '{}')::numeric;
    IF number_value <> trunc(number_value) OR number_value < 0 OR
       number_value > 2147483647 THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;

ALTER TABLE provider_runs ADD CONSTRAINT provider_runs_aisa_audit_parity CHECK (
  transport IS DISTINCT FROM 'aisa' OR (
    result_state IN ('PRESENT','EMPTY_WITHIN_RESPONSE','ERROR') AND
    (result_state='ERROR') = (safe_error_category IS NOT NULL) AND
    (safe_error_category IS NULL OR safe_error_category IN
      ('HTTP_AUTH','HTTP_PAYMENT','HTTP_RATE','HTTP_SERVER','HTTP_OTHER',
       'TIMEOUT','NETWORK','PROVIDER_STATUS','TASK_STATUS','SCHEMA',
       'MIXED_RESPONSE','COST_ENVELOPE')) AND
    (actual_cost_usd_micros IS NULL OR actual_cost_usd_micros <= 15000 OR
      (result_state='ERROR' AND safe_error_category='COST_ENVELOPE')) AND
    drowk_aisa_status_codes_valid(safe_status_codes)
  ));

ALTER TABLE research_runs ADD COLUMN live_dispatch_state text NULL;
UPDATE research_runs r SET live_dispatch_state=CASE
  WHEN EXISTS (SELECT 1 FROM provider_runs p WHERE p.tenant_id=r.tenant_id
    AND p.research_run_id=r.id AND p.transport='aisa') THEN 'RECORDED'
  ELSE 'UNKNOWN' END
WHERE r.live_dispatch_claimed_at IS NOT NULL;
ALTER TABLE research_runs ADD CONSTRAINT research_runs_aisa_dispatch_state CHECK (
  (live_dispatch_claimed_at IS NULL AND live_dispatch_state IS NULL) OR
  (live_dispatch_claimed_at IS NOT NULL AND live_dispatch_state IN ('UNKNOWN','RECORDED')));

CREATE FUNCTION drowk_aisa_dispatch_state_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.live_dispatch_state IS NOT NULL THEN
      RAISE EXCEPTION 'Live dispatch state cannot be inserted';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.live_dispatch_claimed_at IS NULL AND NEW.live_dispatch_claimed_at IS NOT NULL THEN
    IF NEW.live_dispatch_state IS DISTINCT FROM 'UNKNOWN' THEN
      RAISE EXCEPTION 'New live claim must begin UNKNOWN';
    END IF;
  ELSIF OLD.live_dispatch_state IS DISTINCT FROM NEW.live_dispatch_state THEN
    IF OLD.live_dispatch_state IS DISTINCT FROM 'UNKNOWN' OR
       NEW.live_dispatch_state IS DISTINCT FROM 'RECORDED' OR
       NEW.status NOT IN ('EXHAUSTED','FAILED') OR
       NOT EXISTS (SELECT 1 FROM provider_runs p WHERE p.tenant_id=NEW.tenant_id
         AND p.research_run_id=NEW.id AND p.transport='aisa') THEN
      RAISE EXCEPTION 'Invalid live dispatch state transition';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER research_runs_aisa_dispatch_state BEFORE INSERT OR UPDATE ON research_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_aisa_dispatch_state_guard();

CREATE TABLE aisa_live_dispatch_reconciliations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  research_run_id uuid NOT NULL,
  reviewed_at timestamptz NOT NULL,
  actor_ref uuid NOT NULL,
  evidence_digest text NOT NULL CHECK (evidence_digest ~ '^sha256:[0-9a-f]{64}$'),
  outcome text NOT NULL CHECK (outcome IN ('UNKNOWN_AFTER_REVIEW','CONFIRMED_NO_DISPATCH')),
  UNIQUE (tenant_id,research_run_id),
  FOREIGN KEY (tenant_id,research_run_id) REFERENCES research_runs(tenant_id,id)
);
CREATE FUNCTION drowk_aisa_reconciliation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE parent research_runs%ROWTYPE;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'Live reconciliation history is immutable';
  END IF;
  SELECT * INTO parent FROM research_runs WHERE tenant_id=NEW.tenant_id
    AND id=NEW.research_run_id FOR UPDATE;
  IF NOT FOUND OR parent.live_dispatch_state IS DISTINCT FROM 'UNKNOWN' OR
     parent.status IS DISTINCT FROM 'BLOCKED' OR
     EXISTS (SELECT 1 FROM provider_runs p WHERE p.tenant_id=NEW.tenant_id
       AND p.research_run_id=NEW.research_run_id AND p.transport='aisa'
       AND (p.result_state <> 'ERROR' OR p.safe_error_category NOT IN
         ('TIMEOUT','NETWORK','HTTP_SERVER','HTTP_OTHER','SCHEMA','MIXED_RESPONSE'))) THEN
    RAISE EXCEPTION 'Only a blocked UNKNOWN live dispatch can be reconciled';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER aisa_live_dispatch_reconciliation_guard
  BEFORE INSERT OR UPDATE OR DELETE ON aisa_live_dispatch_reconciliations
  FOR EACH ROW EXECUTE FUNCTION drowk_aisa_reconciliation_guard();
