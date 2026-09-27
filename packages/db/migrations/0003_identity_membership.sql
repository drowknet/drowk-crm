-- Provider-neutral identity. No credentials, sessions, roles or implicit provisioning.
CREATE TABLE users (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL UNIQUE CHECK (actor_id <> id),
  display_name text,
  recorded_at timestamptz NOT NULL DEFAULT current_timestamp
);

CREATE TABLE auth_identities (
  issuer text NOT NULL CHECK (length(btrim(issuer)) > 0),
  subject text NOT NULL CHECK (length(btrim(subject)) > 0),
  user_id uuid NOT NULL REFERENCES users(id),
  email text,
  recorded_at timestamptz NOT NULL DEFAULT current_timestamp,
  PRIMARY KEY (issuer, subject)
);

CREATE TABLE tenant_memberships (
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  recorded_at timestamptz NOT NULL DEFAULT current_timestamp,
  created_actor_id uuid NOT NULL,
  created_run_id uuid NOT NULL,
  created_correlation_id uuid NOT NULL,
  created_policy_version text NOT NULL CHECK (length(btrim(created_policy_version)) > 0),
  revoked_at timestamptz,
  revoked_actor_id uuid,
  revoked_run_id uuid,
  revoked_correlation_id uuid,
  revoked_policy_version text,
  PRIMARY KEY (tenant_id, user_id),
  CHECK (
    (status = 'ACTIVE' AND revoked_at IS NULL AND revoked_actor_id IS NULL
      AND revoked_run_id IS NULL AND revoked_correlation_id IS NULL AND revoked_policy_version IS NULL)
    OR (status = 'REVOKED' AND revoked_at IS NOT NULL AND revoked_actor_id IS NOT NULL
      AND revoked_run_id IS NOT NULL AND revoked_correlation_id IS NOT NULL
      AND revoked_policy_version IS NOT NULL AND length(btrim(revoked_policy_version)) > 0)
  )
);
