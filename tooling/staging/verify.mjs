import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { preflight, root } from "../harness/run.mjs";
import { git } from "../harness/secrets.mjs";
import { runtimeEnvironment, revision } from "../runtime/verify.mjs";
import { checkSecretFiles, resolvedManifest, stagingConfig, verifyManifest } from "./contract.mjs";
import { renderCompose } from "./preflight.mjs";
import { killPlan, rollbackPlan } from "./plans.mjs";

export function syntheticConfig(directory, sha = "a".repeat(40)) {
  return { DROWK_STAGING_SHA: sha,
    DROWK_STAGING_API_IMAGE: `example.invalid/drowk/api@sha256:${"1".repeat(64)}`,
    DROWK_STAGING_WORKER_IMAGE: `example.invalid/drowk/worker@sha256:${"2".repeat(64)}`,
    DROWK_STAGING_ACCESS_ISSUER: "https://synthetic.invalid", DROWK_STAGING_ACCESS_AUDIENCE: "synthetic",
    DROWK_STAGING_DATABASE_URL_FILE: join(directory, "database-url"), DROWK_STAGING_TUNNEL_TOKEN_FILE: join(directory, "tunnel-input") };
}

export async function withSyntheticFiles(work) {
  const directory = mkdtempSync(join(tmpdir(), "drowk-ef03-"));
  try {
    // Nonfunctional fixtures only, never a provider credential or a real host.
    const env = syntheticConfig(directory);
    writeFileSync(env.DROWK_STAGING_DATABASE_URL_FILE, "postgresql://synthetic.invalid/staging_test?sslmode=verify-full\n", { mode: 0o600 });
    writeFileSync(env.DROWK_STAGING_TUNNEL_TOKEN_FILE, "synthetic\n", { mode: 0o600 });
    return await work(env);
  } finally {
    rmSync(directory, { recursive: true, force: true });
    assert.equal(existsSync(directory), false, "STAGING_TEMP_CLEANUP_FAILED");
  }
}

export async function main() {
  preflight();
  const sha = revision(git(root, ["rev-parse", "HEAD"]).trim());
  if (process.env.CI === "true" && git(root, ["status", "--porcelain"]).trim()) throw new Error("STAGING_CLEAN_HEAD_REQUIRED");
  try {
    execFileSync(process.execPath, ["--test", "tooling/staging/staging.test.mjs"], { cwd: root,
      env: runtimeEnvironment(process.env), stdio: ["ignore", "pipe", "pipe"], timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  } catch { throw new Error("STAGING_TEST_FAILED"); }
  let rendered = false;
  try {
    await withSyntheticFiles(async input => {
      const env = stagingConfig({ ...input, DROWK_STAGING_SHA: sha });
      checkSecretFiles(env);
      verifyManifest(resolvedManifest(env), env);
      renderCompose(env);
      rendered = true;
      const current = { sha, api: env.DROWK_STAGING_API_IMAGE, worker: env.DROWK_STAGING_WORKER_IMAGE };
      const previous = { sha: "b".repeat(40), api: `example.invalid/drowk/api@sha256:${"3".repeat(64)}`,
        worker: `example.invalid/drowk/worker@sha256:${"4".repeat(64)}` };
      rollbackPlan({ current, previous });
      killPlan();
    });
  } finally { console.log("STAGING_VALIDATION_FINISHED no-containers-created=true no-networks-created=true no-volumes-created=true"); }
  if (rendered) {
    console.log("STAGING_RENDER_PASS host-ports=0 local-db=0 worker-network=none migration=explicit");
    console.log("STAGING_PLANS_PASS rollback=immutable kill=cloudflared,api,worker execution=false");
    console.log("STAGING_CLEANUP_PASS temp-files=0");
    console.log(`STAGING_VERIFY_PASS revision=${sha} live-requests=0`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error();
    await main();
  } catch { console.error("STAGING_VERIFY_FAILED_CLOSED"); process.exitCode = 1; }
}
