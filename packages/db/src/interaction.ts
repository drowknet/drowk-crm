import type {
  Activity, ActivityId, ActivityParticipant, ActivityParticipantId, Conversation,
  ConversationId, EvidenceId, IsoDateTime, ObservationId, TenantId,
} from "@drowk/contracts";
import { createHash } from "node:crypto";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type ConversationRow = QueryResultRow & {
  id: ConversationId; tenant_id: TenantId; channel: string;
  account_id: Conversation["accountId"]; facility_id: Conversation["facilityId"];
  source_namespace: string | null; source_conversation_ref: string | null;
  recorded_at: string; supersedes_id: ConversationId | null;
};
type ActivityRow = QueryResultRow & {
  id: ActivityId; tenant_id: TenantId; conversation_id: ConversationId;
  kind: string; direction: Activity["direction"];
  source_observation_id: ObservationId; source_namespace: string; source_native_id: string;
  occurred_at: string | null; recorded_at: string;
  promotion_policy_decision_id: string; supersedes_id: ActivityId | null;
  accepted_payload_digest: string;
};
type ParticipantRow = QueryResultRow & {
  id: ActivityParticipantId; tenant_id: TenantId; activity_id: ActivityId;
  role: ActivityParticipant["role"]; person_id: ActivityParticipant["personId"];
  identity_id: ActivityParticipant["identityId"];
  source_participant_namespace: string | null; source_participant_ref: string | null;
  recorded_at: string;
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
const optionalIso = (value: string | null) => value === null ? null : iso(value);
const conversationFrom = (row: ConversationRow): Conversation => ({
  id: row.id, tenantId: row.tenant_id, channel: row.channel,
  accountId: row.account_id, facilityId: row.facility_id,
  sourceNamespace: row.source_namespace, sourceConversationRef: row.source_conversation_ref,
  recordedAt: iso(row.recorded_at), supersedesId: row.supersedes_id,
});
const activityFrom = (row: ActivityRow, evidenceIds: EvidenceId[]): Activity => ({
  id: row.id, tenantId: row.tenant_id, conversationId: row.conversation_id,
  kind: row.kind, direction: row.direction, sourceObservationId: row.source_observation_id,
  evidenceIds, occurredAt: optionalIso(row.occurred_at), recordedAt: iso(row.recorded_at),
  promotionPolicyDecisionId: row.promotion_policy_decision_id, supersedesId: row.supersedes_id,
});
const participantFrom = (row: ParticipantRow): ActivityParticipant => ({
  id: row.id, tenantId: row.tenant_id, activityId: row.activity_id,
  role: row.role, personId: row.person_id, identityId: row.identity_id,
  sourceParticipantNamespace: row.source_participant_namespace,
  sourceParticipantRef: row.source_participant_ref, recordedAt: iso(row.recorded_at),
});

export class InteractionPromotionError extends Error {
  constructor(readonly code: string) { super(code); this.name = "InteractionPromotionError"; }
}

type ParticipantInput = Omit<ActivityParticipant, "tenantId" | "activityId">;
export type AcceptedActivityResult =
  | { status: "inserted" | "already_exists"; activity: Activity; participants: ActivityParticipant[] }
  | { status: "source_conflict"; activity: Activity };

function participantSemantics(participants: readonly (ParticipantInput | ActivityParticipant)[]): string[] {
  return participants.map(p => JSON.stringify([
    p.role, p.personId, p.identityId, p.sourceParticipantNamespace, p.sourceParticipantRef,
  ])).sort();
}
function acceptedPayloadDigest(activity: Omit<Activity, "tenantId">,
  participants: ParticipantInput[]): string {
  return createHash("sha256").update(JSON.stringify([
    activity.conversationId, activity.kind, activity.direction, activity.sourceObservationId,
    activity.occurredAt, activity.promotionPolicyDecisionId, activity.supersedesId,
    [...activity.evidenceIds].sort(), participantSemantics(participants),
  ])).digest("hex");
}

/** No connector imports this repository. The caller authorizes tenant scope. */
export class PostgresInteractionRepository {
  constructor(private readonly pool: Pool) {}

  async createConversation(tenantId: TenantId,
    conversation: Omit<Conversation, "tenantId">): Promise<Conversation> {
    const result = await query<ConversationRow>(this.pool,
      `INSERT INTO conversations
        (id,tenant_id,channel,account_id,facility_id,source_namespace,
         source_conversation_ref,recorded_at,supersedes_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [conversation.id, tenantId, conversation.channel, conversation.accountId,
        conversation.facilityId, conversation.sourceNamespace,
        conversation.sourceConversationRef, conversation.recordedAt, conversation.supersedesId]);
    return conversationFrom(result.rows[0]!);
  }

  async getConversation(tenantId: TenantId, conversationId: ConversationId): Promise<Conversation | null> {
    const result = await query<ConversationRow>(this.pool,
      `SELECT * FROM conversations WHERE tenant_id=$1 AND id=$2`, [tenantId, conversationId]);
    return result.rows[0] ? conversationFrom(result.rows[0]) : null;
  }

  private async evidenceIds(connection: Connection, tenantId: TenantId,
    activityId: ActivityId): Promise<EvidenceId[]> {
    const result = await query<QueryResultRow & { evidence_id: EvidenceId }>(connection,
      `SELECT evidence_id FROM activity_evidence WHERE tenant_id=$1 AND activity_id=$2
       ORDER BY evidence_id`, [tenantId, activityId]);
    return result.rows.map(row => row.evidence_id);
  }

  private async readActivity(connection: Connection, tenantId: TenantId,
    activityId: ActivityId): Promise<Activity | null> {
    const result = await query<ActivityRow>(connection,
      `SELECT * FROM activities WHERE tenant_id=$1 AND id=$2`, [tenantId, activityId]);
    return result.rows[0] ? activityFrom(result.rows[0],
      await this.evidenceIds(connection, tenantId, activityId)) : null;
  }

  async getActivity(tenantId: TenantId, activityId: ActivityId): Promise<Activity | null> {
    return this.readActivity(this.pool, tenantId, activityId);
  }

  async listActivitiesForConversation(tenantId: TenantId,
    conversationId: ConversationId): Promise<Activity[]> {
    const result = await query<ActivityRow>(this.pool,
      `SELECT * FROM activities WHERE tenant_id=$1 AND conversation_id=$2
       ORDER BY recorded_at,id`, [tenantId, conversationId]);
    return Promise.all(result.rows.map(async row => activityFrom(row,
      await this.evidenceIds(this.pool, tenantId, row.id))));
  }

  async listEvidenceIdsForActivity(tenantId: TenantId, activityId: ActivityId): Promise<EvidenceId[]> {
    return this.evidenceIds(this.pool, tenantId, activityId);
  }

  private async readParticipants(connection: Connection, tenantId: TenantId,
    activityId: ActivityId): Promise<ActivityParticipant[]> {
    const result = await query<ParticipantRow>(connection,
      `SELECT * FROM activity_participants WHERE tenant_id=$1 AND activity_id=$2
       ORDER BY recorded_at,id`, [tenantId, activityId]);
    return result.rows.map(participantFrom);
  }

  async listParticipantsForActivity(tenantId: TenantId,
    activityId: ActivityId): Promise<ActivityParticipant[]> {
    return this.readParticipants(this.pool, tenantId, activityId);
  }

  async appendParticipant(tenantId: TenantId, activityId: ActivityId,
    participant: ParticipantInput): Promise<ActivityParticipant> {
    const result = await query<ParticipantRow>(this.pool,
      `INSERT INTO activity_participants
        (id,tenant_id,activity_id,role,person_id,identity_id,
         source_participant_namespace,source_participant_ref,recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [participant.id, tenantId, activityId, participant.role, participant.personId,
        participant.identityId, participant.sourceParticipantNamespace,
        participant.sourceParticipantRef, participant.recordedAt]);
    return participantFrom(result.rows[0]!);
  }

  /** One transaction accepts source, evidence, policy and participant linkage together. */
  async promoteAcceptedActivity(tenantId: TenantId, activity: Omit<Activity, "tenantId">,
    participants: ParticipantInput[]): Promise<AcceptedActivityResult> {
    if (activity.evidenceIds.length === 0
      || new Set(activity.evidenceIds).size !== activity.evidenceIds.length) {
      throw new InteractionPromotionError("EVIDENCE_REQUIRED_OR_DUPLICATED");
    }
    if (new Set(participants.map(p => p.id)).size !== participants.length) {
      throw new InteractionPromotionError("PARTICIPANT_ID_DUPLICATED");
    }
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const source = await query<QueryResultRow & { source_namespace: string; source_native_id: string }>(
        client, `SELECT source_namespace,source_native_id FROM source_observations
          WHERE tenant_id=$1 AND id=$2`, [tenantId, activity.sourceObservationId]);
      if (!source.rows[0]) throw new InteractionPromotionError("SOURCE_OBSERVATION_MISSING");
      const policy = await query<QueryResultRow & { id: string }>(client,
        `SELECT id FROM policy_decisions WHERE tenant_id=$1 AND id=$2
         AND subject_id=$3 AND action='ACCEPT_INTERACTION'
         AND disposition='ALLOW' AND evidence_complete=true`,
        [tenantId, activity.promotionPolicyDecisionId, activity.sourceObservationId]);
      if (!policy.rows[0]) throw new InteractionPromotionError("PROMOTION_POLICY_NOT_ALLOWED");
      const evidence = await query<QueryResultRow & { id: EvidenceId }>(client,
        `SELECT id FROM evidence WHERE tenant_id=$1 AND observation_id=$2
         AND id=ANY($3::uuid[])`, [tenantId, activity.sourceObservationId, activity.evidenceIds]);
      if (evidence.rows.length !== activity.evidenceIds.length) {
        throw new InteractionPromotionError("ATTRIBUTABLE_EVIDENCE_MISSING");
      }
      const inserted = await query<ActivityRow>(client,
        `INSERT INTO activities
          (id,tenant_id,conversation_id,kind,direction,source_observation_id,
           source_namespace,source_native_id,occurred_at,recorded_at,
           promotion_policy_decision_id,supersedes_id,accepted_payload_digest)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT DO NOTHING RETURNING *`,
        [activity.id, tenantId, activity.conversationId, activity.kind, activity.direction,
          activity.sourceObservationId, source.rows[0].source_namespace,
          source.rows[0].source_native_id, activity.occurredAt, activity.recordedAt,
          activity.promotionPolicyDecisionId, activity.supersedesId,
          acceptedPayloadDigest(activity, participants)]);
      if (!inserted.rows[0]) {
        const prior = await query<ActivityRow>(client,
          `SELECT * FROM activities WHERE tenant_id=$1 AND source_namespace=$2
           AND source_native_id=$3`, [tenantId, source.rows[0].source_namespace,
            source.rows[0].source_native_id]);
        if (!prior.rows[0]) throw new InteractionPromotionError("ACTIVITY_ID_CONFLICT");
        const existing = await this.readActivity(client, tenantId, prior.rows[0].id);
        if (!existing) throw new InteractionPromotionError("ACTIVITY_MISSING_AFTER_CONFLICT");
        const existingParticipants = await this.readParticipants(client, tenantId, existing.id);
        await client.query("COMMIT");
        return prior.rows[0].accepted_payload_digest === acceptedPayloadDigest(activity, participants)
          && existing.sourceObservationId === activity.sourceObservationId
          ? { status: "already_exists", activity: existing, participants: existingParticipants }
          : { status: "source_conflict", activity: existing };
      }
      for (const evidenceId of activity.evidenceIds) {
        await query(client, `INSERT INTO activity_evidence
          (tenant_id,activity_id,evidence_id,source_observation_id,recorded_at)
          VALUES ($1,$2,$3,$4,$5)`, [tenantId, activity.id, evidenceId,
          activity.sourceObservationId, activity.recordedAt]);
      }
      for (const participant of participants) {
        await query(client, `INSERT INTO activity_participants
          (id,tenant_id,activity_id,role,person_id,identity_id,
           source_participant_namespace,source_participant_ref,recorded_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [participant.id, tenantId, activity.id, participant.role, participant.personId,
          participant.identityId, participant.sourceParticipantNamespace,
          participant.sourceParticipantRef, participant.recordedAt]);
      }
      await client.query("COMMIT");
      const accepted = await this.readActivity(this.pool, tenantId, activity.id);
      if (!accepted) throw new InteractionPromotionError("ACTIVITY_MISSING_AFTER_INSERT");
      return { status: "inserted", activity: accepted,
        participants: await this.readParticipants(this.pool, tenantId, activity.id) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
