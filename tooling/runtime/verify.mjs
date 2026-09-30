import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { preflight, root } from "../harness/run.mjs";

export function runtimeEnvironment(input) {
  const output = {};
  for (const [key, value] of Object.entries(input)) {
    if (/^(?:PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|HOME|USERPROFILE|APPDATA|LOCALAPPDATA|PROGRAMDATA|PROGRAMFILES|PROGRAMFILES\(X86\)|TEMP|TMP|TMPDIR|DOCKER_CONFIG|DOCKER_CONTEXT)$/i.test(key)) output[key] = value;
  }
  return output;
}

export function revision(value) {
  if (typeof value !== "string" || value.length !== 40 || !/^[a-f0-9]{40}$/.test(value)) throw new Error("REVISION_INVALID");
  return value;
}

export function inspectImage(image, sha, password, history) {
  assert.equal(image.Config.User, "1000:1000");
  assert.equal(image.Config.Labels["org.opencontainers.image.revision"], revision(sha));
  assert.equal(image.Config.WorkingDir, "/app");
  for (const entry of image.Config.Env) {
    assert.match(entry.split("=")[0], /^(?:PATH|NODE_VERSION|YARN_VERSION|NODE_ENV)$/);
  }
  const serialized = JSON.stringify(image) + history;
  assert.ok(!serialized.includes(password));
  assert.doesNotMatch(history, /(?:DATABASE_URL|POSTGRES_PASSWORD|AISA_API_KEY|GMAIL_|OAUTH_|ACCESS_TOKEN)\s*=/i);
}

export async function withCleanup(work, cleanup) {
  try { return await work(); } finally { await cleanup(); }
}

