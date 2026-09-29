-- DCRM-05A review correction: legacy ResearchRuns may exist, but only a
-- complete bounded 05A contract may authorize a synthetic ProviderRun.
CREATE OR REPLACE FUNCTION drowk_synthetic_provider_budget() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent research_runs%ROWTYPE;
  max_cost numeric;
  max_calls numeric;
  prior_calls bigint;
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
  IF jsonb_typeof(parent.question_contract) IS DISTINCT FROM 'object' OR
     jsonb_typeof(parent.question_contract->'maxCostUsdMicros') IS DISTINCT FROM 'number' OR
     jsonb_typeof(parent.question_contract->'maxToolCalls') IS DISTINCT FROM 'number' OR
     parent.question_contract->>'stopCondition' IS DISTINCT FROM 'EVIDENCE_PRESENT' THEN
    RAISE EXCEPTION 'Synthetic ResearchRun requires a valid 05A budget contract';
  END IF;
  max_cost := (parent.question_contract->>'maxCostUsdMicros')::numeric;
  max_calls := (parent.question_contract->>'maxToolCalls')::numeric;
  IF max_cost < 0 OR max_cost > 9007199254740991 OR max_cost <> trunc(max_cost) OR
     max_calls < 0 OR max_calls > 2147483647 OR max_calls <> trunc(max_calls) THEN
    RAISE EXCEPTION 'Synthetic ResearchRun budget contract is out of range';
  END IF;
  IF NEW.estimated_cost_usd_micros IS NULL THEN
    RAISE EXCEPTION 'Synthetic call requires a budget estimate';
  END IF;
  SELECT count(*),coalesce(sum(greatest(actual_cost_usd_micros,estimated_cost_usd_micros)),0)
    INTO prior_calls,prior_cost FROM provider_runs
    WHERE tenant_id=NEW.tenant_id AND research_run_id=NEW.research_run_id AND synthetic;
  charge := greatest(NEW.actual_cost_usd_micros,NEW.estimated_cost_usd_micros);
  IF prior_calls >= max_calls OR prior_cost + charge > max_cost THEN
    RAISE EXCEPTION 'Synthetic ResearchRun budget exhausted';
  END IF;
  RETURN NEW;
END $$;
