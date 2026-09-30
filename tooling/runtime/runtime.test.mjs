import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { readProcessConfig, createClose, installShutdown } from "../../services/api/src/runtime.mjs";
import { readWorkerConfig, startWorker } from "../../services/worker/src/runtime.mjs";
import { inspectImage, revision, runtimeEnvironment, withCleanup } from "./verify.mjs";
import { pack } from "./pack.mjs";

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const valid = { DATABASE_URL: "postgresql://localhost/disposable_test", APP_ENV: "test" };

test("API and worker accept only the exact canonical APP_ENV vocabulary", () => {
  const accepted = ["development", "test", "staging", "production"];
  for (const APP_ENV of accepted) {
    assert.equal(readProcessConfig({ ...valid, APP_ENV }).environment, APP_ENV);
    assert.equal(readWorkerConfig({ APP_ENV }).environment, APP_ENV);
  }
  const unsupported = [undefined, null, 0, false, "qa", "preview", "prod", "", " ", "\t", "\n", "\r\n",
    ...accepted.flatMap(value => [value.toUpperCase(), ` ${value}`, `${value} `,
      `\t${value}`, `${value}\t`, `\n${value}`, `${value}\n`, `${value}\r`, `${value}\r\n`, `${value}\nextra`])];
  for (const APP_ENV of unsupported) {
    assert.throws(() => readProcessConfig({ ...valid, APP_ENV }), { message: "APP_ENV_INVALID" });
    assert.throws(() => readWorkerConfig({ APP_ENV }), { message: "APP_ENV_INVALID" });
  }
});

test("runtime configuration rejects invalid input without echoing values", () => {
  assert.deepEqual(readProcessConfig(valid), { databaseUrl: valid.DATABASE_URL, environment: "test", host: "127.0.0.1", port: 8000 });
  for (const changes of [{ DATABASE_URL: "sentinel-secret" }, { DATABASE_URL: "https://localhost/test" },
    { DATABASE_URL: "postgresql:///" }, { APP_ENV: "" }, { APP_ENV: " test" }, { HOST: "" },
    { HOST: "remote.invalid" }, { PORT: "0" }, { PORT: "65536" }, { PORT: "8e3" }, { PORT: "8000\n" }, { APP_ENV: "test\n" }]) {
    assert.throws(() => readProcessConfig({ ...valid, ...changes }), error => !error.message.includes("sentinel-secret"));
  }
  assert.equal(readProcessConfig({ ...valid, HOST: "0.0.0.0", PORT: "8001" }).port, 8001);
  for (const env of [{}, { APP_ENV: " " }, { APP_ENV: "test\n" }, { APP_ENV: "x".repeat(33) }]) assert.throws(() => readWorkerConfig(env));
});

test("close is idempotent and closes pool after listener, including listener errors", async () => {
  for (const failure of [false, true]) {
    const calls = [];
    const close = createClose({ listening: true, close: cb => { calls.push("listener"); cb(failure ? new Error("internal") : undefined); } },
      { end: async () => { calls.push("pool"); } });
    const first = close();
    assert.equal(close(), first);
    if (failure) await assert.rejects(first); else await first;
    assert.deepEqual(calls, ["listener", "pool"]);
  }
});

test("API both signals close exactly once; stuck and rejected shutdown fail closed", async () => {
  for (const signal of ["SIGTERM", "SIGINT"]) {
    const target = new EventEmitter();
    let calls = 0;
    const result = new Promise(resolve => {
      installShutdown(async () => { calls++; }, { target, exit: resolve, log: () => {}, timeoutMs: 100 });
    });
    target.emit(signal); target.emit(signal);
    assert.equal(await result, 0);
    assert.equal(calls, 1);
  }
  for (const close of [() => new Promise(() => {}), () => Promise.reject(new Error("private"))]) {
    const target = new EventEmitter();
    const markers = [];
    const result = new Promise(resolve => { installShutdown(close, { target, exit: resolve, log: x => markers.push(x), timeoutMs: 20 }); });
    target.emit("SIGTERM");
    assert.equal(await result, 1);
    assert.equal(markers.length, 1);
    assert.match(markers[0], /^API_SHUTDOWN_(?:TIMEOUT|FAILED)$/);
  }
});

