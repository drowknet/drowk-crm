import type { CapabilityLabCase, SyntheticCapabilityFixture } from "./research.js";

export interface ProspectingInputs {
  SEARCH_WEB: { query: string; locale: string; geography: string; maxResults: number };
  EXTRACT_WEB_PAGE: { url: string; extractionGoal: string };
  DISCOVER_COMPANIES: { marketQuery: string; geography: string; maxResults: number; terms?: string[] };
  DISCOVER_PUBLIC_PROFESSIONAL_PROFILE: { fullName: string; companyName?: string; companyDomain?: string; titleHint?: string };
  FIND_BUYER_CANDIDATES: { companyName: string; companyDomain: string; roleTerms: string[]; geography?: string; facilityContext?: string; serviceCategory?: string };
  ENRICH_COMPANY: { companyDomain: string; fields: string[]; companyName?: string };
  FIND_PROFESSIONAL_EMAIL: { fullName: string; companyDomain: string; publishedPatternEvidence?: string };
  VERIFY_PROFESSIONAL_EMAIL: { email: string; expectedCompanyDomain?: string };
  VERIFY_EMPLOYMENT: { fullName: string; companyName: string; companyDomain?: string; claimedTitle?: string; publicProfileUrl?: string };
  FIND_PROCUREMENT_ROUTE: { companyName: string; companyDomain: string; serviceCategory: string; geography?: string; facilityContext?: string };
}
export type ProspectingCapability = keyof ProspectingInputs;
export type EmailVerificationState = "VERIFIED" | "REJECTED" | "CATCH_ALL" | "UNKNOWN" | "ERROR";

/** Each field is an attributable candidate, never an accepted entity identifier. */
export type ProspectingEvidence = {
  field: string; value: string; sourceRef: string; provider: string; method: string;
  retrievedAt: string; observedAt: string | null; rightsClass: "SYNTHETIC_ALLOWED";
};
export type ProspectingOutput = {
  authority: "EVIDENCE_CANDIDATE";
  evidence: ProspectingEvidence[];
  gaps: string[];
  emailCandidate: { email: string; state: "UNVERIFIED"; method: "PUBLISHED" | "GENERATED_PATTERN" } | null;
  verification: { state: EmailVerificationState; basis: "MAILBOX_PROOF" | "SYNTAX_ONLY" | "DOMAIN_ONLY" | "MX_ONLY" | "CATCH_ALL" | "UNAVAILABLE" | "SERVICE_ERROR"; evidenceRef: string | null } | null;
};

/** Wraps the existing lab records; introduces no run or persistence architecture. */
export type ProspectingFixture = {
  labCase: CapabilityLabCase;
  fixture: SyntheticCapabilityFixture & { output: ProspectingOutput };
  expectedEvidenceGaps: string[];
  expectedAssertions: string[];
  maxElapsedMs: number;
  freshnessSeconds: number;
};
