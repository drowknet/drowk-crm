import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { preflight as repositoryPreflight, root } from "../harness/run.mjs";
import { git } from "../harness/secrets.mjs";
import { runtimeEnvironment } from "../runtime/verify.mjs";
import { stagingConfig, checkSecretFiles, resolvedManifest, verifyManifest, manifestUrl, revisionEvidence } from "./contract.mjs";

// This module only invokes Docker metadata/render commands, never pull/build/run/up.
export function dockerMetadata(args, env) {
  try { return execFileSync("docker", args, { cwd: root, env: { ...runtimeEnvironment(process.env), ...env },
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true, timeout: 30000, maxBuffer: 4 * 1024 * 1024 }).trim(); }
  catch { throw new Error("STAGING_DOCKER_METADATA_FAILED"); }
}

export function renderCompose(env, run = dockerMetadata) {
  run(["compose", "version"], {});
  const text = run(["compose", "--env-file", process.platform === "win32" ? "NUL" : "/dev/null",
    "--project-name", "drowk-staging", "--file", fileURLToPath(manifestUrl), "--profile", "migration", "config", "--format", "json"], env);
  const rendered = JSON.parse(text);
  verifyManifest(rendered, env);
  return rendered;
}

export function releaseIdentity(head, status, selected) {
  if (head !== selected || status.trim()) throw new Error("STAGING_CLEAN_SELECTED_HEAD_REQUIRED");
}

export function preflight(input, run = dockerMetadata) {
  repositoryPreflight();
  const env = stagingConfig(input);
  releaseIdentity(git(root, ["rev-parse", "HEAD"]).trim(), git(root, ["status", "--porcelain"]), env.DROWK_STAGING_SHA);
  const permissions = checkSecretFiles(env);
  verifyManifest(resolvedManifest(env), env);
  renderCompose(env, run);
  const context = JSON.parse(run(["context", "inspect"], {}));
  if (!/^(?:npipe:\/\/|unix:\/\/)/.test(context[0]?.Endpoints?.docker?.Host ?? "")) throw new Error("STAGING_LOCAL_DOCKER_REQUIRED");
  const images = {};
  for (const [service, key] of [["api", "DROWK_STAGING_API_IMAGE"], ["worker", "DROWK_STAGING_WORKER_IMAGE"]]) {
    images[service] = JSON.parse(run(["image", "inspect", env[key]], {}))[0];
  }
  revisionEvidence(images, env);
  return { status: "STAGING_PREFLIGHT_PASS", revision: env.DROWK_STAGING_SHA, hostPorts: 0, localDatabases: 0,
    secretPermissions: permissions, externalEffects: 0, deploymentAuthorized: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 2) throw new Error();
    console.log(JSON.stringify(preflight(process.env)));
  } catch { console.error("STAGING_PREFLIGHT_FAILED_CLOSED"); process.exitCode = 1; }
}
