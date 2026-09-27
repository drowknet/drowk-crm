import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import type { ActorId, AuthIdentity, AuthorizationAudit, ExternalPrincipal, TenantId, TenantMembership, User, UserId } from "@drowk/contracts";

/** Global identity records are deliberately separate from tenant-scoped memberships. */
export class PostgresIdentityRepository {
  constructor(private readonly connection: Pool | PoolClient) {}

  async createUser(displayName: string | null = null): Promise<User> {
    const result = await this.connection.query(
      `INSERT INTO users (id, actor_id, display_name) VALUES ($1, $2, $3)
       RETURNING id, actor_id AS "actorId", display_name AS "displayName", to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "recordedAt"`,
      [randomUUID(), randomUUID(), displayName],
    );
    return result.rows[0] as User;
  }

  async getUser(userId: UserId): Promise<User | null> {
    const result = await this.connection.query(
      `SELECT id, actor_id AS "actorId", display_name AS "displayName", to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "recordedAt" FROM users WHERE id = $1`, [userId],
    );
    return result.rows[0] ?? null;
  }

  /** Even a duplicate binding to the same user is rejected; no row is overwritten. */
  async bindIdentity(userId: UserId, principal: ExternalPrincipal): Promise<AuthIdentity> {
    await this.connection.query(
      `INSERT INTO auth_identities (issuer, subject, user_id, email) VALUES ($1, $2, $3, $4)`,
      [principal.issuer, principal.subject, userId, principal.email ?? null],
    );
    return (await this.getIdentity(principal.issuer, principal.subject))!;
  }

  async getIdentity(issuer: string, subject: string): Promise<AuthIdentity | null> {
    const result = await this.connection.query(
      `SELECT issuer, subject, user_id AS "userId", email, to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "recordedAt"
       FROM auth_identities WHERE issuer = $1 AND subject = $2`, [issuer, subject],
    );
    return result.rows[0] ?? null;
  }

  async createMembership(tenantId: TenantId, userId: UserId, audit: AuthorizationAudit): Promise<TenantMembership> {
    await this.connection.query(
      `INSERT INTO tenant_memberships (tenant_id, user_id, created_actor_id, created_run_id, created_correlation_id, created_policy_version)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, userId, audit.actorId, audit.runId, audit.correlationId, audit.policyVersion],
    );
    return (await this.getMembership(tenantId, userId))!;
  }

  async getMembership(tenantId: TenantId, userId: UserId): Promise<TenantMembership | null> {
    const result = await this.connection.query(
      `SELECT tenant_id AS "tenantId", user_id AS "userId", status,
        to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "recordedAt",
        to_char(revoked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS "revokedAt",
        json_build_object('actorId', created_actor_id, 'runId', created_run_id,
          'correlationId', created_correlation_id, 'policyVersion', created_policy_version) AS "createdAudit",
        CASE WHEN revoked_at IS NULL THEN NULL ELSE json_build_object('actorId', revoked_actor_id,
          'runId', revoked_run_id, 'correlationId', revoked_correlation_id, 'policyVersion', revoked_policy_version) END AS "revokedAudit"
       FROM tenant_memberships WHERE tenant_id = $1 AND user_id = $2`, [tenantId, userId],
    );
    return result.rows[0] ?? null;
  }

  async revokeMembership(tenantId: TenantId, userId: UserId, audit: AuthorizationAudit): Promise<TenantMembership | null> {
    // Preserve the first revocation and creation history; this slice has no reactivation.
    await this.connection.query(
      `UPDATE tenant_memberships SET status = 'REVOKED', revoked_at = clock_timestamp(),
       revoked_actor_id = $3, revoked_run_id = $4, revoked_correlation_id = $5, revoked_policy_version = $6
       WHERE tenant_id = $1 AND user_id = $2 AND status = 'ACTIVE'`,
      [tenantId, userId, audit.actorId, audit.runId, audit.correlationId, audit.policyVersion],
    );
    return this.getMembership(tenantId, userId);
  }

  async resolveActiveMembership(tenantId: TenantId, userId: UserId): Promise<{ tenantId: TenantId; userId: UserId; actorId: ActorId } | null> {
    const result = await this.connection.query(
      `SELECT m.tenant_id AS "tenantId", m.user_id AS "userId", u.actor_id AS "actorId"
       FROM tenant_memberships m JOIN users u ON u.id = m.user_id
       WHERE m.tenant_id = $1 AND m.user_id = $2 AND m.status = 'ACTIVE'`, [tenantId, userId],
    );
    return result.rows[0] ?? null;
  }
}
