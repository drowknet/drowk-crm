export type GmailTechnicalDirection =
  | "DRAFT"
  | "OUTBOUND_SENT"
  | "OUTBOUND_UNCONFIRMED"
  | "INBOUND_CANDIDATE"
  | "AMBIGUOUS";

export type CommercialRelevance =
  | "RELEVANT"
  | "NOT_RELEVANT"
  | "REVIEW"
  | "UNKNOWN";

export type GmailSyncAuditState = "PREPARED" | "PASS" | "FAILED";

export interface GmailMessageSource {
  messageId: string;
  threadId: string;
  labels: readonly string[];
  fromOwnedIdentity: boolean;
  toOwnedIdentity: boolean;
}

export interface GmailSyncCheckpoint {
  connectorRef: string;
  mailboxRef: string;
  cursorBefore: string | null;
  cursorAfter: string | null;
  state: GmailSyncAuditState;
  reason: string | null;
}

function normalizedDecimal(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new Error("Gmail History ID must be a decimal integer string.");
  }
  const stripped = value.replace(/^0+(?=\d)/, "");
  return stripped.length === 0 ? "0" : stripped;
}

export function compareHistoryIds(a: string, b: string): -1 | 0 | 1 {
  const left = normalizedDecimal(a);
  const right = normalizedDecimal(b);

  if (left.length < right.length) return -1;
  if (left.length > right.length) return 1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function hasLabel(labels: readonly string[], label: string): boolean {
  const target = label.toUpperCase();
  return labels.some((value) => value.toUpperCase() === target);
}

export function classifyTechnicalDirection(
  message: GmailMessageSource,
): GmailTechnicalDirection {
  if (hasLabel(message.labels, "DRAFT")) return "DRAFT";
  if (hasLabel(message.labels, "SENT")) return "OUTBOUND_SENT";
  if (message.fromOwnedIdentity) return "OUTBOUND_UNCONFIRMED";
  if (message.toOwnedIdentity) return "INBOUND_CANDIDATE";
  return "AMBIGUOUS";
}

export function spamDoesNotDecideRelevance(
  _labels: readonly string[],
): CommercialRelevance {
  return "UNKNOWN";
}

export function mayEnterPromotionEvaluation(
  direction: GmailTechnicalDirection,
): boolean {
  return direction !== "DRAFT";
}

export function canAdvanceCursor(checkpoint: GmailSyncCheckpoint): boolean {
  return checkpoint.state === "PASS" && checkpoint.cursorAfter !== null;
}
