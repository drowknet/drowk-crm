import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { forbiddenPath, formatFindings, git, trackedPaths } from "./secrets.mjs";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const modes = ["preflight", "fast", "full", "ci", "integration"];

export function integrationBoundary(env) {
  if (env.DROWK_TEST_DISPOSABLE !== "1" || env.APP_ENV !== "test") throw new Error("INTEGRATION_GUARDS_REQUIRED");
  let url;
  try { url = new URL(env.DROWK_TEST_DATABASE_URL); } catch { throw new Error("INTEGRATION_URL_REQUIRED"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      !/^\/[a-zA-Z0-9_]+_(?:test|ci)$/.test(url.pathname) || url.search || url.hash) {
    throw new Error("INTEGRATION_DISPOSABLE_LOCAL_ONLY");
  }
  return url;
}

// Allow only OS/package-manager plumbing; no inherited provider, OAuth or database credentials.
export function childEnvironment(env, integration = false) {
  const output = {};
  for (const [key, value] of Object.entries(env)) {
    if (/^(?:PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|TEMP|TMP|TMPDIR|npm_execpath|npm_node_execpath)$/i.test(key)) output[key] = value;
  }
  Object.assign(output, { CI: "true", APP_ENV: "test", DROWK_AISA_LIVE_VALIDATION_ENABLED: "false" });
  if (integration) {
    const url = integrationBoundary(env);
    Object.assign(output, { DROWK_TEST_DISPOSABLE: "1", DROWK_TEST_DATABASE_URL: url.href,
      DATABASE_URL: url.href, PGHOST: url.hostname === "[::1]" ? "::1" : url.hostname,
      PGPORT: url.port || "5432", PGDATABASE: url.pathname.slice(1),
      PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password) });
  }
  return output;
}

export function preflight() {
  if (realpathSync(process.cwd()) !== realpathSync(root) ||
      realpathSync(git(root, ["rev-parse", "--show-toplevel"]).trim()) !== realpathSync(root)) throw new Error("ROOT_REQUIRED");
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  if (pkg.name !== "@drowk/crm" || pkg.packageManager !== "pnpm@10.17.1") throw new Error("PACKAGE_IDENTITY_REQUIRED");
  const remote = git(root, ["remote", "get-url", "origin"]).trim();
  if (!/^(?:https:\/\/github\.com\/|git@(?:github\.com|github-drowk-crm):)drowknet\/drowk-crm(?:\.git)?$/.test(remote)) throw new Error("REPOSITORY_IDENTITY_REQUIRED");
  const head = git(root, ["rev-parse", "--verify", "HEAD"]).trim();
  const branch = git(root, ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  if (!/^[a-f0-9]{40}$/.test(head) || !branch) throw new Error("GIT_STATE_REQUIRED");
  // Detached HEAD is expected for GitHub pull_request checkouts.
  const lock = readFileSync(resolve(root, "pnpm-lock.yaml"), "utf8");
  if (!/^lockfileVersion: '9\.0'\r?$/m.test(lock) || /^(?:<<<<<<<|=======|>>>>>>>)/m.test(lock)) throw new Error("LOCKFILE_INVALID");
  const findings = trackedPaths(root).filter(forbiddenPath).map(path => ({ detector: "SECRET_FILE", path }));
  if (findings.length) { console.error(formatFindings(findings)); throw new Error("TRACKED_SECRET_FILE"); }
  console.log("HARNESS_PREFLIGHT_PASS");
}

export function plan(mode) {
  if (!modes.includes(mode)) throw new Error("HARNESS_MODE_REQUIRED");
  if (mode === "preflight") return [];
  if (mode === "integration") return [
    ["pnpm", "build"],
    ["pnpm", "--filter", "@drowk/db", "migrate", "plan"],
    ["pnpm", "--filter", "@drowk/db", "migrate", "apply"],
    ["pnpm", "--filter", "@drowk/db", "migrate", "status"],
    ["psql", "-v", "ON_ERROR_STOP=1", "-f", "packages/db/test/0001_foundation.integration.sql"],
    ["pnpm", "--filter", "@drowk/db", "test"],
    ["node", "--test", "connectors/gmail/test/persistence.integration.test.mjs"],
    ["pnpm", "--filter", "@drowk/api", "test"],
  ];
  return [
    ["node", "tooling/harness/secrets.mjs", "all"],
    ["node", "tooling/harness/public-oss.mjs"],
    ["node", "tooling/harness/docs-links.mjs"],
    ["pnpm", "harness:test"], ["pnpm", "lint"], ["pnpm", "typecheck"],
    ...(mode === "fast" ? [] : [["pnpm", "test"]]),
  ];
}

function run(command, env, pm) {
  const [tool, ...args] = command;
  const executable = tool === "psql" ? "psql" : process.execPath;
  const childArgs = tool === "pnpm" ? [pm, ...args] : args;
  const result = spawnSync(executable, childArgs, { cwd: root, env,
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  // Child failure messages may contain database connection details. Never relay them.
  // The secret scanner is the one metadata-only exception.
  const metadataScanner = tool === "node" && ["tooling/harness/secrets.mjs", "tooling/harness/public-oss.mjs", "tooling/harness/docs-links.mjs"].includes(args[0]);
  const safeDiagnostics = metadataScanner || tool === "pnpm" && args[0] === "harness:test";
  if (metadataScanner) process.stdout.write(result.stdout || "");
  if (result.status !== 0) {
    if (safeDiagnostics) {
      process.stdout.write(result.stdout || "");
      process.stderr.write(result.stderr || "");
    }
    console.error(`HARNESS_STEP_FAILED ${JSON.stringify(command)}`);
    throw new Error("HARNESS_STEP_FAILED");
  }
  console.log(`HARNESS_STEP_PASS ${JSON.stringify(command)}`);
}

export function main(mode, env = process.env) {
  const steps = plan(mode);
  if (mode === "integration") integrationBoundary(env); // before any subprocess or DB access
  preflight();
  if (mode === "ci" && Number(process.versions.node.split(".")[0]) !== 22) throw new Error("CI_NODE_22_REQUIRED");
  const pm = env.npm_execpath;
  if (!pm || !/(?:^|[\\/])pnpm\.c?js$/.test(pm)) throw new Error("PNPM_ENTRYPOINT_REQUIRED");
  const childEnv = childEnvironment(env, mode === "integration");
  const version = spawnSync(process.execPath, [pm, "--version"], { env: childEnv, encoding: "utf8" });
  if (version.status !== 0 || version.stdout.trim() !== "10.17.1") throw new Error("PNPM_VERSION_REQUIRED");
  for (const step of steps) run(step, childEnv, pm);
  console.log(`HARNESS_PASS ${mode}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 3) throw new Error("HARNESS_USAGE");
    main(process.argv[2]);
  } catch { console.error("HARNESS_FAILED_CLOSED"); process.exitCode = 1; }
}
