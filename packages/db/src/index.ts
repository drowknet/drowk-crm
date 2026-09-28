import type {
  Account,
  AccountId,
  Evidence,
  EvidenceId,
  Facility,
  FacilityId,
  IsoDateTime,
  ObservationId,
  SourceObservation,
  TenantId,
} from "@drowk/contracts";
import pg, { type Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
export { applyMigrations, defaultMigrationsDirectory, MigrationError, migrationStatus } from "./migrations.js";
export type { MigrationStatus } from "./migrations.js";
export { PostgresIdentityRepository } from "./auth.js";
export { PostgresHumanContinuityRepository } from "./human-continuity.js";
export type { ContactLinkResult } from "./human-continuity.js";

type Connection = Pool | PoolClient;

type AccountRow = QueryResultRow & {
  id: AccountId;
  tenant_id: TenantId;
  name: string;
  status: Account["status"];
  recorded_at: string;
  supersedes_id: AccountId | null;
};

type FacilityRow = QueryResultRow & {
  id: FacilityId;
  tenant_id: TenantId;
  account_id: AccountId | null;
  name: string;
  address_text: string | null;
  effective_at: string | null;
  recorded_at: string;
  supersedes_id: FacilityId | null;
};

type ObservationRow = QueryResultRow & {
  id: ObservationId;
  tenant_id: TenantId;
  run_id: SourceObservation["runId"];
  correlation_id: SourceObservation["correlationId"];
  source_system: string;
  source_native_id: string;
  source_revision: string | null;
  observed_at: string | null;
  effective_at: string | null;
  retrieved_at: string;
  ingested_at: string;
  recorded_at: string;
  source_watermark: string | null;
  adapter_version: string;
  fingerprint: SourceObservation["fingerprint"];
  raw_artifact_ref: string | null;
  source_metadata: Record<string, unknown>;
};

type EvidenceRow = QueryResultRow & {
  id: EvidenceId;
  tenant_id: TenantId;
  run_id: Evidence["runId"];
  correlation_id: Evidence["correlationId"];
  observation_id: ObservationId;
  subject_entity_type: string;
  subject_entity_id: Evidence["subject"]["entityId"];
  candidate_key: string | null;
  claim: string;
  value_json: Evidence["value"];
  trust_state: Evidence["trust"];
  observed_at: string | null;
  effective_at: string | null;
  retrieved_at: string | null;
  recorded_at: string;
  expires_at: string | null;
  rights_class: string | null;
  supersedes_id: EvidenceId | null;
};

// Keep PostgreSQL's microsecond fraction; the default pg Date parser truncates it.
const timestampTypes = {
  getTypeParser: (oid: number, format?: "text" | "binary") =>
    oid === 1184 && format !== "binary"
      ? (value: string) => value
      : pg.types.getTypeParser(oid, format),
};

function query<Row extends QueryResultRow>(
  connection: Connection,
  sql: string,
  values: unknown[],
): Promise<QueryResult<Row>> {
  return connection.query<Row>({ text: sql, values, types: timestampTypes });
}

function iso(value: string): IsoDateTime {
  const normalized = value.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const instant = new Date(normalized);
  if (Number.isNaN(instant.getTime())) throw new Error(`Invalid PostgreSQL timestamp: ${value}`);
  const microseconds = /\.(\d{1,6})(?:Z|[+-]\d{2}:\d{2})$/.exec(normalized)?.[1] ?? "";
  const fraction = microseconds.padEnd(6, "0").replace(/0+$/, "").padEnd(3, "0");
  return `${instant.toISOString().slice(0, 19)}.${fraction}Z` as IsoDateTime;
}

const optionalIso = (value: string | null): IsoDateTime | null =>
  value === null ? null : iso(value);

function accountFrom(row: AccountRow): Account {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    status: row.status,
    recordedAt: iso(row.recorded_at),
    supersedesId: row.supersedes_id,
  };
}

function facilityFrom(row: FacilityRow): Facility {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    accountId: row.account_id,
    name: row.name,
    addressText: row.address_text,
    effectiveAt: optionalIso(row.effective_at),
    recordedAt: iso(row.recorded_at),
    supersedesId: row.supersedes_id,
  };
}

