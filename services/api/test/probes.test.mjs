import assert from "node:assert/strict";
import { createServer as createTcpServer } from "node:net";
import { test } from "node:test";
import { createProbeServer, createRuntime, readRuntimeConfig } from "../dist/server.js";

export async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("health never accesses DB; readiness errors are generic; other routes cannot mutate", async t => {
  let calls = 0;
  const server = createProbeServer(async () => { calls++; throw new Error("postgres://secret SQL tenant provider"); });
  const base = await listen(server);
  t.after(() => new Promise(resolve => server.close(resolve)));
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { service: "drowk-api", status: "ok" });
  assert.equal(calls, 0);
  const ready = await fetch(`${base}/ready`);
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { service: "drowk-api", status: "not_ready" });
  assert.equal(calls, 1);
  assert.equal((await fetch(`${base}/accounts`, { method: "POST" })).status, 404);
  assert.equal((await fetch(`${base}/ready`, { method: "POST" })).status, 404);
});

test("runtime stays live and fails readiness within a bounded time when DB never responds", async t => {
  const sockets = new Set();
  const blackhole = createTcpServer(socket => { sockets.add(socket); socket.on("close", () => sockets.delete(socket)); });
  await listen(blackhole);
  t.after(async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => blackhole.close(resolve));
  });
  const runtime = createRuntime({
    databaseUrl: `postgresql://synthetic:synthetic@127.0.0.1:${blackhole.address().port}/unreachable_test`,
    environment: "test", host: "127.0.0.1", port: 8000,
  });
  const base = await listen(runtime.server);
  t.after(runtime.close);
  assert.equal((await fetch(`${base}/health`)).status, 200);
  const ready = await fetch(`${base}/ready`, { signal: AbortSignal.timeout(5000) });
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { service: "drowk-api", status: "not_ready" });
  assert.equal((await fetch(`${base}/health`)).status, 200);
});

test("runtime requires explicit environment and database configuration", () => {
  assert.throws(() => readRuntimeConfig({}));
  assert.throws(() => readRuntimeConfig({ DATABASE_URL: "synthetic" }));
  assert.throws(() => readRuntimeConfig({ DATABASE_URL: "synthetic", APP_ENV: "test", PORT: "0" }));
  assert.equal(readRuntimeConfig({ DATABASE_URL: "synthetic", APP_ENV: "test" }).port, 8000);
});
