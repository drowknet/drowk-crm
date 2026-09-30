import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import pg from "pg";
import { readRuntimeConfig } from "../dist/server.js";
import { readProcessConfig } from "../dist/runtime.mjs";
import { childEnvironment } from "../../../tooling/harness/run.mjs";

const access = { APP_ENV: "staging", AUTH_PROVIDER: "cloudflare-access",
  CLOUDFLARE_ACCESS_ISSUER: "https://synthetic.invalid", CLOUDFLARE_ACCESS_AUDIENCE: "synthetic" };

test("API library resolves file configuration and the locked pg parser retains certificate validation", t => {
  const directory = mkdtempSync(join(tmpdir(), "ef03-api-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const path = join(directory, "database-input");
  for (const mode of ["require", "verify-full"]) {
    const databaseUrl = `postgresql://synthetic.invalid/staging_test?sslmode=${mode}`;
    writeFileSync(path, databaseUrl + "\r\n", { mode: 0o600 });
    const config = readRuntimeConfig({ ...access, DATABASE_URL_FILE: path });
    assert.equal(config.databaseUrl, databaseUrl);
    assert.equal(JSON.stringify(config).includes(path), false);
    // Resolve the process path after removing the file: no second file read is possible.
    rmSync(path);
    assert.equal(readProcessConfig({ ...access, DATABASE_URL: config.databaseUrl }).databaseUrl, databaseUrl);
    const client = new pg.Client({ connectionString: config.databaseUrl });
    assert.ok(client.ssl);
    assert.notEqual(client.ssl.rejectUnauthorized, false);
    assert.equal(client.host, "synthetic.invalid");
  }
  assert.throws(() => readRuntimeConfig({ ...access, DATABASE_URL: "synthetic", DATABASE_URL_FILE: path }));
  assert.throws(() => readRuntimeConfig({ ...access, DATABASE_URL: "postgresql://synthetic.invalid/db" }));
  assert.throws(() => readRuntimeConfig({ ...access, AUTH_PROVIDER: "none", DATABASE_URL: "postgresql://synthetic.invalid/db?sslmode=require" }));
});

test("API and explicit migration entrypoints reject missing secret files with fixed output before connection", () => {
  for (const [script, args, marker] of [["main.js", [], "API_CONFIGURATION_INVALID"], ["migrate.mjs", ["plan"], "STAGING_MIGRATION_FAILED"]]) {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(`../dist/${script}`, import.meta.url)), ...args], {
      env: { ...childEnvironment(process.env), ...access, DATABASE_URL_FILE: join(tmpdir(), "ef03-absent-input", "missing") },
      encoding: "utf8", timeout: 5000, windowsHide: true,
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.trim(), marker);
  }
});
