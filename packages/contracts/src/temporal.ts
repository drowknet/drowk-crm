import type { IsoDateTime } from "./ids.js";

export interface KnowledgeTime {
  /**
   * When the statement was true/effective in the source world.
   * Null means unknown and must not be synthesized.
   */
  effectiveAt: IsoDateTime | null;

  /** When DROWK recorded/learned the statement. */
  recordedAt: IsoDateTime;

  /** When DROWK retrieved the source, if applicable. */
  retrievedAt: IsoDateTime | null;
}

export type TemporalApplicability = "YES" | "NO" | "UNKNOWN";

const millis = (value: IsoDateTime): number => Date.parse(value);

export function wasKnownAt(recordedAt: IsoDateTime, asOf: IsoDateTime): boolean {
  return millis(recordedAt) <= millis(asOf);
}

export function wasEffectiveAt(
  effectiveAt: IsoDateTime | null,
  asOf: IsoDateTime,
): TemporalApplicability {
  if (effectiveAt === null) return "UNKNOWN";
  return millis(effectiveAt) <= millis(asOf) ? "YES" : "NO";
}
