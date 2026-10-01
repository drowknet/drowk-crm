import type { ProspectingCapability, ProspectingInputs, ProspectingFixture } from "@drowk/contracts";
import { CapabilityLabError, normalizeLabJson, validateLabCase, validateSyntheticFixture, requestFingerprint, labFingerprint } from "./capability-lab.js";

const shapes: Record<ProspectingCapability, [string[], string[]]> = {
  SEARCH_WEB: [["query", "locale", "geography", "maxResults"], []],
  EXTRACT_WEB_PAGE: [["url", "extractionGoal"], []],
  DISCOVER_COMPANIES: [["marketQuery", "geography", "maxResults"], ["terms"]],
  DISCOVER_PUBLIC_PROFESSIONAL_PROFILE: [["fullName"], ["companyName", "companyDomain", "titleHint"]],
  FIND_BUYER_CANDIDATES: [["companyName", "companyDomain", "roleTerms"], ["geography", "facilityContext", "serviceCategory"]],
  ENRICH_COMPANY: [["companyDomain", "fields"], ["companyName"]],
  FIND_PROFESSIONAL_EMAIL: [["fullName", "companyDomain"], ["publishedPatternEvidence"]],
  VERIFY_PROFESSIONAL_EMAIL: [["email"], ["expectedCompanyDomain"]],
  VERIFY_EMPLOYMENT: [["fullName", "companyName"], ["companyDomain", "claimedTitle", "publicProfileUrl"]],
  FIND_PROCUREMENT_ROUTE: [["companyName", "companyDomain", "serviceCategory"], ["geography", "facilityContext"]],
};
function requireCondition(condition: unknown): asserts condition {
  if (!condition) throw new CapabilityLabError("INVALID_PROSPECTING_CONTRACT");
}
const text = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const integer = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const timestamp = (v: unknown): boolean => typeof v === "string" && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v));
function keys(value: object, allowed: string[]) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value));
  requireCondition(Object.keys(value).every(key => allowed.includes(key)));
}
function url(value: string) {
  const parsed = new URL(value);
  requireCondition(["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password);
}
export function normalizeProspectingInput<K extends ProspectingCapability>(capability: K, input: unknown): ProspectingInputs[K] {
  const normalized = normalizeLabJson(input);
  requireCondition(normalized && typeof normalized === "object" && !Array.isArray(normalized));
  requireCondition(Object.hasOwn(shapes, capability));
  const [required, optional] = shapes[capability];
  keys(normalized, [...required, ...optional]);
  requireCondition(required.every(key => Object.hasOwn(normalized, key)));
  for (const [key, value] of Object.entries(normalized)) {
    if (key === "maxResults") requireCondition(integer(value) && value > 0 && value <= 100);
    else if (["roleTerms", "fields", "terms"].includes(key)) requireCondition(Array.isArray(value) && value.length > 0 && value.length <= 100 && value.every(text));
    else {
      requireCondition(text(value));
      if (["url", "publicProfileUrl"].includes(key)) url(value);
      if (["companyDomain", "expectedCompanyDomain"].includes(key)) requireCondition(/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(value));
      if (key === "email") requireCondition(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
    }
  }
  if (capability === "DISCOVER_PUBLIC_PROFESSIONAL_PROFILE") requireCondition(optional.some(key => Object.hasOwn(normalized, key)));
  return normalized as unknown as ProspectingInputs[K];
}

/** Pure offline validation. Returned records remain inputs to the existing 05A lab. */
export function validateProspectingFixture(input: ProspectingFixture): ProspectingFixture {
  normalizeLabJson(input);
  keys(input, ["labCase", "fixture", "expectedEvidenceGaps", "expectedAssertions", "maxElapsedMs", "freshnessSeconds"]);
  const labCase = validateLabCase(input.labCase);
  keys(labCase, ["caseId", "capabilityId", "workloadCell", "provider", "operation", "interface", "accessClass", "normalizedInput", "locale", "geography", "maxCostUsdMicros", "maxToolCalls", "stopCondition", "rightsClass", "adapterVersion"]);
  normalizeProspectingInput(labCase.capabilityId as ProspectingCapability, labCase.normalizedInput);
  requireCondition(labCase.provider.startsWith("synthetic-") && labCase.rightsClass === "SYNTHETIC_ALLOWED" && labCase.interface === "OTHER");
  const fixture = validateSyntheticFixture(input.fixture);
  keys(fixture, ["resultState", "output", "estimatedCostUsdMicros", "actualCostUsdMicros", "actualCostKnown", "retrievedAt", "observedAt", "latencyMs", "provenanceComplete"]);
  requireCondition(timestamp(fixture.retrievedAt) && (fixture.observedAt === null || timestamp(fixture.observedAt)));
  requireCondition(integer(input.maxElapsedMs) && integer(input.freshnessSeconds));
  requireCondition(fixture.latencyMs === null || fixture.latencyMs <= input.maxElapsedMs);
  requireCondition(fixture.estimatedCostUsdMicros === null || fixture.estimatedCostUsdMicros <= labCase.maxCostUsdMicros);
  requireCondition(fixture.actualCostUsdMicros === null || fixture.actualCostUsdMicros <= labCase.maxCostUsdMicros);
  const out = input.fixture.output;
  keys(out, ["authority", "evidence", "gaps", "emailCandidate", "verification"]);
  requireCondition(out.authority === "EVIDENCE_CANDIDATE" && Array.isArray(out.evidence) && Array.isArray(out.gaps) && out.gaps.every(text));
  requireCondition(Array.isArray(input.expectedAssertions) && input.expectedAssertions.length > 0 && input.expectedAssertions.every(text));
  requireCondition(JSON.stringify(out.gaps) === JSON.stringify(input.expectedEvidenceGaps));
  for (const fact of out.evidence) {
    keys(fact, ["field", "value", "sourceRef", "provider", "method", "retrievedAt", "observedAt", "rightsClass"]);
    requireCondition([fact.field, fact.value, fact.sourceRef, fact.method].every(text));
    requireCondition(fact.provider === labCase.provider && fact.rightsClass === labCase.rightsClass);
    requireCondition(timestamp(fact.retrievedAt) && (fact.observedAt === null || timestamp(fact.observedAt)));
    requireCondition(!/connection|degree|authenticated|accepted|canonical|verifiedEmployment|^(account|person|employment|buyerRole|procurementRoute|facility|contact)Id$/i.test(fact.field));
    if (labCase.capabilityId === "DISCOVER_PUBLIC_PROFESSIONAL_PROFILE") {
      requireCondition(["publicProfileUrl", "fullName", "companyClaim", "titleClaim"].includes(fact.field));
      requireCondition(["PUBLIC_INDEX", "PUBLIC_SOURCE"].includes(fact.method));
    }
  }
  if (labCase.capabilityId === "VERIFY_EMPLOYMENT") {
    const conflicting = out.evidence.some(a => out.evidence.some(b => a.field === b.field && a.value !== b.value));
    if (conflicting) requireCondition(fixture.resultState === "PARTIAL" && out.gaps.some(gap => /conflict/i.test(gap)));
  }
  requireCondition(fixture.provenanceComplete === (out.evidence.length > 0));
  if (["ERROR", "PENDING", "EMPTY_WITHIN_RESPONSE", "UNKNOWN"].includes(fixture.resultState)) requireCondition(out.evidence.length === 0 && out.emailCandidate === null);
  if (["UNKNOWN", "PARTIAL", "ERROR", "PENDING"].includes(fixture.resultState)) requireCondition(out.gaps.length > 0);
  if (fixture.resultState === "PRESENT") requireCondition(out.evidence.length > 0 || out.emailCandidate !== null || out.verification !== null);
  if (out.emailCandidate !== null) {
    keys(out.emailCandidate, ["email", "state", "method"]);
    requireCondition(labCase.capabilityId === "FIND_PROFESSIONAL_EMAIL" && out.emailCandidate.state === "UNVERIFIED");
    requireCondition(["PUBLISHED", "GENERATED_PATTERN"].includes(out.emailCandidate.method));
    normalizeProspectingInput("VERIFY_PROFESSIONAL_EMAIL", { email: out.emailCandidate.email });
    if (out.emailCandidate.method === "PUBLISHED") requireCondition(out.evidence.some(e => e.field === "email" && e.value === out.emailCandidate?.email));
    requireCondition(out.gaps.length > 0);
  }
  if (out.verification !== null) {
    const v = out.verification;
    keys(v, ["state", "basis", "evidenceRef"]);
    requireCondition(labCase.capabilityId === "VERIFY_PROFESSIONAL_EMAIL");
    const states = { MAILBOX_PROOF: ["VERIFIED", "REJECTED"], SYNTAX_ONLY: ["UNKNOWN"], DOMAIN_ONLY: ["UNKNOWN"], MX_ONLY: ["UNKNOWN"], CATCH_ALL: ["CATCH_ALL"], UNAVAILABLE: ["UNKNOWN", "ERROR"], SERVICE_ERROR: ["ERROR"] };
    requireCondition(Object.hasOwn(states, v.basis) && states[v.basis].includes(v.state));
    if (["VERIFIED", "REJECTED", "CATCH_ALL"].includes(v.state)) {
      const request = normalizeProspectingInput("VERIFY_PROFESSIONAL_EMAIL", labCase.normalizedInput);
      requireCondition(fixture.resultState === "PRESENT" && out.evidence.some(e => e.sourceRef === v.evidenceRef && e.method === v.basis && e.field === "email" && e.value === request.email));
    } else {
      requireCondition(v.evidenceRef === null);
      requireCondition(v.state === "ERROR" ? fixture.resultState === "ERROR" : ["UNKNOWN", "PARTIAL", "PENDING"].includes(fixture.resultState));
    }
  }
  if (labCase.capabilityId === "VERIFY_PROFESSIONAL_EMAIL") requireCondition(out.verification !== null);
  if (labCase.capabilityId === "FIND_PROCUREMENT_ROUTE" && fixture.resultState === "PRESENT") requireCondition(out.evidence.length > 0);
  return { ...input, labCase, fixture: { ...fixture, output: normalizeLabJson(out) as typeof out } };
}

/** Cache identity is the existing request identity; freshness never upgrades authority. */
export function prospectingCacheIdentity(input: ProspectingFixture) {
  return requestFingerprint(validateProspectingFixture(input).labCase);
}
export function prospectingResultFingerprint(input: ProspectingFixture) {
  return labFingerprint(validateProspectingFixture(input).fixture);
}
export function prospectingFreshness(input: ProspectingFixture, asOf: string): "FRESH" | "STALE" | "UNKNOWN" {
  const { fixture, freshnessSeconds } = validateProspectingFixture(input);
  requireCondition(timestamp(asOf));
  if (fixture.observedAt === null) return "UNKNOWN";
  const age = Date.parse(asOf) - Date.parse(fixture.observedAt);
  return age < 0 ? "UNKNOWN" : age <= freshnessSeconds * 1000 ? "FRESH" : "STALE";
}
