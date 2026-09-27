import type {
  ActionAttemptId,
  EvidenceId,
  IsoDateTime,
  OutcomeId,
  RunScoped,
  TenantScoped,
} from "./ids.js";

export type OutcomeState = "PROVISIONAL" | "CONFIRMED" | "RETRACTED";

export interface Outcome extends TenantScoped, RunScoped {
  id: OutcomeId;
  actionAttemptId: ActionAttemptId | null;
  kind: string;
  state: OutcomeState;
  observedAt: IsoDateTime;
  recordedAt: IsoDateTime;
  evidenceIds: EvidenceId[];
  attributionNotes: string | null;
}
