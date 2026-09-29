import type {
  AccountId, EmploymentId, IdentityId, IsoDate, IsoDateTime,
  PersonId, TenantScoped,
} from "./ids.js";

/** Durable human subject; operational Contacts and source identities are separate objects. */
export interface Person extends TenantScoped {
  id: PersonId;
  displayName: string | null;
  recordedAt: IsoDateTime;
  supersedesId: PersonId | null;
}

export type IdentityTemporalState = "CURRENT" | "HISTORICAL" | "UNKNOWN";

/** Accepted, attributable manifestation of a Person; never inferred from value uniqueness. */
export interface Identity extends TenantScoped {
  id: IdentityId;
  personId: PersonId;
  kind: string;
  namespace: string;
  normalizedValue: string;
  temporalState: IdentityTemporalState;
  effectiveFrom: IsoDate | null;
  effectiveTo: IsoDate | null;
  matchDecisionId: string;
  recordedAt: IsoDateTime;
  supersedesId: IdentityId | null;
}

export type EmploymentState = "CURRENT" | "FORMER" | "UNKNOWN";

/** Point-in-time organization context. A job change appends another record. */
export interface Employment extends TenantScoped {
  id: EmploymentId;
  personId: PersonId;
  accountId: AccountId;
  title: string | null;
  state: EmploymentState;
  startedOn: IsoDate | null;
  endedOn: IsoDate | null;
  recordedAt: IsoDateTime;
  supersedesId: EmploymentId | null;
}
