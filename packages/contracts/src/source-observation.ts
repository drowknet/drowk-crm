import type {
  ObservationId,
  RunScoped,
  Sha256Digest,
  TenantScoped,
  IsoDateTime,
} from "./ids.js";

export interface SourceObservation extends TenantScoped, RunScoped {
  id: ObservationId;
  sourceSystem: string;
  sourceNativeId: string;
  sourceRevision: string | null;
  observedAt: IsoDateTime | null;
  effectiveAt: IsoDateTime | null;
  retrievedAt: IsoDateTime;
  ingestedAt: IsoDateTime;
  recordedAt: IsoDateTime;
  sourceWatermark: string | null;
  adapterVersion: string;
  fingerprint: Sha256Digest;
  rawArtifactRef: string | null;
}