function observationFrom(row: ObservationRow): SourceObservation {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    runId: row.run_id,
    correlationId: row.correlation_id,
    sourceSystem: row.source_system,
    sourceNativeId: row.source_native_id,
    sourceRevision: row.source_revision,
    observedAt: optionalIso(row.observed_at),
    effectiveAt: optionalIso(row.effective_at),
    retrievedAt: iso(row.retrieved_at),
    ingestedAt: iso(row.ingested_at),
    recordedAt: iso(row.recorded_at),
    sourceWatermark: row.source_watermark,
    adapterVersion: row.adapter_version,
    fingerprint: row.fingerprint,
    rawArtifactRef: row.raw_artifact_ref,
    sourceMetadata: row.source_metadata,
  };
}

function evidenceFrom(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    runId: row.run_id,
    correlationId: row.correlation_id,
    observationId: row.observation_id,
    subject: {
      entityType: row.subject_entity_type,
      entityId: row.subject_entity_id,
      candidateKey: row.candidate_key,
    },
    claim: row.claim,
    value: row.value_json,
    trust: row.trust_state,
    observedAt: optionalIso(row.observed_at),
    effectiveAt: optionalIso(row.effective_at),
    retrievedAt: optionalIso(row.retrieved_at),
    recordedAt: iso(row.recorded_at),
    expiresAt: optionalIso(row.expires_at),
    rightsClass: row.rights_class,
    supersedesId: row.supersedes_id,
  };
}

export type AppendObservationResult =
  | { status: "inserted"; observation: SourceObservation }
  | { status: "already_exists"; observation: SourceObservation }
  | { status: "fingerprint_conflict"; observation: SourceObservation }
  | { status: "id_conflict" };

/** Every repository method receives tenant scope; callers must authorize it separately. */
export class PostgresRepositories {
  constructor(private readonly connection: Connection) {}

