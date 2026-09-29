import type {
  CapabilityLabCase, IsoDateTime, JsonValue, LiveProviderAuditInput,
  ProviderRun, ResearchRun, TenantId,
} from "@drowk/contracts";
import { labFingerprint, normalizeLabJson, requestFingerprint, validateLabCase } from "@drowk/domain";

export const AISA_ORIGIN = "https://api.aisa.one";
export const BUSINESS_LISTINGS_PATH = "/apis/v1/dataforseo/business_data/business_listings/search/live";
export const BUSINESS_LISTINGS_OPERATION = `POST ${BUSINESS_LISTINGS_PATH}`;
export const BUSINESS_LISTINGS_ADAPTER_VERSION = "aisa-dataforseo-business-listings-v1";
export const BUSINESS_LISTINGS_TIMEOUT_MS = 12_000;
const FIRST_INPUT = { title: "Fastenal", location_coordinate: "33.4484,-112.0740,25", limit: 5 };
export const FIRST_CASE_ID = "dcrm-05c-fastenal-phoenix-1";

export interface SelectedBusinessListingsCase extends CapabilityLabCase {
  transport: "aisa";
  interface: "AISA_REST";
  accessClass: "READ";
}

export interface AisaTransportRequest {
  url: typeof AISA_ORIGIN | `${typeof AISA_ORIGIN}${typeof BUSINESS_LISTINGS_PATH}`;
  method: "POST";
  headers: { Authorization: string; "Content-Type": "application/json" };
  body: string;
  signal: AbortSignal;
  redirect: "error";
  timeoutMs: typeof BUSINESS_LISTINGS_TIMEOUT_MS;
}
export interface AisaTransport {
  send(request: AisaTransportRequest): Promise<{ status: number; body: unknown }>;
}

/** Internal transport: external callers can dispatch only through the gated harness. */
function createAisaHttpTransport(): AisaTransport {
  return {
    async send(request) {
      if (request.url !== `${AISA_ORIGIN}${BUSINESS_LISTINGS_PATH}` ||
          request.method !== "POST" || request.redirect !== "error") {
        throw new Error("AISA_DESTINATION_NOT_ALLOWED");
      }
      const response = await fetch(request.url, {
        method: "POST", headers: request.headers, body: request.body,
        signal: request.signal, redirect: "error",
      });
      return { status: response.status, body: await response.json().catch(() => null) };
    },
  };
}

export interface AisaRuntimeConfig {
  liveValidationEnabled: boolean;
  apiKey: string | null;
}
export function aisaRuntimeConfig(env: Record<string, string | undefined>): AisaRuntimeConfig {
  return {
    liveValidationEnabled: env.DROWK_AISA_LIVE_VALIDATION_ENABLED === "true",
    apiKey: env.AISA_API_KEY?.trim() || null,
  };
}

export interface AisaLabStore {
  getResearchRun(tenantId: TenantId, id: string): Promise<ResearchRun | null>;
  claimSelectedLiveValidation(tenantId: TenantId, id: string,
    labCase: CapabilityLabCase, at: IsoDateTime): Promise<ResearchRun>;
  appendClaimedLiveResult(tenantId: TenantId, id: string,
    record: LiveProviderAuditInput): Promise<ProviderRun>;
}

export class AisaValidationError extends Error {
  constructor(readonly code: string) { super(code); this.name = "AisaValidationError"; }
}

