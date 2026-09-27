import type {
  AccountId,
  ContactId,
  FacilityId,
  IsoDateTime,
  TenantId,
  TenantScoped,
} from "./ids.js";

export interface Tenant {
  id: TenantId;
  slug: string;
  name: string;
  recordedAt: IsoDateTime;
}

export type AccountStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export interface Account extends TenantScoped {
  id: AccountId;
  name: string;
  status: AccountStatus;
  recordedAt: IsoDateTime;
  supersedesId: AccountId | null;
}

export interface Facility extends TenantScoped {
  id: FacilityId;
  accountId: AccountId | null;
  name: string;
  addressText: string | null;
  effectiveAt: IsoDateTime | null;
  recordedAt: IsoDateTime;
  supersedesId: FacilityId | null;
}

export interface Contact extends TenantScoped {
  id: ContactId;
  displayName: string;
  recordedAt: IsoDateTime;
  supersedesId: ContactId | null;
}
