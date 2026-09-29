-- DCRM-05C pre-live: one durable dispatch claim, bounded audit, no CRM projection.
ALTER TABLE research_runs ADD COLUMN live_dispatch_claimed_at timestamptz NULL;

ALTER TABLE provider_runs
  ADD COLUMN transport text NULL,
  ADD COLUMN provider_task_id text NULL,
  ADD COLUMN provider_cid text NULL,
  ADD COLUMN provider_feature_id text NULL,
  ADD COLUMN safe_summary jsonb NULL,
  ADD COLUMN safe_status_codes jsonb NULL,
  ADD COLUMN safe_error_category text NULL;

ALTER TABLE provider_runs ADD CONSTRAINT provider_runs_aisa_tuple CHECK (
  transport IS NULL OR (
    transport='aisa' AND synthetic=false AND capability='DISCOVER_BUSINESS_LISTINGS'
    AND workload_cell='FACILITY_LOCATION_DISCOVERY' AND provider='dataforseo'
    AND operation='POST /apis/v1/dataforseo/business_data/business_listings/search/live'
    AND interface='AISA_REST' AND access_class='READ'
    AND adapter_version='aisa-dataforseo-business-listings-v1'
    AND research_run_id IS NOT NULL AND estimated_cost_usd_micros IS NOT NULL
    AND estimated_cost_usd_micros <= 15000
    AND case_id='dcrm-05c-fastenal-phoenix-1'
    AND normalized_input='{"title":"Fastenal","location_coordinate":"33.4484,-112.0740,25","limit":5}'::jsonb
    AND rights_class='PUBLIC_BUSINESS_LISTING'
    AND lab_case=jsonb_build_object(
      'caseId',case_id,'capabilityId',capability,'workloadCell',workload_cell,
      'provider',provider,'transport',transport,'operation',operation,
      'interface',interface,'accessClass',access_class,'normalizedInput',normalized_input,
      'locale','en-US','geography','US','maxCostUsdMicros',15000,
      'maxToolCalls',1,'stopCondition','EVIDENCE_PRESENT','rightsClass',rights_class,
      'adapterVersion',adapter_version)
  ));
CREATE UNIQUE INDEX provider_runs_aisa_one_per_research_uq
  ON provider_runs(tenant_id,research_run_id) WHERE transport='aisa';

CREATE FUNCTION drowk_aisa_claim_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  contract jsonb;
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.live_dispatch_claimed_at IS NOT NULL THEN
      RAISE EXCEPTION 'Live dispatch cannot be claimed at ResearchRun creation';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.live_dispatch_claimed_at IS NOT NULL AND
     NEW.live_dispatch_claimed_at IS DISTINCT FROM OLD.live_dispatch_claimed_at THEN
    RAISE EXCEPTION 'Live dispatch claim is immutable';
  END IF;
  IF OLD.live_dispatch_claimed_at IS NULL AND NEW.live_dispatch_claimed_at IS NOT NULL THEN
    contract := NEW.question_contract;
    IF NEW.status <> 'RUNNING' OR
       jsonb_typeof(contract) IS DISTINCT FROM 'object' OR
       jsonb_typeof(contract->'maxCostUsdMicros') IS DISTINCT FROM 'number' OR
       jsonb_typeof(contract->'maxToolCalls') IS DISTINCT FROM 'number' OR
       (contract->>'maxCostUsdMicros')::numeric <> 15000 OR
       (contract->>'maxToolCalls')::numeric <> 1 OR
       contract->>'stopCondition' IS DISTINCT FROM 'EVIDENCE_PRESENT' OR
       jsonb_typeof(contract->'allowedCapabilities') IS DISTINCT FROM 'array' OR
       NOT (contract->'allowedCapabilities' ? 'DISCOVER_BUSINESS_LISTINGS') OR
       EXISTS (SELECT 1 FROM provider_runs p WHERE p.tenant_id=NEW.tenant_id
         AND p.research_run_id=NEW.id) THEN
      RAISE EXCEPTION 'Live dispatch requires the exact bounded ResearchRun';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER research_runs_aisa_claim BEFORE INSERT OR UPDATE ON research_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_aisa_claim_guard();

CREATE FUNCTION drowk_aisa_provider_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  parent research_runs%ROWTYPE;
  item jsonb;
  address jsonb;
  field record;
BEGIN
  IF NEW.transport IS DISTINCT FROM 'aisa' THEN RETURN NEW; END IF;
  SELECT * INTO parent FROM research_runs WHERE tenant_id=NEW.tenant_id
    AND id=NEW.research_run_id FOR UPDATE;
  IF NOT FOUND OR parent.status <> 'RUNNING' OR
     parent.live_dispatch_claimed_at IS NULL OR
     parent.run_id <> NEW.run_id OR parent.correlation_id <> NEW.correlation_id THEN
    RAISE EXCEPTION 'Live ProviderRun requires a matching claimed ResearchRun';
  END IF;
  IF NEW.result_state IN ('PENDING','UNKNOWN','PARTIAL') THEN
    RAISE EXCEPTION 'Selected synchronous operation has no proven pending/unknown/partial mapping';
  END IF;
  IF NEW.safe_summary IS NOT NULL THEN
    IF jsonb_typeof(NEW.safe_summary) <> 'object' OR
       (SELECT count(*) FROM jsonb_object_keys(NEW.safe_summary) key
         WHERE key <> 'businesses') > 0 OR
       jsonb_typeof(NEW.safe_summary->'businesses') <> 'array' THEN
      RAISE EXCEPTION 'Unsafe live summary shape';
    END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(NEW.safe_summary->'businesses') LOOP
      IF jsonb_typeof(item) <> 'object' OR EXISTS (
        SELECT 1 FROM jsonb_object_keys(item) key
        WHERE key NOT IN ('title','category','address','domain','latitude',
          'longitude','rating','cid','feature_id')) OR
         jsonb_typeof(item->'title') IS DISTINCT FROM 'string' THEN
        RAISE EXCEPTION 'Unsafe live business summary field';
      END IF;
      FOR field IN SELECT key,value FROM jsonb_each(item) LOOP
        IF field.key='address' THEN
          address := field.value;
          IF jsonb_typeof(address)='object' THEN
            IF EXISTS (SELECT 1 FROM jsonb_each(address) part
              WHERE part.key NOT IN ('address','city','region','postal_code','country_code')
                 OR jsonb_typeof(part.value) <> 'string') THEN
              RAISE EXCEPTION 'Unsafe live address';
            END IF;
          ELSIF jsonb_typeof(address) <> 'string' THEN
            RAISE EXCEPTION 'Unsafe live address';
          END IF;
        ELSIF field.key IN ('latitude','longitude','rating') THEN
          IF jsonb_typeof(field.value) <> 'number' THEN
            RAISE EXCEPTION 'Unsafe live numeric field';
          END IF;
        ELSIF jsonb_typeof(field.value) <> 'string' THEN
          RAISE EXCEPTION 'Unsafe live text field';
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER provider_runs_aisa_guard BEFORE INSERT ON provider_runs
  FOR EACH ROW EXECUTE FUNCTION drowk_aisa_provider_guard();
