import { createHash } from "node:crypto";
import type { SourceObservation } from "@drowk/contracts";

/** Provider fields only. Ownership, relevance and identity are derived separately. */
export interface GmailObservationInput {
  messageId: string;
  threadId: string;
  providerRevision: string | null;
  messageDate: SourceObservation["observedAt"];
  internalDate: SourceObservation["effectiveAt"];
  retrievedAt: SourceObservation["retrievedAt"];
  from: string;
  to: readonly string[];
  cc: readonly string[];
  subject: string;
  labels: readonly string[];
  mailboxRef: string;
  connectorRef: string;
  sourceWatermark: string | null;
  adapterVersion: string;
  rawArtifactRef: string | null;
}

export type GmailObservationLineage = Pick<
  SourceObservation,
  "id" | "runId" | "correlationId" | "ingestedAt" | "recordedAt"
>;

/** Stable across retrievals and sync cursors; those are audit context, not message state. */
export function gmailSourceFingerprint(input: GmailObservationInput): SourceObservation["fingerprint"] {
  const state = {
    messageId: input.messageId,
    threadId: input.threadId,
    providerRevision: input.providerRevision,
    messageDate: input.messageDate,
    internalDate: input.internalDate,
    from: input.from,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    labels: [...new Set(input.labels)].sort(),
    mailboxRef: input.mailboxRef,
    connectorRef: input.connectorRef,
  };
  return `sha256:${createHash("sha256").update(JSON.stringify(state)).digest("hex")}` as SourceObservation["fingerprint"];
}

export function toSourceObservation(
  input: GmailObservationInput,
  lineage: GmailObservationLineage,
): Omit<SourceObservation, "tenantId"> {
  if (!input.messageId || !input.threadId || !input.mailboxRef || !input.connectorRef || !input.adapterVersion) {
    throw new Error("Gmail observation requires source, mailbox and adapter identifiers.");
  }
  return {
    ...lineage,
    sourceSystem: "gmail",
    sourceNativeId: input.messageId,
    sourceRevision: input.providerRevision,
    observedAt: input.messageDate,
    effectiveAt: input.internalDate,
    retrievedAt: input.retrievedAt,
    sourceWatermark: input.sourceWatermark,
    adapterVersion: input.adapterVersion,
    fingerprint: gmailSourceFingerprint(input),
    rawArtifactRef: input.rawArtifactRef,
    sourceMetadata: {
      gmail: {
        messageId: input.messageId,
        threadId: input.threadId,
        providerRevision: input.providerRevision,
        messageDate: input.messageDate,
        internalDate: input.internalDate,
        from: input.from,
        to: [...input.to],
        cc: [...input.cc],
        subject: input.subject,
        labels: [...input.labels],
        mailboxRef: input.mailboxRef,
        connectorRef: input.connectorRef,
      },
    },
  };
}
