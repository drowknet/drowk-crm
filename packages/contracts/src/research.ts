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
  maxToolCalls: number;
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
  researchRunId: string;
  caseId: string;
  workloadCell: string;
  adapterVersion: string;
  normalizedInput: JsonValue;
  labCase: CapabilityLabCase;
  latencyMs: number | null;
  provenanceComplete: boolean;
  synthetic: boolean;
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

export type JsonValue = null | boolean | number | string | JsonValue[] |
  { [key: string]: JsonValue };

export type CapabilityState =
  | "DOCUMENTED_CAPABILITY" | "LIVE_VALIDATED_CAPABILITY"
  | "UNSUPPORTED" | "UNASSESSED" | "TEMPORARILY_UNAVAILABLE" | "RIGHTS_BLOCKED";

/** The 05A executable boundary accepts only synthetic READ requests. */
export interface CapabilityLabCase {
  caseId: string;
  capabilityId: CapabilityId;
  workloadCell: string;
  provider: string;
  operation: string;
  interface: ProviderRun["interface"];
  accessClass: ProviderRun["accessClass"];
  normalizedInput: JsonValue;
  locale: string | null;
  geography: string | null;
  maxCostUsdMicros: number;
  maxToolCalls: number;
  stopCondition: "EVIDENCE_PRESENT";
  rightsClass: string | null;
  adapterVersion: string;
}

export interface SyntheticCapabilityFixture {
  resultState: ProviderResultState;
  output: JsonValue;
  estimatedCostUsdMicros: number | null;
  actualCostUsdMicros: number | null;
  actualCostKnown: boolean;
  retrievedAt: IsoDateTime;
  observedAt: IsoDateTime | null;
  latencyMs: number | null;
  provenanceComplete: boolean;
}
