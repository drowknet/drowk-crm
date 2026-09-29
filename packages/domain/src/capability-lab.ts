import { createHash } from "node:crypto";
import type {
  CapabilityLabCase, JsonValue, ProviderResultState, ResearchRun,
  Sha256Digest, SyntheticCapabilityFixture,
} from "@drowk/contracts";

export class CapabilityLabError extends Error {
  constructor(readonly code: string) { super(code); this.name = "CapabilityLabError"; }
}

const forbiddenKey = /(password|secret|token|credential|apikey|authorization|cookie|session|privatekey)/i;
const safeInteger = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;

/** Rejects unsupported values and credential-like keys before serialization or hashing. */
export function normalizeLabJson(value: unknown): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (Object.keys(value).length !== value.length) throw new CapabilityLabError("INVALID_NORMALIZED_INPUT");
    return value.map(normalizeLabJson);
  }
  if (typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    throw new CapabilityLabError("INVALID_NORMALIZED_INPUT");
  }
  const normalized: Record<string, JsonValue> = {};
  for (const key of Object.keys(value).sort()) {
    if (forbiddenKey.test(key.replace(/[_\-\s]/g, ""))) {
      throw new CapabilityLabError("CREDENTIAL_FIELD_FORBIDDEN");
    }
    normalized[key] = normalizeLabJson((value as Record<string, unknown>)[key]);
  }
  return normalized;
}

export function labFingerprint(value: unknown): Sha256Digest {
  return `sha256:${createHash("sha256").update(JSON.stringify(normalizeLabJson(value))).digest("hex")}` as Sha256Digest;
}

export function validateLabCase(input: CapabilityLabCase): CapabilityLabCase {
  if (input.accessClass !== "READ") throw new CapabilityLabError("WRITE_NOT_AUTHORIZED");
  if (!safeInteger(input.maxCostUsdMicros) || !safeInteger(input.maxToolCalls) ||
      input.maxToolCalls > 2_147_483_647) {
    throw new CapabilityLabError("INVALID_BUDGET");
  }
  for (const value of [input.caseId, input.capabilityId, input.workloadCell,
    input.provider, input.operation, input.adapterVersion]) {
    if (typeof value !== "string" || !value.trim()) throw new CapabilityLabError("INVALID_CASE");
  }
  if (input.stopCondition !== "EVIDENCE_PRESENT") throw new CapabilityLabError("INVALID_STOP_CONDITION");
  return { ...input, normalizedInput: normalizeLabJson(input.normalizedInput) };
}

export function requestFingerprint(input: CapabilityLabCase): Sha256Digest {
  const value = validateLabCase(input);
  return labFingerprint({
    capabilityId: value.capabilityId, workloadCell: value.workloadCell,
    provider: value.provider, operation: value.operation,
    interface: value.interface, accessClass: value.accessClass,
    normalizedInput: value.normalizedInput, locale: value.locale,
    geography: value.geography, adapterVersion: value.adapterVersion,
  });
}

export function validateSyntheticFixture(fixture: SyntheticCapabilityFixture): SyntheticCapabilityFixture {
  const states: ProviderResultState[] = ["PRESENT", "EMPTY_WITHIN_RESPONSE", "UNKNOWN", "ERROR", "PENDING", "PARTIAL"];
  if (!states.includes(fixture.resultState)) throw new CapabilityLabError("INVALID_RESULT_STATE");
  if (fixture.estimatedCostUsdMicros !== null && !safeInteger(fixture.estimatedCostUsdMicros)) {
    throw new CapabilityLabError("INVALID_ESTIMATED_COST");
  }
  if (fixture.actualCostKnown !== (fixture.actualCostUsdMicros !== null) ||
      (fixture.actualCostUsdMicros !== null && !safeInteger(fixture.actualCostUsdMicros))) {
    throw new CapabilityLabError("INVALID_ACTUAL_COST");
  }
  if (fixture.latencyMs !== null && !safeInteger(fixture.latencyMs)) {
    throw new CapabilityLabError("INVALID_LATENCY");
  }
  return { ...fixture, output: normalizeLabJson(fixture.output) };
}

export function syntheticStopState(run: ResearchRun): ResearchRun["status"] | null {
  if (run.question.stopCondition !== "EVIDENCE_PRESENT") throw new CapabilityLabError("INVALID_STOP_CONDITION");
  return run.outputEvidenceIds.length > 0 ? "SUFFICIENT" : null;
}
