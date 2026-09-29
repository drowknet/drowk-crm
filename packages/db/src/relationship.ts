import type {
  ActivityId, ActivityParticipantId, IdentityId, IsoDateTime, PersonId,
  Relationship, RelationshipId, RelationshipInteraction,
  RelationshipInteractionId, RelationshipInteractionKind, TenantId,
} from "@drowk/contracts";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type RelationshipRow = QueryResultRow & {
  id: RelationshipId; tenant_id: TenantId; person_id: PersonId; recorded_at: string;
};
type InteractionRow = QueryResultRow & {
  id: RelationshipInteractionId; tenant_id: TenantId;
  relationship_id: RelationshipId; activity_id: ActivityId;
  kind: RelationshipInteractionKind;
  authority_participant_id: ActivityParticipantId; authority_identity_id: IdentityId;
  occurred_at: string | null; recorded_at: string;
  promotion_policy_decision_id: string | null;
};
const timestampTypes = {
  getTypeParser: (oid: number, format?: "text" | "binary") =>
    oid === 1184 && format !== "binary"
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
const relationshipFrom = (row: RelationshipRow): Relationship => ({
  id: row.id, tenantId: row.tenant_id, personId: row.person_id,
  recordedAt: iso(row.recorded_at),
});
const interactionFrom = (row: InteractionRow): RelationshipInteraction => ({
  id: row.id, tenantId: row.tenant_id, relationshipId: row.relationship_id,
  activityId: row.activity_id, kind: row.kind,
  authorityParticipantId: row.authority_participant_id,
  authorityIdentityId: row.authority_identity_id,
  occurredAt: row.occurred_at === null ? null : iso(row.occurred_at),
  recordedAt: iso(row.recorded_at),
  promotionPolicyDecisionId: row.promotion_policy_decision_id,
});

export class RelationshipPromotionError extends Error {
  constructor(readonly code: string) { super(code); this.name = "RelationshipPromotionError"; }
}
export type RelationshipClaimResult = {
  status: "inserted" | "already_exists"; relationship: Relationship;
};
export type RelationshipInteractionResult =
  | { status: "inserted" | "already_exists"; interaction: RelationshipInteraction }
  | { status: "source_conflict"; interaction: RelationshipInteraction };
type InteractionInput = Omit<RelationshipInteraction,
  "tenantId" | "authorityParticipantId" | "authorityIdentityId">;

const actionFor = (kind: RelationshipInteractionKind): string | null => {
  switch (kind) {
    case "ACTIVITY": return null;
    case "RECIPROCAL": return "ACCEPT_RELATIONSHIP_INTERACTION_RECIPROCAL";
    case "MEANINGFUL": return "ACCEPT_RELATIONSHIP_INTERACTION_MEANINGFUL";
  }
};
function sameAssertion(existing: RelationshipInteraction, incoming: InteractionInput): boolean {
  return existing.occurredAt === incoming.occurredAt
    && existing.promotionPolicyDecisionId === incoming.promotionPolicyDecisionId;
}

/** Tenant scope is supplied by the caller. No provider or model writes this repository. */
export class PostgresRelationshipRepository {
  constructor(private readonly pool: Pool) {}

  async claimRelationship(tenantId: TenantId,
    value: Omit<Relationship, "tenantId">): Promise<RelationshipClaimResult> {
    const inserted = await query<RelationshipRow>(this.pool,
      `INSERT INTO relationships (id,tenant_id,person_id,recorded_at)
       VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING *`,
      [value.id, tenantId, value.personId, value.recordedAt]);
    if (inserted.rows[0]) return { status: "inserted", relationship: relationshipFrom(inserted.rows[0]) };
    const prior = await this.getRelationshipByPerson(tenantId, value.personId);
    if (!prior) throw new RelationshipPromotionError("RELATIONSHIP_ID_CONFLICT");
    return { status: "already_exists", relationship: prior };
  }

  async getRelationshipByPerson(tenantId: TenantId, personId: PersonId): Promise<Relationship | null> {
    const result = await query<RelationshipRow>(this.pool,
      `SELECT * FROM relationships WHERE tenant_id=$1 AND person_id=$2`,
      [tenantId, personId]);
    return result.rows[0] ? relationshipFrom(result.rows[0]) : null;
  }

  async getRelationship(tenantId: TenantId, relationshipId: RelationshipId): Promise<Relationship | null> {
    const result = await query<RelationshipRow>(this.pool,
      `SELECT * FROM relationships WHERE tenant_id=$1 AND id=$2`,
      [tenantId, relationshipId]);
    return result.rows[0] ? relationshipFrom(result.rows[0]) : null;
  }

  async getInteraction(tenantId: TenantId,
    id: RelationshipInteractionId): Promise<RelationshipInteraction | null> {
    const result = await query<InteractionRow>(this.pool,
      `SELECT * FROM relationship_interactions WHERE tenant_id=$1 AND id=$2`,
      [tenantId, id]);
    return result.rows[0] ? interactionFrom(result.rows[0]) : null;
  }

  async listInteractionHistory(tenantId: TenantId,
    relationshipId: RelationshipId): Promise<RelationshipInteraction[]> {
    const result = await query<InteractionRow>(this.pool,
      `SELECT * FROM relationship_interactions
       WHERE tenant_id=$1 AND relationship_id=$2 ORDER BY recorded_at,id`,
      [tenantId, relationshipId]);
    return result.rows.map(interactionFrom);
  }

  async latestKnownInteraction(tenantId: TenantId, relationshipId: RelationshipId,
    kind: RelationshipInteractionKind): Promise<RelationshipInteraction | null> {
    const result = await query<InteractionRow>(this.pool,
      `SELECT * FROM relationship_interactions
       WHERE tenant_id=$1 AND relationship_id=$2 AND kind=$3 AND occurred_at IS NOT NULL
       ORDER BY occurred_at DESC,id DESC LIMIT 1`, [tenantId, relationshipId, kind]);
    return result.rows[0] ? interactionFrom(result.rows[0]) : null;
  }

  async promoteInteraction(tenantId: TenantId,
    value: InteractionInput): Promise<RelationshipInteractionResult> {
    const action = actionFor(value.kind);
    if (action === undefined || (action === null) !== (value.promotionPolicyDecisionId === null)) {
      throw new RelationshipPromotionError("RELATIONSHIP_ASSERTION_POLICY_REQUIRED");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const relationship = await query<RelationshipRow>(client,
        `SELECT * FROM relationships WHERE tenant_id=$1 AND id=$2`,
        [tenantId, value.relationshipId]);
      if (!relationship.rows[0]) throw new RelationshipPromotionError("RELATIONSHIP_MISSING");
      const activity = await query<QueryResultRow & { occurred_at: string | null }>(client,
        `SELECT occurred_at FROM activities WHERE tenant_id=$1 AND id=$2`,
        [tenantId, value.activityId]);
      if (!activity.rows[0]) throw new RelationshipPromotionError("ACTIVITY_MISSING");
      const occurredAt = activity.rows[0].occurred_at === null
        ? null : iso(activity.rows[0].occurred_at);
      if (value.occurredAt !== occurredAt) {
        throw new RelationshipPromotionError("ACTIVITY_EVENT_TIME_MISMATCH");
      }
      if (action !== null) {
        const policy = await query(client,
          `SELECT id FROM policy_decisions WHERE tenant_id=$1 AND id=$2
           AND subject_id=$3 AND action=$4 AND disposition='ALLOW'
           AND evidence_complete=true`,
          [tenantId, value.promotionPolicyDecisionId, value.activityId, action]);
        if (!policy.rows[0]) throw new RelationshipPromotionError("RELATIONSHIP_POLICY_NOT_ALLOWED");
      }
      const prior = await query<InteractionRow>(client,
        `SELECT * FROM relationship_interactions WHERE tenant_id=$1
         AND relationship_id=$2 AND activity_id=$3 AND kind=$4`,
        [tenantId, value.relationshipId, value.activityId, value.kind]);
      if (prior.rows[0]) {
        const existing = interactionFrom(prior.rows[0]);
        await client.query("COMMIT");
        return sameAssertion(existing, value)
          ? { status: "already_exists", interaction: existing }
          : { status: "source_conflict", interaction: existing };
      }
      const participant = await query<QueryResultRow & { id: ActivityParticipantId; identity_id: IdentityId }>(
        client,
        `SELECT p.id,p.identity_id FROM activity_participants p
         WHERE p.tenant_id=$1 AND p.activity_id=$2 AND p.person_id=$3
           AND p.identity_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM activity_participants successor
             WHERE successor.tenant_id=p.tenant_id AND successor.supersedes_id=p.id)
         ORDER BY p.recorded_at,p.id LIMIT 1`,
        [tenantId, value.activityId, relationship.rows[0].person_id]);
      if (!participant.rows[0]) throw new RelationshipPromotionError("RELATIONSHIP_PARTICIPANT_NOT_CURRENT");
      const inserted = await query<InteractionRow>(client,
        `INSERT INTO relationship_interactions
          (id,tenant_id,relationship_id,person_id,activity_id,kind,
           authority_participant_id,authority_identity_id,occurred_at,recorded_at,
           promotion_policy_decision_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT DO NOTHING RETURNING *`,
        [value.id, tenantId, value.relationshipId, relationship.rows[0].person_id,
          value.activityId, value.kind, participant.rows[0].id,
          participant.rows[0].identity_id, value.occurredAt, value.recordedAt,
          value.promotionPolicyDecisionId]);
      if (!inserted.rows[0]) {
        const raced = await query<InteractionRow>(client,
          `SELECT * FROM relationship_interactions WHERE tenant_id=$1
           AND relationship_id=$2 AND activity_id=$3 AND kind=$4`,
          [tenantId, value.relationshipId, value.activityId, value.kind]);
        if (!raced.rows[0]) throw new RelationshipPromotionError("RELATIONSHIP_INTERACTION_ID_CONFLICT");
        const existing = interactionFrom(raced.rows[0]);
        await client.query("COMMIT");
        return sameAssertion(existing, value)
          ? { status: "already_exists", interaction: existing }
          : { status: "source_conflict", interaction: existing };
      }
      await client.query("COMMIT");
      return { status: "inserted", interaction: interactionFrom(inserted.rows[0]) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  }
}