export function normalizeBusinessListingsCase(value: CapabilityLabCase): SelectedBusinessListingsCase {
  const labCase = validateLabCase(value);
  const input = normalizeLabJson(labCase.normalizedInput);
  if (Object.keys(labCase).sort().join(",") !==
      "accessClass,adapterVersion,capabilityId,caseId,geography,interface,locale,maxCostUsdMicros,maxToolCalls,normalizedInput,operation,provider,rightsClass,stopCondition,transport,workloadCell" ||
      labCase.capabilityId !== "DISCOVER_BUSINESS_LISTINGS" ||
      labCase.caseId !== FIRST_CASE_ID ||
      labCase.workloadCell !== "FACILITY_LOCATION_DISCOVERY" ||
      labCase.provider !== "dataforseo" || labCase.transport !== "aisa" ||
      labCase.operation !== BUSINESS_LISTINGS_OPERATION || labCase.interface !== "AISA_REST" ||
      labCase.accessClass !== "READ" || labCase.maxCostUsdMicros !== 15000 ||
      labCase.maxToolCalls !== 1 || labCase.stopCondition !== "EVIDENCE_PRESENT" ||
      labCase.adapterVersion !== BUSINESS_LISTINGS_ADAPTER_VERSION ||
      labCase.rightsClass !== "PUBLIC_BUSINESS_LISTING" ||
      labCase.locale !== "en-US" || labCase.geography !== "US" ||
      input === null || Array.isArray(input) || typeof input !== "object" ||
      Object.keys(input).sort().join(",") !== "limit,location_coordinate,title" ||
      typeof input.limit !== "number" || !Number.isInteger(input.limit) ||
      input.limit < 1 || input.limit > 5 ||
      input.title !== FIRST_INPUT.title ||
      input.location_coordinate !== FIRST_INPUT.location_coordinate ||
      input.limit !== FIRST_INPUT.limit) {
    throw new AisaValidationError("AISA_SELECTED_CASE_REQUIRED");
  }
  return { ...labCase, transport: "aisa", interface: "AISA_REST",
    accessClass: "READ", normalizedInput: input };
}

type SafeResult = Pick<LiveProviderAuditInput,
  "responseFingerprint" | "resultState" | "actualCostUsdMicros" | "actualCostKnown" |
  "observedAt" | "provenanceComplete" | "providerTaskId" | "providerCid" |
  "providerFeatureId" | "safeSummary" | "safeStatusCodes" | "safeErrorCategory">;
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): ObjectValue | null =>
  value !== null && !Array.isArray(value) && typeof value === "object"
    ? value as ObjectValue : null;
const publicId = (value: unknown): string | null =>
  (typeof value === "string" && value.length > 0 && value.length <= 256)
    ? value : (typeof value === "number" && Number.isSafeInteger(value)) ? String(value) : null;
const integer = (value: unknown): number | null =>
  typeof value === "number" && Number.isInteger(value) ? value : null;
const text = (value: unknown, max = 256): string | null =>
  typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
const number = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

function moneyMicros(value: unknown): number | null | "INVALID" {
  if (value === null || value === undefined) return null;
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !/^\d+(?:\.\d{1,6})?$/.test(raw)) return "INVALID";
  const [whole = "0", fraction = ""] = raw.split(".");
  const micros = Number(whole) * 1_000_000 + Number(fraction.padEnd(6, "0"));
  return Number.isSafeInteger(micros) ? micros : "INVALID";
}
function observed(value: unknown): IsoDateTime | null {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT/.test(value)) return null;
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? null : instant.toISOString() as IsoDateTime;
}
function safeBusiness(value: unknown): JsonValue | null {
  const item = object(value);
  if (!item) return null;
  const title = text(item.title, 200);
  if (!title) return null;
  const location = object(item.address_info);
  const addressParts = location ? {
    address: text(location.address), city: text(location.city),
    region: text(location.region), postal_code: text(location.postal_code),
    country_code: text(location.country_code),
  } : null;
  const address = text(item.address) ??
    (addressParts ? Object.fromEntries(Object.entries(addressParts).filter(([, v]) => v !== null)) : null);
  const cid = publicId(item.cid), featureId = publicId(item.feature_id);
  const domain = text(item.domain);
  const latitude = number(item.latitude), longitude = number(item.longitude);
  if (!address && !cid && !featureId && !domain && (latitude === null || longitude === null)) return null;
  const rating = object(item.rating);
  return Object.fromEntries(Object.entries({
    title, category: text(item.category), address, domain,
    latitude, longitude, rating: number(rating?.value ?? item.rating),
    cid, feature_id: featureId,
  }).filter(([, v]) => v !== null)) as JsonValue;
}