test("inert worker handles each signal and duplicate stops cleanly", () => {
  for (const signal of ["SIGTERM", "SIGINT"]) {
    const target = new EventEmitter(), markers = [];
    const stop = startWorker({ APP_ENV: "test" }, target, marker => markers.push(marker));
    try { target.emit(signal); stop(); } finally { stop(); }
    assert.deepEqual(markers, ["WORKER_INERT_STARTED", "WORKER_INERT_STOPPED"]);
    assert.equal(target.listenerCount("SIGTERM") + target.listenerCount("SIGINT"), 0);
  }
  const source = read("services/worker/src/runtime.mjs") + read("services/worker/src/main.mjs");
  assert.doesNotMatch(source, /(?:fetch\(|node:(?:http|net|child_process)|pg-boss|DBOS|cloudflare|@drowk\/db|gmail|aisa)/i);
  assert.deepEqual([...source.matchAll(/from "([^"]+)"/g)].map(m => m[1]), ["./runtime.mjs"]);
});

test("Dockerfiles pin official Node 22, frozen graph, non-root, exact revision and no credential inputs", () => {
  for (const service of ["api", "worker"]) {
    const source = read(`services/${service}/Dockerfile`);
    assert.equal([...source.matchAll(/^FROM node:22-bookworm-slim@sha256:[a-f0-9]{64} AS (?:build|runtime)$/gm)].length, 2);
    assert.match(source, /pnpm@10\.17\.1/);
    assert.match(source, /pnpm --version/);
    assert.match(source, /pnpm install --frozen-lockfile --ignore-scripts/);
    assert.match(source, /^USER 1000:1000$/m);
    assert.match(source, /^LABEL org.opencontainers.image.revision=\$BUILD_SHA$/m);
    assert.equal([...source.matchAll(/\^\[a-f0-9\]\{40\}\$/g)].length, 2);
    assert.deepEqual([...source.matchAll(/^ARG (.*)$/gm)].map(m => m[1]), ["BUILD_SHA", "BUILD_SHA"]);
    assert.deepEqual([...source.matchAll(/^ENV (.*)$/gm)].map(m => m[1]), ["NODE_ENV=production"]);
    assert.match(source, /COPY --from=build --chown=1000:1000 \/runtime\/ .\//);
  }
});

test("build context deny-by-default and Compose local authority contracts", () => {
  const ignore = read(".dockerignore");
  assert.equal(ignore.split(/\r?\n/).find(line => line && !line.startsWith("#")), "**");
  for (const pattern of ["**/.git", "**/.env*", "**/node_modules", "**/test", "**/tests", "**/docs", "**/secrets", "connectors", "capabilities", "apps"]) assert.ok(ignore.split(/\r?\n/).includes(pattern));
  for (const allow of ignore.split(/\r?\n/).filter(line => line.startsWith("!"))) assert.doesNotMatch(allow, /(?:test|docs|gmail|aisa|\.env|secrets)/i);
  const compose = read("compose.yaml");
  assert.match(compose, /postgres:16-alpine@sha256:[a-f0-9]{64}/);
  assert.match(compose, /POSTGRES_PASSWORD: \$\{DROWK_LOCAL_DB_PASSWORD:\?/);
  assert.equal([...compose.matchAll(/DATABASE_URL: \$\{DROWK_LOCAL_DATABASE_URL:\?/g)].length, 2);
  assert.equal([...compose.matchAll(/^    ports:/gm)].length, 1);
  assert.match(compose, /"127\.0\.0\.1:\$\{DROWK_LOCAL_API_PORT:-0\}:8000"/);
  assert.match(compose, /condition: service_completed_successfully/);
  assert.match(compose, /internal: true/);
  assert.doesNotMatch(compose, /build:|privileged:|network_mode:|5432:5432/);
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /run: pnpm harness:ci[\s\S]*run: pnpm runtime:verify/);
  for (const action of ci.matchAll(/uses: (\S+)/g)) assert.match(action[1], /@[a-f0-9]{40}$/);
});

test("verification rejects revision/config drift and strips inherited business credentials", () => {
  for (const invalid of [undefined, "", "a".repeat(39), "G".repeat(40), "a".repeat(41), "a".repeat(40) + "\n"]) assert.throws(() => revision(invalid));
  const sha = "a".repeat(40);
  const image = { Config: { User: "1000:1000", WorkingDir: "/app", Env: ["NODE_ENV=production"], Labels: { "org.opencontainers.image.revision": sha } } };
  inspectImage(image, sha, "sentinel-private", "safe build");
  for (const changed of [{ User: "root" }, { Env: ["DATABASE_URL=sentinel-private"] }, { Labels: {} }]) assert.throws(() => inspectImage({ Config: { ...image.Config, ...changed } }, sha, "sentinel-private", ""));
  assert.throws(() => inspectImage(image, sha, "sentinel-private", "sentinel-private"));
  assert.deepEqual(runtimeEnvironment({ PATH: "bin", DATABASE_URL: "private", AISA_API_KEY: "private", NODE_OPTIONS: "injected", DOCKER_HOST: "remote", COMPOSE_FILE: "other" }), { PATH: "bin" });
});

test("cleanup runs on success and failure; cleanup errors cannot become a pass", async () => {
  let cleanups = 0;
  const cleanup = async () => { cleanups++; };
  assert.equal(await withCleanup(async () => "ok", cleanup), "ok");
  await assert.rejects(withCleanup(async () => { throw new Error("failure"); }, cleanup));
  assert.equal(cleanups, 2);
  await assert.rejects(withCleanup(async () => "ok", async () => { throw new Error("cleanup"); }));
});

test("production pack copies resolved dependencies and SQL but excludes workspace source/dev/test trees", t => {
  const temp = mkdtempSync(join(tmpdir(), "ef02-pack-"));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const source = join(temp, "source"), output = join(temp, "output");
  const write = (path, content) => { mkdirSync(join(source, path, ".."), { recursive: true }); writeFileSync(join(source, path), content); };
  write("package.json", JSON.stringify({ name: "@drowk/api", dependencies: { production: "1" }, devDependencies: { excluded: "1" } }));
  for (const file of ["dist/main.js", "migrations/0001.sql", "src/main.ts", "test/private.mjs", "docs/private.md"]) write(file, "synthetic");
  write("node_modules/production/package.json", JSON.stringify({ name: "production", version: "1" }));
  write("node_modules/production/index.js", "synthetic");
  write("node_modules/production/test/private.mjs", "synthetic");
  write("node_modules/excluded/package.json", JSON.stringify({ name: "excluded" }));
  pack(source, output);
  for (const file of ["dist/main.js", "migrations/0001.sql", "node_modules/production/index.js"]) assert.ok(existsSync(join(output, file)));
  for (const file of ["src", "test", "docs", "node_modules/excluded", "node_modules/production/test"]) assert.ok(!existsSync(join(output, file)));
  assert.equal(JSON.parse(readFileSync(join(output, "package.json"))).devDependencies, undefined);
});
