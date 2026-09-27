import type {
  EntityId,
  IsoDateTime,
  PolicyVersion,
  RunScoped,
  TenantScoped,
  WorkItemId,
} from "./ids.js";

export type WorkItemStatus = "READY" | "BLOCKED" | "IN_PROGRESS" | "DONE" | "CANCELLED";

export interface WorkItem extends TenantScoped, RunScoped {
  id: WorkItemId;
  subjectId: EntityId;
  kind: string;
  status: WorkItemStatus;
  reasonCodes: string[];
  policyVersion: PolicyVersion;
  sourceWatermark: string | null;
  availableAt: IsoDateTime;
  recordedAt: IsoDateTime;
}