function safeResult(resultState: SafeResult["resultState"], fields: Omit<SafeResult, "responseFingerprint" | "resultState">): SafeResult {
  const responseFingerprint = labFingerprint({ resultState, ...fields });
  return { resultState, responseFingerprint, ...fields };
}
function errorResult(category: string, statusCodes: JsonValue | null = null,
  actualCostUsdMicros: number | null = null, providerTaskId: string | null = null): SafeResult {
  return safeResult("ERROR", {
    actualCostUsdMicros, actualCostKnown: actualCostUsdMicros !== null,
    observedAt: null, provenanceComplete: providerTaskId !== null, providerTaskId,
    providerCid: null, providerFeatureId: null, safeSummary: null,
    safeStatusCodes: statusCodes, safeErrorCategory: category,
  });
}

/** Reads only documented, public-business fields. Raw upstream JSON is discarded. */
export function normalizeBusinessListingsResponse(httpStatus: number, body: unknown): SafeResult {
  if (httpStatus < 200 || httpStatus >= 300) {
    const category = httpStatus === 401 || httpStatus === 403 ? "HTTP_AUTH"
      : httpStatus === 402 ? "HTTP_PAYMENT" : httpStatus === 429 ? "HTTP_RATE"
        : httpStatus >= 500 ? "HTTP_SERVER" : "HTTP_OTHER";
    return errorResult(category, { http: httpStatus });
  }
  const root = object(body);
  const task = Array.isArray(root?.tasks) && root.tasks.length === 1 ? object(root.tasks[0]) : null;
  const taskId = publicId(task?.id);
  const statusCodes = { http: httpStatus, provider: integer(root?.status_code),
    task: integer(task?.status_code), tasksError: integer(root?.tasks_error) };
  if (!root || !task || statusCodes.provider === null || statusCodes.task === null ||
      statusCodes.tasksError === null) return errorResult("SCHEMA", statusCodes, null, taskId);
  const taskCost = moneyMicros(task.cost), rootCost = moneyMicros(root.cost);
  if (taskCost === "INVALID" || rootCost === "INVALID" ||
      (taskCost !== null && rootCost !== null && taskCost !== rootCost)) {
    return errorResult("SCHEMA", statusCodes, null, taskId);
  }
  const actualCost = taskCost ?? rootCost;
  if (actualCost !== null && actualCost > 15000) {
    return errorResult("COST_ENVELOPE", statusCodes, actualCost, taskId);
  }
  if (statusCodes.provider !== 20000 || statusCodes.tasksError !== 0) {
    return errorResult("PROVIDER_STATUS", statusCodes, actualCost, taskId);
  }
  if (statusCodes.task !== 20000) return errorResult("TASK_STATUS", statusCodes, actualCost, taskId);
  const results = Array.isArray(task.result) && task.result.length === 1 ? object(task.result[0]) : null;
  if (!results || !Array.isArray(results.items)) return errorResult("SCHEMA", statusCodes, actualCost, taskId);
  const businesses = results.items.map(safeBusiness).filter((item): item is JsonValue => item !== null);
  if (results.items.length > 0 && businesses.length !== results.items.length) {
    return errorResult("MIXED_RESPONSE", statusCodes, actualCost, taskId);
  }
  const first = object(businesses[0]);
  const summary: JsonValue = { businesses };
  return safeResult(businesses.length > 0 ? "PRESENT" : "EMPTY_WITHIN_RESPONSE", {
    actualCostUsdMicros: actualCost, actualCostKnown: actualCost !== null,
    observedAt: observed(task.observed_at ?? root.observed_at),
    provenanceComplete: taskId !== null,
    providerTaskId: taskId, providerCid: publicId(first?.cid),
    providerFeatureId: publicId(first?.feature_id), safeSummary: summary,
    safeStatusCodes: statusCodes, safeErrorCategory: null,
  });
}