  async createAccount(tenantId: TenantId, account: Omit<Account, "tenantId">): Promise<Account> {
    const result = await query<AccountRow>(this.connection,
      `INSERT INTO accounts (id, tenant_id, name, status, recorded_at, supersedes_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [account.id, tenantId, account.name, account.status, account.recordedAt, account.supersedesId],
    );
    return accountFrom(result.rows[0]!);
  }

  async getAccount(tenantId: TenantId, accountId: AccountId): Promise<Account | null> {
    const result = await query<AccountRow>(this.connection,
      `SELECT * FROM accounts WHERE tenant_id = $1 AND id = $2`,
      [tenantId, accountId],
    );
    return result.rows[0] ? accountFrom(result.rows[0]) : null;
  }

  async createFacility(tenantId: TenantId, facility: Omit<Facility, "tenantId">): Promise<Facility> {
    const result = await query<FacilityRow>(this.connection,
      `INSERT INTO facilities
         (id, tenant_id, account_id, name, address_text, effective_at, recorded_at, supersedes_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [facility.id, tenantId, facility.accountId, facility.name, facility.addressText,
        facility.effectiveAt, facility.recordedAt, facility.supersedesId],
    );
    return facilityFrom(result.rows[0]!);
  }

  async getFacility(tenantId: TenantId, facilityId: FacilityId): Promise<Facility | null> {
    const result = await query<FacilityRow>(this.connection,
      `SELECT * FROM facilities WHERE tenant_id = $1 AND id = $2`,
      [tenantId, facilityId],
    );
    return result.rows[0] ? facilityFrom(result.rows[0]) : null;
  }

  async listFacilitiesForAccount(tenantId: TenantId, accountId: AccountId): Promise<Facility[]> {
    const result = await query<FacilityRow>(this.connection,
      `SELECT * FROM facilities WHERE tenant_id = $1 AND account_id = $2 ORDER BY recorded_at, id`,
      [tenantId, accountId],
    );
    return result.rows.map(facilityFrom);
  }

  async appendObservation(
    tenantId: TenantId,
    observation: Omit<SourceObservation, "tenantId">,
  ): Promise<AppendObservationResult> {
    const result = await query<ObservationRow>(this.connection,
      `INSERT INTO source_observations
         (id, tenant_id, run_id, correlation_id, source_system, source_native_id,
          source_revision, observed_at, effective_at, retrieved_at, ingested_at, recorded_at,
          source_watermark, adapter_version, fingerprint, raw_artifact_ref, source_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb)
       ON CONFLICT DO NOTHING RETURNING *`,
      [observation.id, tenantId, observation.runId, observation.correlationId,
        observation.sourceSystem, observation.sourceNativeId, observation.sourceRevision,
        observation.observedAt, observation.effectiveAt, observation.retrievedAt,
        observation.ingestedAt, observation.recordedAt, observation.sourceWatermark,
        observation.adapterVersion, observation.fingerprint, observation.rawArtifactRef,
        JSON.stringify(observation.sourceMetadata)],
    );
    if (result.rows[0]) return { status: "inserted", observation: observationFrom(result.rows[0]) };

    const existing = await this.findObservationBySourceIdentity(
      tenantId, observation.sourceSystem, observation.sourceNativeId, observation.sourceRevision,
    );
    if (!existing) return { status: "id_conflict" };
    const existingId = await this.getObservation(tenantId, observation.id);
    if (existingId && existingId.id !== existing.id) {
      return { status: "id_conflict" };
    }
    return existing.fingerprint === observation.fingerprint
      ? { status: "already_exists", observation: existing }
      : { status: "fingerprint_conflict", observation: existing };
  }

  async getObservation(tenantId: TenantId, observationId: ObservationId): Promise<SourceObservation | null> {
    const result = await query<ObservationRow>(this.connection,
      `SELECT * FROM source_observations WHERE tenant_id = $1 AND id = $2`,
      [tenantId, observationId],
    );
    return result.rows[0] ? observationFrom(result.rows[0]) : null;
  }

  async findObservationBySourceIdentity(
    tenantId: TenantId,
    sourceSystem: string,
    sourceNativeId: string,
    sourceRevision: string | null,
  ): Promise<SourceObservation | null> {
    const result = await query<ObservationRow>(this.connection,
      `SELECT * FROM source_observations
       WHERE tenant_id = $1 AND source_system = $2 AND source_native_id = $3
         AND source_revision IS NOT DISTINCT FROM $4::text`,
      [tenantId, sourceSystem, sourceNativeId, sourceRevision],
    );
    return result.rows[0] ? observationFrom(result.rows[0]) : null;
  }

  async appendEvidence(tenantId: TenantId, evidence: Omit<Evidence, "tenantId">): Promise<Evidence> {
    const result = await query<EvidenceRow>(this.connection,
      `INSERT INTO evidence
         (id, tenant_id, run_id, correlation_id, observation_id, subject_entity_type,
          subject_entity_id, candidate_key, claim, value_json, trust_state, observed_at,
          effective_at, retrieved_at, recorded_at, expires_at, rights_class, supersedes_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING *`,
      [evidence.id, tenantId, evidence.runId, evidence.correlationId, evidence.observationId,
        evidence.subject.entityType, evidence.subject.entityId, evidence.subject.candidateKey,
        evidence.claim, JSON.stringify(evidence.value), evidence.trust, evidence.observedAt,
        evidence.effectiveAt, evidence.retrievedAt, evidence.recordedAt, evidence.expiresAt,
        evidence.rightsClass, evidence.supersedesId],
    );
    return evidenceFrom(result.rows[0]!);
  }

  async getEvidence(tenantId: TenantId, evidenceId: EvidenceId): Promise<Evidence | null> {
    const result = await query<EvidenceRow>(this.connection,
      `SELECT * FROM evidence WHERE tenant_id = $1 AND id = $2`,
      [tenantId, evidenceId],
    );
    return result.rows[0] ? evidenceFrom(result.rows[0]) : null;
  }

  async listEvidenceForObservation(tenantId: TenantId, observationId: ObservationId): Promise<Evidence[]> {
    const result = await query<EvidenceRow>(this.connection,
      `SELECT * FROM evidence WHERE tenant_id = $1 AND observation_id = $2 ORDER BY recorded_at, id`,
      [tenantId, observationId],
    );
    return result.rows.map(evidenceFrom);
  }
}

/** All SQL in a callback uses one client. Never put provider calls inside this callback. */
export async function withTransaction<T>(
  pool: Pool,
  work: (repositories: PostgresRepositories) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await work(new PostgresRepositories(client));
    await client.query("COMMIT");
    return value;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      throw new AggregateError([error, rollbackError], "Transaction and rollback both failed");
    }
    throw error;
  } finally {
    client.release();
  }
}
