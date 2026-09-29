import type {
  AccountId, Contact, ContactId, Employment, EmploymentId, Identity,
  IdentityId, IsoDateTime, Person, PersonId, TenantId,
} from "@drowk/contracts";
import pg, { type Pool, type PoolClient, type QueryResultRow } from "pg";

type Connection = Pool | PoolClient;
type PersonRow = QueryResultRow & {
  id: PersonId; tenant_id: TenantId; display_name: string | null;
  recorded_at: string; supersedes_id: PersonId | null;
};
type IdentityRow = QueryResultRow & {
  id: IdentityId; tenant_id: TenantId; person_id: PersonId;
  kind: string; namespace: string; normalized_value: string;
  temporal_state: Identity["temporalState"];
  effective_from: Identity["effectiveFrom"]; effective_to: Identity["effectiveTo"];
  match_decision_id: string; recorded_at: string; supersedes_id: IdentityId | null;
};
type EmploymentRow = QueryResultRow & {
  id: EmploymentId; tenant_id: TenantId; person_id: PersonId; account_id: AccountId;
  title: string | null; state: Employment["state"];
  started_on: Employment["startedOn"]; ended_on: Employment["endedOn"];
  recorded_at: string; supersedes_id: EmploymentId | null;
};
type ContactRow = QueryResultRow & {
  id: ContactId; tenant_id: TenantId; display_name: string;
  person_id: PersonId | null; person_match_decision_id: string | null;
  recorded_at: string; supersedes_id: ContactId | null;
};

