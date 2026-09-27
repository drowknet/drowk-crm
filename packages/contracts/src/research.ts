import type {
  CapabilityId,
  EntityId,
  EvidenceId,
  IsoDateTime,
  RunScoped,
  Sha256Digest,
  TenantScoped,
} from "./ids.js";

export type ResearchRunStatus =
  | "PLANNED"
  | "RUNNING"
  | "SUFFICIENT"
  | "EXHAUSTED"
  | "BLOCKED"
  | "FAILED";

export interface ResearchQuestion {
  text: string;
  entityCandidates: EntityId[];
  requiredEvidence: string[];
  freshnessSeconds: number | null;
  maxCostUsdMicros: number;
  allowedCapabilities: CapabilityId[];
  stopCondition: string;
}

export interface ResearchRun extends TenantScoped, RunScoped {
  id: string;
  question: ResearchQuestion;
  status: ResearchRunStatus;
  outputEvidenceIds: EvidenceId[];
  startedAt: IsoDateTime | null;
  completedAt: IsoDateTime | null;
}

export type ProviderResultState =
  | "PRESENT"
  | "EMPTY_WITHIN_RESPONSE"
  | "UNKNOWN"
  | "ERROR"
  | "PENDING"
  | "PARTIAL";

export interface ProviderRun extends TenantScoped, RunScoped {
  id: string;
  capability: CapabilityId;
  provider: string;
  operation: string;
  interface: "DIRECT_API" | "MCP" | "NATIVE" | "OTHER";
  accessClass: "READ" | "WRITE";
  requestFingerprint: Sha256Digest;
  responseFingerprint: Sha256Digest | null;
  resultState: ProviderResultState;
  estimatedCostUsdMicros: number | null;
  actualCostUsdMicros: number | null;
  actualCostKnown: boolean;
  retrievedAt: IsoDateTime;
  observedAt: IsoDateTime | null;
  rightsClass: string | null;
}
