\set ON_ERROR_STOP on

BEGIN;

INSERT INTO tenants (id, slug, name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'tenant-a', 'Tenant A'),
  ('00000000-0000-0000-0000-000000000002', 'tenant-b', 'Tenant B');

INSERT INTO accounts (id, tenant_id, name)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Account A'
);

INSERT INTO facilities (id, tenant_id, account_id, name)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Facility A'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO facilities (id, tenant_id, account_id, name)
    VALUES (
      '20000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000002',
      '10000000-0000-0000-0000-000000000001',
      'Illegal cross-tenant facility'
    );
    RAISE EXCEPTION 'cross-tenant Facility -> Account link unexpectedly succeeded';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;
END
$$;

INSERT INTO source_observations (
  id,
  tenant_id,
  run_id,
  correlation_id,
  source_system,
  source_native_id,
  retrieved_at,
  ingested_at,
  adapter_version,
  fingerprint
)
VALUES (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000001',
  'TEST',
  'source-a',
  current_timestamp,
  current_timestamp,
  'test-1',
  'sha256:test-observation'
);

INSERT INTO evidence (
  id,
  tenant_id,
  run_id,
  correlation_id,
  observation_id,
  subject_entity_type,
  candidate_key,
  claim,
  value_json,
  trust_state
)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'ACCOUNT',
  'candidate-a',
  'test.claim',
  '{"value":"ok"}'::jsonb,
  'CLAIMED'
);

DO $$
BEGIN
  BEGIN
    INSERT INTO evidence (
      id,
      tenant_id,
      run_id,
      correlation_id,
      observation_id,
      subject_entity_type,
      candidate_key,
      claim,
      value_json,
      trust_state
    )
    VALUES (
      '40000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000002',
      '41000000-0000-0000-0000-000000000002',
      '42000000-0000-0000-0000-000000000002',
      '30000000-0000-0000-0000-000000000001',
      'ACCOUNT',
      'candidate-b',
      'test.cross_tenant_claim',
      '{"value":"must-fail"}'::jsonb,
      'CLAIMED'
    );
    RAISE EXCEPTION 'cross-tenant Evidence -> SourceObservation link unexpectedly succeeded';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;
END
$$;

INSERT INTO approvals (
  id,
  tenant_id,
  actor_id,
  action,
  target_ref,
  payload_digest,
  policy_version,
  status,
  expires_at
)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '51000000-0000-0000-0000-000000000001',
  'TEST_ACTION',
  'target-a',
  'sha256:test-payload',
  'test-policy-v1',
  'APPROVED',
  current_timestamp + interval '1 hour'
);

INSERT INTO action_attempts (
  id,
  tenant_id,
  run_id,
  correlation_id,
  action,
  target_ref,
  payload_digest,
  approval_id,
  idempotency_digest,
  state,
  attempted_at
)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '61000000-0000-0000-0000-000000000001',
  '62000000-0000-0000-0000-000000000001',
  'TEST_ACTION',
  'target-a',
  'sha256:test-payload',
  '50000000-0000-0000-0000-000000000001',
  'sha256:test-idempotency',
  'PREPARED',
  current_timestamp
);

DO $$
BEGIN
  BEGIN
    INSERT INTO action_attempts (
      id,
      tenant_id,
      run_id,
      correlation_id,
      action,
      target_ref,
      payload_digest,
      approval_id,
      idempotency_digest,
      state,
      attempted_at
    )
    VALUES (
      '60000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000002',
      '61000000-0000-0000-0000-000000000002',
      '62000000-0000-0000-0000-000000000002',
      'TEST_ACTION',
      'target-b',
      'sha256:test-payload-b',
      '50000000-0000-0000-0000-000000000001',
      'sha256:test-idempotency-b',
      'PREPARED',
      current_timestamp
    );
    RAISE EXCEPTION 'cross-tenant ActionAttempt -> Approval link unexpectedly succeeded';
  EXCEPTION
    WHEN foreign_key_violation THEN
      NULL;
  END;
END
$$;

ROLLBACK;