const timestampTypes = {
  getTypeParser: (oid: number, format?: "text" | "binary") =>
    format !== "binary" && (oid === 1184 || oid === 1082)
      ? (value: string) => value
      : pg.types.getTypeParser(oid, format),
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

const personFrom = (row: PersonRow): Person => ({
  id: row.id, tenantId: row.tenant_id, displayName: row.display_name,
  recordedAt: iso(row.recorded_at), supersedesId: row.supersedes_id,
});
const identityFrom = (row: IdentityRow): Identity => ({
  id: row.id, tenantId: row.tenant_id, personId: row.person_id,
  kind: row.kind, namespace: row.namespace, normalizedValue: row.normalized_value,
  temporalState: row.temporal_state, effectiveFrom: row.effective_from,
  effectiveTo: row.effective_to, matchDecisionId: row.match_decision_id,
  recordedAt: iso(row.recorded_at), supersedesId: row.supersedes_id,
});
const employmentFrom = (row: EmploymentRow): Employment => ({
  id: row.id, tenantId: row.tenant_id, personId: row.person_id,
  accountId: row.account_id, title: row.title, state: row.state,
  startedOn: row.started_on, endedOn: row.ended_on,
  recordedAt: iso(row.recorded_at), supersedesId: row.supersedes_id,
});
const contactFrom = (row: ContactRow): Contact => ({
  id: row.id, tenantId: row.tenant_id, displayName: row.display_name,
  personId: row.person_id, personMatchDecisionId: row.person_match_decision_id,
  recordedAt: iso(row.recorded_at), supersedesId: row.supersedes_id,
});

export type ContactLinkResult =
  | { status: "linked" | "already_linked"; contact: Contact }
  | { status: "contact_not_found" | "person_not_found" | "unsafe_decision" | "link_conflict" };

/** Tenant scope is explicit on every operation; authorization remains the caller's duty. */
export class PostgresHumanContinuityRepository {
  constructor(private readonly connection: Connection) {}

  async createPerson(tenantId: TenantId, person: Omit<Person, "tenantId">): Promise<Person> {
    const result = await query<PersonRow>(this.connection,
      `INSERT INTO persons (id, tenant_id, display_name, recorded_at, supersedes_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [person.id, tenantId, person.displayName, person.recordedAt, person.supersedesId]);
    return personFrom(result.rows[0]!);
  }

  async getPerson(tenantId: TenantId, personId: PersonId): Promise<Person | null> {
    const result = await query<PersonRow>(this.connection,
      `SELECT * FROM persons WHERE tenant_id=$1 AND id=$2`, [tenantId, personId]);
    return result.rows[0] ? personFrom(result.rows[0]) : null;
  }

  async createIdentity(tenantId: TenantId, identity: Omit<Identity, "tenantId">): Promise<Identity> {
    // The composite FK requires PERSON / MATCHED_SAFE / selected target as one tuple.
    const result = await query<IdentityRow>(this.connection,
      `INSERT INTO person_identities
        (id, tenant_id, person_id, kind, namespace, normalized_value, temporal_state,
         effective_from, effective_to, match_decision_id, recorded_at, supersedes_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [identity.id, tenantId, identity.personId, identity.kind, identity.namespace,
        identity.normalizedValue, identity.temporalState, identity.effectiveFrom,
        identity.effectiveTo, identity.matchDecisionId, identity.recordedAt, identity.supersedesId]);
    return identityFrom(result.rows[0]!);
  }

  async getIdentity(tenantId: TenantId, identityId: IdentityId): Promise<Identity | null> {
    const result = await query<IdentityRow>(this.connection,
      `SELECT * FROM person_identities WHERE tenant_id=$1 AND id=$2`, [tenantId, identityId]);
    return result.rows[0] ? identityFrom(result.rows[0]) : null;
  }

  async listIdentitiesForPerson(tenantId: TenantId, personId: PersonId): Promise<Identity[]> {
    const result = await query<IdentityRow>(this.connection,
      `SELECT * FROM person_identities WHERE tenant_id=$1 AND person_id=$2
       ORDER BY recorded_at, id`, [tenantId, personId]);
    return result.rows.map(identityFrom);
  }

  async createEmployment(tenantId: TenantId, employment: Omit<Employment, "tenantId">): Promise<Employment> {
    const result = await query<EmploymentRow>(this.connection,
      `INSERT INTO employments
        (id, tenant_id, person_id, account_id, title, state, started_on, ended_on,
         recorded_at, supersedes_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [employment.id, tenantId, employment.personId, employment.accountId,
        employment.title, employment.state, employment.startedOn, employment.endedOn,
        employment.recordedAt, employment.supersedesId]);
    return employmentFrom(result.rows[0]!);
  }

  async getEmployment(tenantId: TenantId, employmentId: EmploymentId): Promise<Employment | null> {
    const result = await query<EmploymentRow>(this.connection,
      `SELECT * FROM employments WHERE tenant_id=$1 AND id=$2`, [tenantId, employmentId]);
    return result.rows[0] ? employmentFrom(result.rows[0]) : null;
  }

  async listEmploymentsForPerson(tenantId: TenantId, personId: PersonId): Promise<Employment[]> {
    const result = await query<EmploymentRow>(this.connection,
      `SELECT * FROM employments WHERE tenant_id=$1 AND person_id=$2
       ORDER BY recorded_at, id`, [tenantId, personId]);
    return result.rows.map(employmentFrom);
  }

  /** Creation never accepts a Person link; linking has its own attributable operation. */
  async createContact(tenantId: TenantId,
    contact: Pick<Contact, "id" | "displayName" | "recordedAt" | "supersedesId">,
  ): Promise<Contact> {
    const result = await query<ContactRow>(this.connection,
      `INSERT INTO contacts (id, tenant_id, display_name, recorded_at, supersedes_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [contact.id, tenantId, contact.displayName, contact.recordedAt, contact.supersedesId]);
    return contactFrom(result.rows[0]!);
  }

  async getContact(tenantId: TenantId, contactId: ContactId): Promise<Contact | null> {
    const result = await query<ContactRow>(this.connection,
      `SELECT * FROM contacts WHERE tenant_id=$1 AND id=$2`, [tenantId, contactId]);
    return result.rows[0] ? contactFrom(result.rows[0]) : null;
  }

  async linkContactToPerson(tenantId: TenantId, contactId: ContactId,
    personId: PersonId, matchDecisionId: string,
  ): Promise<ContactLinkResult> {
    // Atomic compare-and-set. The composite FK is the second, DB-level authority gate.
    const changed = await query<ContactRow>(this.connection,
      `UPDATE contacts AS c
       SET person_id=$3, person_match_decision_id=$4,
           person_decision_scope='PERSON', person_decision_status='MATCHED_SAFE'
       WHERE c.tenant_id=$1 AND c.id=$2 AND c.person_id IS NULL
         AND EXISTS (SELECT 1 FROM persons p WHERE p.tenant_id=$1 AND p.id=$3)
         AND EXISTS (
           SELECT 1 FROM entity_match_decisions d
           WHERE d.tenant_id=$1 AND d.id=$4 AND d.resolution_scope='PERSON'
             AND d.status='MATCHED_SAFE' AND d.selected_entity_id=$3)
       RETURNING c.*`, [tenantId, contactId, personId, matchDecisionId]);
    if (changed.rows[0]) return { status: "linked", contact: contactFrom(changed.rows[0]) };
    const contact = await this.getContact(tenantId, contactId);
    if (!contact) return { status: "contact_not_found" };
    if (contact.personId !== null) return contact.personId === personId
      && contact.personMatchDecisionId === matchDecisionId
      ? { status: "already_linked", contact } : { status: "link_conflict" };
    if (!await this.getPerson(tenantId, personId)) return { status: "person_not_found" };
    return { status: "unsafe_decision" };
  }
}