/** One claimed dispatch, one append-only audit row. No retry or CRM projection. */
export async function executeSelectedBusinessListings(input: {
  tenantId: TenantId; researchRunId: string; providerRunId: string;
  labCase: CapabilityLabCase; config: AisaRuntimeConfig;
  store: AisaLabStore; transport?: AisaTransport; now: () => IsoDateTime;
}): Promise<ProviderRun> {
  if (!input.config.liveValidationEnabled) throw new AisaValidationError("AISA_LIVE_DISABLED");
  if (!input.config.apiKey) throw new AisaValidationError("AISA_KEY_REQUIRED");
  const labCase = normalizeBusinessListingsCase(input.labCase);
  const run = await input.store.getResearchRun(input.tenantId, input.researchRunId);
  if (!run || run.status !== "RUNNING" || run.question.maxCostUsdMicros !== 15000 ||
      run.question.maxToolCalls !== 1 || run.question.stopCondition !== "EVIDENCE_PRESENT" ||
      !run.question.allowedCapabilities.includes(labCase.capabilityId)) {
    throw new AisaValidationError("AISA_RESEARCH_NOT_AUTHORIZED");
  }
  const requestHash = requestFingerprint(labCase);
  await input.store.claimSelectedLiveValidation(input.tenantId, input.researchRunId,
    labCase, input.now());
  const inputBody = labCase.normalizedInput as Record<string, JsonValue>;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<{ timedOut: true }>(resolve => {
    timeout = setTimeout(() => { controller.abort(); resolve({ timedOut: true }); },
      BUSINESS_LISTINGS_TIMEOUT_MS);
  });
  const started = Date.now();
  let result: SafeResult;
  try {
    const response = await Promise.race([(input.transport ?? createAisaHttpTransport()).send({
      url: `${AISA_ORIGIN}${BUSINESS_LISTINGS_PATH}`, method: "POST",
      headers: { Authorization: `Bearer ${input.config.apiKey}`,
        "Content-Type": "application/json" },
      body: JSON.stringify([inputBody]), signal: controller.signal,
      redirect: "error", timeoutMs: BUSINESS_LISTINGS_TIMEOUT_MS,
    }), deadline]);
    if ("timedOut" in response) result = errorResult("TIMEOUT");
    else if (JSON.stringify(response.body)?.includes(input.config.apiKey)) {
      result = errorResult("SCHEMA");
    } else result = normalizeBusinessListingsResponse(response.status, response.body);
  } catch (error) {
    result = errorResult(error instanceof Error && error.name === "AbortError"
      ? "TIMEOUT" : "NETWORK");
  } finally { if (timeout) clearTimeout(timeout); }
  const audit: LiveProviderAuditInput = {
    id: input.providerRunId, labCase, requestFingerprint: requestHash,
    responseFingerprint: result.responseFingerprint, resultState: result.resultState,
    estimatedCostUsdMicros: 12000 + 360 * Number(inputBody.limit),
    actualCostUsdMicros: result.actualCostUsdMicros,
    actualCostKnown: result.actualCostKnown,
    retrievedAt: input.now(), observedAt: result.observedAt,
    latencyMs: Math.max(0, Date.now() - started),
    provenanceComplete: result.provenanceComplete,
    providerTaskId: result.providerTaskId, providerCid: result.providerCid,
    providerFeatureId: result.providerFeatureId, safeSummary: result.safeSummary,
    safeStatusCodes: result.safeStatusCodes, safeErrorCategory: result.safeErrorCategory,
  };
  return input.store.appendClaimedLiveResult(input.tenantId, input.researchRunId, audit);
}
