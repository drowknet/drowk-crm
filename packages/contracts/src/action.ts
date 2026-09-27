import type {
  ActionAttemptId,
  Approval,
  CorrelationId,
  IsoDateTime,
  RunId,
  Sha256Digest,
  TenantScoped,
} from "./index.js";

export type ActionAttemptState =
  | "PREPARED"
  | "DISPATCHING"
  | "ACCEPTED"
  | "FAILED"
  | "UNKNOWN"
  | "RECONCILED";

export interface ActionAttempt extends TenantScoped {
  id: ActionAttemptId;
  runId: RunId;
  correlationId: CorrelationId;
  action: string;
  targetRef: string;
  payloadDigest: Sha256Digest;
  approvalId: Approval["id"] | null;
  idempotencyDigest: Sha256Digest;
  state: ActionAttemptState;
  providerReceiptRef: string | null;
  errorCategory: string | null;
  attemptedAt: IsoDateTime;
  reconciledAt: IsoDateTime | null;
}
