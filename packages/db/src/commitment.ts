import type {
  ActivityId, Commitment, CommitmentId, EvidenceId, IsoDate, IsoDateTime,
  ObservationId, TenantId,
} from "@drowk/contracts";
import { createHash } from "node:crypto";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type CommitmentRow = QueryResultRow & {
  id: CommitmentId; tenant_id: TenantId; commitment_key: string;
  kind: Commitment["kind"]; state: Commitment["state"]; statement: string;
  source_activity_id: ActivityId; source_observation_id: ObservationId;
  account_id: Commitment["accountId"]; facility_id: Commitment["facilityId"];
  counterparty_person_id: Commitment["counterpartyPersonId"];
  owed_by: Commitment["owedBy"]; due_date: IsoDate | null;
  condition_text: string | null; recorded_at: string;
  promotion_policy_decision_id: string; accepted_payload_digest: string;
  supersedes_id: CommitmentId | null;
};
const timestampTypes = {
  getTypeParser: (oid: number, format?: "text" | "binary") =>
    format !== "binary" && (oid === 1184 || oid === 1082)
      ? (value: string) => value : pg.types.getTypeParser(oid, format),
};
function query<Row extends QueryResultRow>(connection: Connection, sql: string, values: unknown[]) {
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
function payloadDigest(value: Omit<Commitment, "tenantId">): string {
  return createHash("sha256").update(JSON.stringify([
    value.kind, value.state, value.statement, value.sourceActivityId,
    [...value.evidenceIds].sort(), value.accountId, value.facilityId,
    value.counterpartyPersonId, value.owedBy, value.dueDate, value.conditionText,
    value.promotionPolicyDecisionId, value.supersedesId,
  ])).digest("hex");
}
function validDate(dueDate: IsoDate | null): boolean {
  if (dueDate === null) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return false;
  const date = new Date(`${dueDate}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dueDate;
}
export class CommitmentPromotionError extends Error {
  constructor(readonly code: string) { super(code); this.name = "CommitmentPromotionError"; }
}
export type AcceptedCommitmentResult =
  | { status: "inserted" | "already_exists"; commitment: Commitment }
  | { status: "source_conflict"; commitment: Commitment };

/** Tenant authorization belongs to the caller; this boundary proves source authority. */
export class PostgresCommitmentRepository {
  constructor(private readonly pool: Pool) {}

  private async evidenceIds(connection: Connection, tenantId: TenantId,
    commitmentId: CommitmentId): Promise<EvidenceId[]> {
    const result = await query<QueryResultRow & { evidence_id: EvidenceId }>(connection,
      `SELECT evidence_id FROM commitment_evidence WHERE tenant_id=$1 AND commitment_id=$2
       ORDER BY evidence_id`, [tenantId, commitmentId]);
    return result.rows.map(row => row.evidence_id);
  }
  private async fromRow(connection: Connection, row: CommitmentRow): Promise<Commitment> {
    return {
      id: row.id, tenantId: row.tenant_id, commitmentKey: row.commitment_key,
      kind: row.kind, state: row.state, statement: row.statement,
      sourceActivityId: row.source_activity_id,
      evidenceIds: await this.evidenceIds(connection, row.tenant_id, row.id),
      accountId: row.account_id, facilityId: row.facility_id,
      counterpartyPersonId: row.counterparty_person_id, owedBy: row.owed_by,
      dueDate: row.due_date, conditionText: row.condition_text,
      recordedAt: iso(row.recorded_at),
      promotionPolicyDecisionId: row.promotion_policy_decision_id,
      supersedesId: row.supersedes_id,
    };
  }
  async getCommitment(tenantId: TenantId, id: CommitmentId): Promise<Commitment | null> {
    const result = await query<CommitmentRow>(this.pool,
      `SELECT * FROM commitments WHERE tenant_id=$1 AND id=$2`, [tenantId, id]);
    return result.rows[0] ? this.fromRow(this.pool, result.rows[0]) : null;
  }
  private async list(tenantId: TenantId, column: "source_activity_id" | "counterparty_person_id" | "account_id",
    id: string): Promise<Commitment[]> {
    const result = await query<CommitmentRow>(this.pool,
      `SELECT * FROM commitments WHERE tenant_id=$1 AND ${column}=$2 ORDER BY recorded_at,id`,
      [tenantId, id]);
    return Promise.all(result.rows.map(row => this.fromRow(this.pool, row)));
  }
  listForActivity(tenantId: TenantId, activityId: ActivityId): Promise<Commitment[]> {
    return this.list(tenantId, "source_activity_id", activityId);
  }
  listForPerson(tenantId: TenantId, personId: NonNullable<Commitment["counterpartyPersonId"]>): Promise<Commitment[]> {
    return this.list(tenantId, "counterparty_person_id", personId);
  }
  listForAccount(tenantId: TenantId, accountId: NonNullable<Commitment["accountId"]>): Promise<Commitment[]> {
    return this.list(tenantId, "account_id", accountId);
  }
  listEvidenceIdsForCommitment(tenantId: TenantId, id: CommitmentId): Promise<EvidenceId[]> {
    return this.evidenceIds(this.pool, tenantId, id);
  }

  async promoteCommitment(tenantId: TenantId,
    value: Omit<Commitment, "tenantId">): Promise<AcceptedCommitmentResult> {
    if (value.evidenceIds.length === 0 || new Set(value.evidenceIds).size !== value.evidenceIds.length) {
      throw new CommitmentPromotionError("EVIDENCE_REQUIRED_OR_DUPLICATED");
    }
    if (!validDate(value.dueDate)) throw new CommitmentPromotionError("DUE_DATE_INVALID");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const activity = await query<QueryResultRow & { source_observation_id: ObservationId }>(client,
        `SELECT source_observation_id FROM activities WHERE tenant_id=$1 AND id=$2`,
        [tenantId, value.sourceActivityId]);
      const observationId = activity.rows[0]?.source_observation_id;
      if (!observationId) throw new CommitmentPromotionError("SOURCE_ACTIVITY_MISSING");
      const policy = await query(client,
        `SELECT id FROM policy_decisions WHERE tenant_id=$1 AND id=$2 AND subject_id=$3
         AND action='ACCEPT_COMMITMENT' AND disposition='ALLOW' AND evidence_complete=true`,
        [tenantId, value.promotionPolicyDecisionId, value.sourceActivityId]);
      if (!policy.rows[0]) throw new CommitmentPromotionError("PROMOTION_POLICY_NOT_ALLOWED");
      const evidence = await query<QueryResultRow & { evidence_id: EvidenceId }>(client,
        `SELECT evidence_id FROM activity_evidence WHERE tenant_id=$1 AND activity_id=$2
         AND evidence_id=ANY($3::uuid[])`, [tenantId, value.sourceActivityId, value.evidenceIds]);
      if (evidence.rows.length !== value.evidenceIds.length) {
        throw new CommitmentPromotionError("ATTRIBUTABLE_EVIDENCE_MISSING");
      }
      // Replay of accepted history remains stable after its participant is corrected.
      const replay = await query<CommitmentRow>(client,
        `SELECT * FROM commitments WHERE tenant_id=$1 AND commitment_key=$2`,
        [tenantId, value.commitmentKey]);
      if (replay.rows[0]) {
        const existing = await this.fromRow(client, replay.rows[0]);
        await client.query("COMMIT");
        return replay.rows[0].accepted_payload_digest === payloadDigest(value)
          ? { status: "already_exists", commitment: existing }
          : { status: "source_conflict", commitment: existing };
      }
      let participantId: string | null = null;
      let identityId: string | null = null;
      if (value.counterpartyPersonId !== null) {
        const participant = await query<QueryResultRow & { id: string; identity_id: string }>(client,
          `SELECT p.id,p.identity_id FROM activity_participants p
           WHERE p.tenant_id=$1 AND p.activity_id=$2 AND p.person_id=$3
             AND p.identity_id IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM activity_participants successor
               WHERE successor.tenant_id=p.tenant_id AND successor.supersedes_id=p.id)
           ORDER BY p.recorded_at,p.id LIMIT 1`,
          [tenantId, value.sourceActivityId, value.counterpartyPersonId]);
        if (!participant.rows[0]) throw new CommitmentPromotionError("COUNTERPARTY_NOT_RESOLVED");
        participantId = participant.rows[0].id;
        identityId = participant.rows[0].identity_id;
      }
      const inserted = await query<CommitmentRow>(client,
        `INSERT INTO commitments
          (id,tenant_id,commitment_key,kind,state,statement,source_activity_id,
           source_observation_id,account_id,facility_id,counterparty_person_id,
           counterparty_participant_id,counterparty_identity_id,owed_by,due_date,
           condition_text,recorded_at,promotion_policy_decision_id,
           evidence_count,accepted_payload_digest,supersedes_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         ON CONFLICT DO NOTHING RETURNING *`,
        [value.id, tenantId, value.commitmentKey, value.kind, value.state,
          value.statement, value.sourceActivityId, observationId, value.accountId,
          value.facilityId, value.counterpartyPersonId, participantId, identityId,
          value.owedBy, value.dueDate, value.conditionText, value.recordedAt,
          value.promotionPolicyDecisionId, value.evidenceIds.length,
          payloadDigest(value), value.supersedesId]);
      if (!inserted.rows[0]) {
        const prior = await query<CommitmentRow>(client,
          `SELECT * FROM commitments WHERE tenant_id=$1 AND commitment_key=$2`,
          [tenantId, value.commitmentKey]);
        if (!prior.rows[0]) throw new CommitmentPromotionError("COMMITMENT_ID_CONFLICT");
        const existing = await this.fromRow(client, prior.rows[0]);
        await client.query("COMMIT");
        return prior.rows[0].accepted_payload_digest === payloadDigest(value)
          ? { status: "already_exists", commitment: existing }
          : { status: "source_conflict", commitment: existing };
      }
      for (const evidenceId of value.evidenceIds) {
        await query(client, `INSERT INTO commitment_evidence
          (tenant_id,commitment_id,source_activity_id,source_observation_id,evidence_id,recorded_at)
          VALUES ($1,$2,$3,$4,$5,$6)`,
        [tenantId, value.id, value.sourceActivityId, observationId, evidenceId, value.recordedAt]);
      }
      await client.query("COMMIT");
      const commitment = await this.getCommitment(tenantId, value.id);
      if (!commitment) throw new CommitmentPromotionError("COMMITMENT_MISSING_AFTER_INSERT");
      return { status: "inserted", commitment };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
