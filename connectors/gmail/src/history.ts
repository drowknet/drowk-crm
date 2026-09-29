import { compareHistoryIds, type GmailSyncCheckpoint } from "./index.js";

export type GmailRecoveryReason = "INITIAL_SCAN" | "EXPIRED_HISTORY" | "INVALID_HISTORY";

export type GmailHistoryPlan =
  | { state: "INCREMENTAL"; cursorBefore: string }
  | { state: "FULL_SCAN_REQUIRED"; cursorBefore: string | null; reason: GmailRecoveryReason };

export function planHistorySync(
  committedCursor: string | null,
  failure: "EXPIRED_HISTORY" | "INVALID_HISTORY" | null = null,
): GmailHistoryPlan {
  if (failure !== null) {
    return { state: "FULL_SCAN_REQUIRED", cursorBefore: committedCursor, reason: failure };
  }
  if (committedCursor === null) {
    return { state: "FULL_SCAN_REQUIRED", cursorBefore: null, reason: "INITIAL_SCAN" };
  }
  try {
    compareHistoryIds(committedCursor, committedCursor);
  } catch {
    return { state: "FULL_SCAN_REQUIRED", cursorBefore: committedCursor, reason: "INVALID_HISTORY" };
  }
  return { state: "INCREMENTAL", cursorBefore: committedCursor };
}

export type GmailCursorFinalization =
  | { status: "committed" | "replayed"; committedCursor: string }
  | { status: "not_ready" | "conflict"; committedCursor: string | null };

/** The caller must serialize/compare-and-swap the durable cursor with this result. */
export function finalizeHistoryCheckpoint(
  committedCursor: string | null,
  checkpoint: GmailSyncCheckpoint,
): GmailCursorFinalization {
  if (checkpoint.state !== "PASS" || checkpoint.cursorAfter === null) {
    return { status: "not_ready", committedCursor };
  }
  try {
    compareHistoryIds(checkpoint.cursorAfter, checkpoint.cursorAfter);
    if (checkpoint.cursorBefore !== null &&
      compareHistoryIds(checkpoint.cursorAfter, checkpoint.cursorBefore) < 0) {
      return { status: "conflict", committedCursor };
    }
  } catch {
    return { status: "conflict", committedCursor };
  }
  if (committedCursor === checkpoint.cursorAfter && checkpoint.cursorBefore !== committedCursor) {
    return { status: "replayed", committedCursor };
  }
  if (committedCursor !== checkpoint.cursorBefore) {
    return { status: "conflict", committedCursor };
  }
  return { status: "committed", committedCursor: checkpoint.cursorAfter };
}