export async function main({ failAfterCompose = false } = {}) {
  preflight();
  const env = runtimeEnvironment(process.env);
  // Let an in-flight Docker mutation settle before cleanup; killing its client can
  // race daemon-side container creation. Every command still has a deadline.
  let interrupted = false;
  const onSignal = () => { interrupted = true; };
  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);
  const run = (tool, args, { cleanup = false, timeout = 120_000, allowFailure = false, inputEnv = env } = {}) => new Promise((resolveRun, reject) => {
    if (interrupted && !cleanup) { reject(new Error("RUNTIME_INTERRUPTED")); return; }
    const child = spawn(tool, args, { cwd: root, env: inputEnv, stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true, timeout });
    let stdout = "", stderr = "";
    let spawnFailed = false;
    child.stdout.on("data", data => { stdout += data; });
    child.stderr.on("data", data => { stderr += data; });
    child.on("error", () => { spawnFailed = true; });
    child.on("close", code => {
      if (spawnFailed || (interrupted && !cleanup) || (code !== 0 && !allowFailure)) reject(new Error("RUNTIME_COMMAND_FAILED"));
      else resolveRun({ code, stdout: stdout.trim(), stderr });
    });
  });
  const docker = async (args, options) => (await run("docker", args, options)).stdout;
  const sha = revision((await run("git", ["rev-parse", "HEAD"])).stdout);
  await run("git", ["diff", "--check"]);
  const dirty = (await run("git", ["status", "--porcelain"])).stdout.length > 0;
  if (process.env.CI === "true" && dirty) throw new Error("CI_CLEAN_HEAD_REQUIRED");
  console.log(`RUNTIME_IDENTITY ${sha} ${dirty ? "WORKTREE_CANDIDATE" : "CLEAN_HEAD"}`);
  // Only a local engine; never inherit DOCKER_HOST, provider or database credentials.
  const context = JSON.parse(await docker(["context", "inspect"]));
  assert.match(context[0].Endpoints.docker.Host, /^(?:npipe:\/\/|unix:\/\/)/);
  assert.equal(await docker(["info", "--format", "{{.OSType}}"]), "linux");
  await docker(["compose", "version"]);
  await run(process.execPath, ["--test", ...readdirSync(resolve(root, "tooling/runtime")).filter(x => x.endsWith(".test.mjs")).map(x => `tooling/runtime/${x}`)]);
  const project = `ef02-${randomBytes(8).toString("hex")}`;
  const password = randomBytes(32).toString("hex");
  const label = `drowk.runtime.verify=${project}`;
  const composeEnv = { ...env, DROWK_LOCAL_DB_PASSWORD: password,
    DROWK_LOCAL_DATABASE_URL: `postgresql://drowk:${password}@postgres:5432/drowk_runtime_test` };
  const composeArgs = ["compose", "--env-file", process.platform === "win32" ? "NUL" : "/dev/null", "-p", project, "-f", "compose.yaml"];
  const compose = (args, options = {}) => docker([...composeArgs, ...args], { inputEnv: composeEnv, ...options });
  let composeStarted = false;
  let phase = "build";
  const namedContainers = [];
  const imageIds = {};
  const inspect = async name => JSON.parse(await docker(["inspect", name]))[0];
  const pause = () => new Promise(resolvePause => { setTimeout(resolvePause, 250); });
  const probe = async (name, path, code) => {
    for (let i = 0; i < 60; i++) {
      const result = await run("docker", ["exec", name, "node", "-e",
        `fetch('http://127.0.0.1:8000/${path}',{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.status===${code}?0:1)).catch(()=>process.exit(1))`], { allowFailure: true, timeout: 10_000 });
      if (result.code === 0) return;
      await pause();
    }
    throw new Error("PROBE_FAILED");
  };
  const stop = async (name, signal, marker) => {
    const started = Date.now();
    await docker(["kill", "--signal", signal, name]);
    assert.equal(await docker(["wait", name], { timeout: 10_000 }), "0");
    assert.ok(Date.now() - started < 10_000);
    assert.ok((await docker(["logs", name])).includes(marker));
  };
  try {
    await withCleanup(async () => {
      for (const service of ["api", "worker"]) {
        phase = `build-${service}`;
        const tag = `drowk-ef02-${service}:${sha}`;
        await docker(["build", "--build-arg", `BUILD_SHA=${sha}`, "-f", `services/${service}/Dockerfile`, "-t", tag, "."], { timeout: 900_000 });
        const image = JSON.parse(await docker(["image", "inspect", tag]))[0];
        imageIds[service] = image.Id;
        inspectImage(image, sha, password, await docker(["history", "--no-trunc", "--format", "{{.CreatedBy}}", image.Id]));
        console.log(`RUNTIME_IMAGE_PASS ${service} user=${image.Config.User} revision=${sha} id=${image.Id}`);
        for (const invalid of [null, "bad-revision", sha + "\n"]) {
          const result = await run("docker", ["build", "--target", "build", ...(invalid ? ["--build-arg", `BUILD_SHA=${invalid}`] : []), "-f", `services/${service}/Dockerfile`, "."], { allowFailure: true, timeout: 120_000 });
          assert.notEqual(result.code, 0);
          assert.match(result.stderr + result.stdout, /process\.env\.BUILD_SHA/);
        }
        const auditName = `${project}-${service}-audit`;
        namedContainers.push(auditName);
        const audit = `const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
          assert.equal(process.getuid(),1000);
          function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){
            assert(!/^(?:test|tests|fixtures|docs|\\.git|\\.env.*|connectors|capabilities|tooling|typescript|eslint|@types)$/.test(e.name));
            const q=path.join(p,e.name);if(e.isDirectory())walk(q);
            if(e.name==='package.json'){const m=JSON.parse(fs.readFileSync(q));if(m.name?.startsWith('@drowk/')){assert(${JSON.stringify(service === "api" ? ["@drowk/api", "@drowk/db", "@drowk/domain", "@drowk/contracts"] : ["@drowk/worker", "@drowk/contracts"])}.includes(m.name));assert(!fs.existsSync(path.join(p,'src')));assert(!m.devDependencies);}}
          }} walk('/app'); console.log('CLOSURE_PASS');`;
        // Third-party runtime src (e.g. jose) is allowed; repo workspace source is not.
        assert.equal(await docker(["run", "--name", auditName, "--label", label, "--network", "none", image.Id, "node", "-e", audit]), "CLOSURE_PASS");
        const configName = `${project}-${service}-invalid-config`;
        namedContainers.push(configName);
        const invalidConfig = await run("docker", ["run", "--name", configName, "--label", label, "--network", "none", image.Id], { allowFailure: true });
        assert.equal(invalidConfig.code, 1);
        assert.equal(invalidConfig.stderr.trim(), service === "api" ? "API_CONFIGURATION_INVALID" : "WORKER_CONFIGURATION_INVALID");
      }
      console.log("RUNTIME_INVALID_REVISION_REJECTED");
      phase = "api-unavailable";
      const noDb = `${project}-api-unavailable`;
      namedContainers.push(noDb);
      const noDbEnv = { ...env, DATABASE_URL: `postgresql://drowk:${password}@127.0.0.1:1/unavailable_test` };
      await docker(["run", "-d", "--name", noDb, "--label", label, "--network", "none", "-e", "APP_ENV=test", "-e", "HOST=0.0.0.0", "-e", "DATABASE_URL", imageIds.api], { inputEnv: noDbEnv });
      await probe(noDb, "health", 200);
      await probe(noDb, "ready", 503);
      await stop(noDb, "SIGTERM", "API_STOPPED");
      console.log("RUNTIME_NO_DB health=200 ready=503 SIGTERM=0");
      phase = "worker-signals";
      for (const signal of ["SIGTERM", "SIGINT"]) {
        const name = `${project}-worker-${signal.toLowerCase()}`;
        namedContainers.push(name);
        await docker(["run", "-d", "--name", name, "--label", label, "--network", "none", "-e", "APP_ENV=test", imageIds.worker]);
        for (let i = 0; i < 40 && !(await docker(["logs", name])).includes("WORKER_INERT_STARTED"); i++) await pause();
        assert.ok((await docker(["logs", name])).includes("WORKER_INERT_STARTED"));
        await stop(name, signal, "WORKER_INERT_STOPPED");
        console.log(`RUNTIME_WORKER ${signal}=0`);
      }
      phase = "compose";
      Object.assign(composeEnv, { DROWK_API_IMAGE: imageIds.api, DROWK_WORKER_IMAGE: imageIds.worker });
      composeStarted = true;
      await compose(["up", "-d", "--pull", "missing"], { timeout: 180_000 });
      if (failAfterCompose) throw new Error("INJECTED_COMPOSE_FAILURE");
      const api = await compose(["ps", "-q", "api"]);
      const postgres = await compose(["ps", "-q", "postgres"]);
      const migration = await compose(["ps", "-a", "-q", "migration"]);
      assert.equal((await inspect(migration)).State.ExitCode, 0);
      const apiInfo = await inspect(api);
      assert.equal(apiInfo.HostConfig.PortBindings["8000/tcp"][0].HostIp, "127.0.0.1");
      assert.equal(Object.keys((await inspect(postgres)).HostConfig.PortBindings ?? {}).length, 0);
      await probe(api, "ready", 200);
      // Readiness traverses SQL checksums; additionally compare packaged SQL bytes.
      const hashes = JSON.parse(await docker(["exec", api, "node", "-e", `const fs=require('node:fs'),c=require('node:crypto');const p='node_modules/@drowk/db/migrations/';console.log(JSON.stringify(Object.fromEntries(fs.readdirSync(p).map(n=>[n,c.createHash('sha256').update(fs.readFileSync(p+n)).digest('hex')]))))`]));
      const { createHash } = await import("node:crypto");
      for (const name of readdirSync(resolve(root, "packages/db/migrations"))) assert.equal(hashes[name], createHash("sha256").update(readFileSync(resolve(root, "packages/db/migrations", name))).digest("hex"));
      await stop(api, "SIGINT", "API_STOPPED");
      console.log("RUNTIME_COMPOSE migration=0 ready=200 api-loopback=true postgres-published=false API_SIGINT=0");
    }, async () => {
      let failed = false;
      if (composeStarted) {
        try { await compose(["down", "--volumes", "--remove-orphans", "--timeout", "8"], { cleanup: true }); } catch { failed = true; }
      }
      // Registered before creation, including commands that fail after container creation.
      for (const name of namedContainers) await run("docker", ["rm", "-f", "-v", name], { cleanup: true, allowFailure: true });
      for (const [kind, command] of [["container", "ps"], ["network", "network"], ["volume", "volume"]]) {
        for (const filter of [`label=${label}`, `label=com.docker.compose.project=${project}`]) {
          const args = kind === "container" ? [command, "-aq", "--filter", filter] : [command, "ls", "-q", "--filter", filter];
          if (await docker(args, { cleanup: true })) failed = true;
        }
      }
      if (failed) throw new Error("RUNTIME_CLEANUP_FAILED");
      console.log("RUNTIME_CLEANUP_PASS containers=0 networks=0 volumes=0");
    });
    console.log("RUNTIME_VERIFY_PASS");
  } catch {
    console.error(`RUNTIME_VERIFY_FAILED phase=${phase}`);
    throw new Error("RUNTIME_VERIFY_FAILED");
  } finally {
    process.removeListener("SIGINT", onSignal);
    process.removeListener("SIGTERM", onSignal);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== "--fail-after-compose")) throw new Error("RUNTIME_USAGE");
    await main({ failAfterCompose: process.argv[2] === "--fail-after-compose" });
  } catch { console.error("RUNTIME_FAILED_CLOSED"); process.exitCode = 1; }
}
