import { randomUUID } from "node:crypto";
import type { CapabilityId, CapabilityLabCase, IsoDateTime, ProviderRun, ResearchRun,
  TenantId } from "@drowk/contracts";
import { requestFingerprint } from "@drowk/domain";
import {
  type AisaLabStore, type AisaRuntimeConfig, type AisaTransport,
  AisaValidationError, BUSINESS_LISTINGS_ADAPTER_VERSION,
  BUSINESS_LISTINGS_OPERATION, FIRST_CASE_ID,
  executeSelectedBusinessListings, normalizeBusinessListingsCase,
} from "./business-listings.js";

export const selectedBusinessListingsCase = (): CapabilityLabCase =>
  normalizeBusinessListingsCase({
    caseId: FIRST_CASE_ID, capabilityId: "DISCOVER_BUSINESS_LISTINGS" as CapabilityId,
    workloadCell: "FACILITY_LOCATION_DISCOVERY", provider: "dataforseo",
    transport: "aisa", operation: BUSINESS_LISTINGS_OPERATION,
    interface: "AISA_REST", accessClass: "READ",
    normalizedInput: { title: "Fastenal", location_coordinate: "33.4484,-112.0740,25", limit: 5 },
    locale: "en-US", geography: "US", maxCostUsdMicros: 15000,
    maxToolCalls: 1, stopCondition: "EVIDENCE_PRESENT",
    rightsClass: "PUBLIC_BUSINESS_LISTING",
    adapterVersion: BUSINESS_LISTINGS_ADAPTER_VERSION,
  });

export interface OneShotStore extends AisaLabStore {
  createResearchRun(tenantId: TenantId, run: ResearchRun): Promise<ResearchRun>;
  startResearchRun(tenantId: TenantId, id: string, at: IsoDateTime): Promise<ResearchRun>;
  getLiveDispatchStatus(tenantId: TenantId, id: string): Promise<{
    disposition: "UNCLAIMED" | "UNKNOWN" | "RECORDED" | "RECONCILED";
    providerRunId: string | null;
  } | null>;
  markClaimedLiveDispatchUnknown(tenantId: TenantId, id: string, at: IsoDateTime): Promise<unknown>;
}

export interface OneShotOutcome {
  disposition: "DRY_RUN" | "RECORDED" | "UNKNOWN" | "UNCLAIMED";
  researchRunId: string | null;
  providerRunId: string | null;
  resultState: ProviderRun["resultState"] | null;
  actualCostUsdMicros: number | null;
  actualCostKnown: boolean;
  requestFingerprint: string;
  exitCode: 0 | 1;
}

/** No real transport is created in dry-run; live mode remains separately gated. */
export async function runSelectedBusinessListingsOnce(input: {
  mode: "DRY_RUN" | "LIVE"; tenantId: TenantId;
  config: AisaRuntimeConfig; store?: OneShotStore;
  transport?: AisaTransport; now: () => IsoDateTime;
}): Promise<OneShotOutcome> {
  const labCase = selectedBusinessListingsCase();
  const fingerprint = requestFingerprint(labCase);
  const empty = { researchRunId: null, providerRunId: null, resultState: null,
    actualCostUsdMicros: null, actualCostKnown: false, requestFingerprint: fingerprint };
  if (input.mode === "DRY_RUN") return { ...empty, disposition: "DRY_RUN", exitCode: 0 };
  if (!input.config.liveValidationEnabled) throw new AisaValidationError("AISA_LIVE_DISABLED");
  if (!input.config.apiKey) throw new AisaValidationError("AISA_KEY_REQUIRED");
  if (!input.store) throw new AisaValidationError("AISA_STORE_REQUIRED");
  const store = input.store;
  const researchRunId = randomUUID(), providerRunId = randomUUID();
  const run: ResearchRun = {
    id: researchRunId, tenantId: input.tenantId,
    runId: randomUUID() as ResearchRun["runId"],
    correlationId: randomUUID() as ResearchRun["correlationId"],
    question: { text: "DCRM-05C bounded public business listing validation",
      entityCandidates: [], requiredEvidence: ["provider listing evidence"],
      freshnessSeconds: null, maxCostUsdMicros: 15000, maxToolCalls: 1,
      allowedCapabilities: ["DISCOVER_BUSINESS_LISTINGS" as CapabilityId],
      stopCondition: "EVIDENCE_PRESENT" },
    status: "PLANNED", outputEvidenceIds: [], startedAt: null, completedAt: null,
  };
  await store.createResearchRun(input.tenantId, run);
  await store.startResearchRun(input.tenantId, researchRunId, input.now());
  try {
    const result = await executeSelectedBusinessListings({
      tenantId: input.tenantId, researchRunId, providerRunId,
      labCase, config: input.config, store,
      ...(input.transport ? { transport: input.transport } : {}),
      now: input.now,
    });
    const status = await store.getLiveDispatchStatus(input.tenantId, researchRunId);
    return { ...empty, researchRunId, providerRunId: result.id,
      resultState: result.resultState, actualCostUsdMicros: result.actualCostUsdMicros,
      actualCostKnown: result.actualCostKnown,
      disposition: status?.disposition === "UNKNOWN" ? "UNKNOWN" : "RECORDED",
      exitCode: result.resultState === "ERROR" || status?.disposition !== "RECORDED" ? 1 : 0 };
  } catch {
    // A committed claim may already have reached the provider. Never retry it.
    const status = await store.getLiveDispatchStatus(input.tenantId, researchRunId)
      .catch(() => null);
    if (status?.disposition === "UNKNOWN") {
      await store.markClaimedLiveDispatchUnknown(input.tenantId, researchRunId,
        input.now()).catch(() => undefined);
      return { ...empty, researchRunId, providerRunId: status.providerRunId,
        disposition: "UNKNOWN", exitCode: 1 };
    }
    return { ...empty, researchRunId, providerRunId: status?.providerRunId ?? null,
      disposition: status?.disposition === "UNCLAIMED" ? "UNCLAIMED" :
        status?.disposition === "RECORDED" ? "RECORDED" : "UNKNOWN",
      exitCode: 1 };
  }
}
