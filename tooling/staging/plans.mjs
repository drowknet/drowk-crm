import { imageRef } from "./contract.mjs";
import { revision } from "../runtime/verify.mjs";

export function rollbackPlan(input) {
  const current = { sha: revision(input.current.sha), api: imageRef(input.current.api), worker: imageRef(input.current.worker) };
  const previous = { sha: revision(input.previous.sha), api: imageRef(input.previous.api), worker: imageRef(input.previous.worker) };
  return { kind: "STAGING_ROLLBACK_PLAN", executable: false, ownerGate: "REQUIRED", current, previous,
    steps: ["Stop cloudflared first", "Verify previous API/worker digest and revision labels locally",
      "Confirm existing schema is compatible; stop for review if not", "Select previous immutable API/worker refs",
      "Restart API and inert worker only after live authorization", "Verify internal health/readiness under the authorized plan",
      "Restore cloudflared only after the authorized readiness gate"],
    schemaRollback: false, migrationsAutomatic: false, managedDatabasePreserved: true, secretSourcePreserved: true };
}

export function killPlan() {
  const compose = ["docker", "compose", "--project-name", "drowk-staging", "--file", "infra/staging/compose.yaml"];
  return { kind: "STAGING_KILL_PLAN", executable: false, ownerGate: "REQUIRED", services: ["cloudflared", "api", "worker"],
    commandArgv: [[...compose, "stop", "cloudflared"], [...compose, "stop", "api", "worker"]],
    firstStop: "cloudflared", migrationMustBeQuiescent: true, managedDatabasePreserved: true, secretSourcePreserved: true,
    deletesVolumes: false, externalSmokeAuthorized: false };
}
