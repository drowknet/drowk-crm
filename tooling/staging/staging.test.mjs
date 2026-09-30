import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { readDatabaseUrl, validateStagingDatabaseUrl, validateStagingAccess } from "../../services/api/src/database-config.mjs";
import { readProcessConfig } from "../../services/api/src/runtime.mjs";
import { checkSecretFiles, cloudflaredImage, imageRef, posixSecretOwnership, resolvedManifest, revisionEvidence, secretFile, sourceManifest, stagingConfig, verifyManifest } from "./contract.mjs";
import { renderCompose, releaseIdentity } from "./preflight.mjs";
import { syntheticConfig, withSyntheticFiles } from "./verify.mjs";
import { killPlan, rollbackPlan } from "./plans.mjs";
import { scanText } from "../harness/secrets.mjs";

const read = path => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const databaseUrl = "postgresql://synthetic.invalid/staging_test?sslmode=verify-full";
const access = { APP_ENV: "staging", AUTH_PROVIDER: "cloudflare-access",
  CLOUDFLARE_ACCESS_ISSUER: "https://synthetic.invalid", CLOUDFLARE_ACCESS_AUDIENCE: "synthetic" };

test("database env/file is exclusive, absolute, read once, strips only one terminal newline", async () => {
  await withSyntheticFiles(env => {
    const path = env.DROWK_STAGING_DATABASE_URL_FILE;
    for (const suffix of ["", "\n", "\r\n"]) {
      writeFileSync(path, databaseUrl + suffix);
      let reads = 0;
      assert.equal(readDatabaseUrl({ APP_ENV: "staging", DATABASE_URL_FILE: path }, (...args) => { reads++; return readFileSync(...args); }), databaseUrl);
      assert.equal(reads, 1);
    }
    const result = readProcessConfig({ ...access, DATABASE_URL_FILE: path });
    assert.equal(result.databaseUrl, databaseUrl);
    assert.equal(JSON.stringify(result).includes(path), false);
    for (const invalid of ["", " ", ` ${databaseUrl}`, `${databaseUrl} `, `${databaseUrl}\n\n`, `${databaseUrl}\r`, `${databaseUrl}\nextra`]) {
      writeFileSync(path, invalid);
      assert.throws(() => readDatabaseUrl({ APP_ENV: "staging", DATABASE_URL_FILE: path }));
    }
    for (const config of [{}, { DATABASE_URL: "" }, { DATABASE_URL_FILE: "relative" },
      { DATABASE_URL_FILE: path, DATABASE_URL: databaseUrl }, { DATABASE_URL_FILE: path, DATABASE_URL: "" },
      { DATABASE_URL_FILE: "", DATABASE_URL: databaseUrl }, { DATABASE_URL_FILE: join(dirname(path), "missing") },
      { DATABASE_URL_FILE: dirname(path) }]) assert.throws(() => readDatabaseUrl(config));
    writeFileSync(path, "x".repeat(16385));
    assert.throws(() => readDatabaseUrl({ DATABASE_URL_FILE: path }));
    for (const APP_ENV of ["development", "test"]) {
      assert.equal(readProcessConfig({ APP_ENV, DATABASE_URL: "postgresql://127.0.0.1/local_test" }).environment, APP_ENV);
    }
  });
});

test("database failures never echo URL, path, sentinel contents or underlying read errors", async () => {
  await withSyntheticFiles(env => {
    const path = env.DROWK_STAGING_DATABASE_URL_FILE;
    const sentinel = ["private", "sentinel", "fixture"].join("-");
    const cases = [() => readDatabaseUrl({ DATABASE_URL_FILE: path }, () => { throw new Error(sentinel); }),
      () => readDatabaseUrl({ APP_ENV: "staging", DATABASE_URL: sentinel }),
      () => readDatabaseUrl({ DATABASE_URL_FILE: join(dirname(path), sentinel) })];
    for (const attempt of cases) assert.throws(attempt, error => {
      assert.ok(!error.message.includes(path) && !error.message.includes(sentinel));
      return /^DATABASE_FILE_INVALID$|^STAGING_DATABASE_TLS_REQUIRED$/.test(error.message);
    });
  });
});

test("staging requires explicit strong TLS with no duplicates, parser overrides or known pooled endpoint", () => {
  for (const scheme of ["postgres", "postgresql"]) for (const mode of ["require", "verify-full"]) {
    assert.doesNotThrow(() => validateStagingDatabaseUrl(`${scheme}://replaceable.example.invalid/staging_test?sslmode=${mode}`));
  }
  for (const value of ["synthetic", "https://synthetic.invalid/db?sslmode=require", "postgresql:///db?sslmode=require",
    "postgresql://synthetic.invalid/?sslmode=require", "postgresql://synthetic.invalid/db/extra?sslmode=require",
    "postgresql://%2Ftmp/db?sslmode=require", "postgresql://ep-synthetic-pooler.example.invalid/db?sslmode=require",
    "postgresql://ep-synthetic-POOLER.example.invalid/db?sslmode=require",
    "postgresql://synthetic.invalid/%20?sslmode=require", databaseUrl + "\n", databaseUrl + "#fragment",
    ...["", "?sslmode=disable", "?sslmode=allow", "?sslmode=prefer", "?sslmode=no-verify", "?sslmode=verify-ca",
      "?sslmode=require&sslmode=disable", "?sslmode=disable&sslmode=require", "?sslmode=require&ssl=false",
      "?sslmode=require&uselibpqcompat=true", "?sslmode=require&host=other.invalid", "?sslmode=require&sslrootcert=file",
      "?sslmode=REQUIRE", "?SSLMODE=require"].map(query => `postgresql://synthetic.invalid/db${query}`)]) {
    assert.throws(() => validateStagingDatabaseUrl(value), { message: "STAGING_DATABASE_TLS_REQUIRED" });
  }
  assert.throws(() => readDatabaseUrl({ APP_ENV: "staging", DATABASE_URL: databaseUrl, NODE_TLS_REJECT_UNAUTHORIZED: "0" }));
});

test("staging Access provider, exact HTTPS issuer and audience are required; no verification network is used", () => {
  assert.doesNotThrow(() => validateStagingAccess(access));
  for (const change of [{ AUTH_PROVIDER: "none" }, { AUTH_PROVIDER: undefined }, { CLOUDFLARE_ACCESS_ISSUER: undefined },
    { CLOUDFLARE_ACCESS_ISSUER: "http://synthetic.invalid" }, { CLOUDFLARE_ACCESS_ISSUER: "https://synthetic.invalid/path" },
    { CLOUDFLARE_ACCESS_ISSUER: "https://user@synthetic.invalid" }, { CLOUDFLARE_ACCESS_AUDIENCE: undefined },
    { CLOUDFLARE_ACCESS_AUDIENCE: "" }, { CLOUDFLARE_ACCESS_AUDIENCE: "synthetic\n" }]) {
    assert.throws(() => readProcessConfig({ ...access, DATABASE_URL: databaseUrl, ...change }), { message: "STAGING_ACCESS_REQUIRED" });
  }
});

test("immutable image refs and revision evidence fail closed", () => {
  const env = syntheticConfig(dirname(new URL(import.meta.url).pathname));
  // Use a platform-native absolute directory without accessing it.
  env.DROWK_STAGING_DATABASE_URL_FILE = join(process.cwd(), "synthetic-db");
  env.DROWK_STAGING_TUNNEL_TOKEN_FILE = join(process.cwd(), "synthetic-tunnel");
  assert.deepEqual(stagingConfig(env), env);
  for (const value of [undefined, "", "ghcr.io/drowknet/api:latest", "sha256:" + "a".repeat(64),
    env.DROWK_STAGING_API_IMAGE + "\n", env.DROWK_STAGING_API_IMAGE.slice(0, -1)]) assert.throws(() => imageRef(value));
  const images = Object.fromEntries([["api", env.DROWK_STAGING_API_IMAGE], ["worker", env.DROWK_STAGING_WORKER_IMAGE]].map(([name, ref]) =>
    [name, { RepoDigests: [ref], Config: { User: "1000:1000", Labels: { "org.opencontainers.image.revision": env.DROWK_STAGING_SHA } } }]));
  revisionEvidence(images, env);
  images.worker.Config.Labels["org.opencontainers.image.revision"] = "b".repeat(40);
  assert.throws(() => revisionEvidence(images, env));
  images.worker.Config.Labels["org.opencontainers.image.revision"] = env.DROWK_STAGING_SHA;
  images.api.RepoDigests = [];
  assert.throws(() => revisionEvidence(images, env));
  releaseIdentity(env.DROWK_STAGING_SHA, "", env.DROWK_STAGING_SHA);
  assert.throws(() => releaseIdentity(env.DROWK_STAGING_SHA, "?? untracked", env.DROWK_STAGING_SHA));
  assert.throws(() => releaseIdentity("b".repeat(40), "", env.DROWK_STAGING_SHA));
});

test("staging manifest enforces isolation, explicit migration, secret files and immutable inputs", async () => {
  await withSyntheticFiles(env => {
    const manifest = resolvedManifest(env);
    verifyManifest(manifest, env);
    assert.equal(sourceManifest().services.cloudflare, undefined);
    assert.equal(sourceManifest().services.cloudflared.image, cloudflaredImage);
    for (const mutate of [m => { m.services.api.ports = ["8000:8000"]; }, m => { m.services.postgres = {}; },
      m => { m.services.api.image = "mutable:latest"; }, m => { m.services.cloudflared.command = ["run", "--token", "synthetic"]; },
      m => { m.services.worker.network_mode = "host"; }, m => { m.services.api.privileged = true; },
      m => { m.services.api.volumes = ["/var/run/docker.sock:/var/run/docker.sock"]; },
      m => { m.services.api.environment.DATABASE_URL = "synthetic"; }, m => { m.services.migrate.profiles = []; },
      m => { m.services.api.depends_on = { migrate: { condition: "service_completed_successfully" } }; },
      m => { m.services.api.environment.AUTH_PROVIDER = "none"; }, m => { m.services.api.secrets = []; },
      m => { m.services.migrate.restart = "always"; }]) {
      const invalid = structuredClone(manifest); mutate(invalid);
      assert.throws(() => verifyManifest(invalid, env));
    }
    assert.deepEqual(scanText(read("infra/staging/compose.yaml"), "infra/staging/compose.yaml"), []);
    assert.deepEqual(scanText(read("infra/staging/staging.env.example"), "infra/staging/staging.env.example"), []);
    assert.doesNotMatch(read("services/api/src/main.ts"), /migrate|applyMigrations/);
    assert.doesNotMatch(read("services/worker/src/runtime.mjs"), /fetch\(|@drowk\/db|node:(?:http|net)/);
  });
});

test("render adapter can issue only Compose version/config commands and hides the expanded model", async () => {
  await withSyntheticFiles(env => {
    const calls = [];
    renderCompose(env, (args, input) => {
      calls.push(args);
      if (args.includes("config")) { assert.deepEqual(input, env); return JSON.stringify(resolvedManifest(env)); }
      return "synthetic version";
    });
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0], ["compose", "version"]);
    assert.deepEqual(calls[1].slice(-3), ["config", "--format", "json"]);
    assert.ok(calls[1].includes("--env-file"));
    assert.ok(!calls.flat().some(arg => ["pull", "build", "up", "run", "start"].includes(arg)));
  });
});

test("POSIX secret policy requires the container owner, owner-read and no group/other bits", () => {
  for (const expectedUid of [1000, 65532]) {
    for (const permissions of [0o400, 0o600]) {
      assert.equal(posixSecretOwnership({ uid: expectedUid, mode: 0o100000 | permissions }, expectedUid), "POSIX_PRIVATE");
      for (const uid of [0, 1001, expectedUid === 1000 ? 65532 : 1000]) {
        assert.throws(() => posixSecretOwnership({ uid, mode: 0o100000 | permissions }, expectedUid));
      }
    }
    for (const permissions of [0o000, 0o200, 0o100, 0o300, 0o644, 0o640, 0o604,
      ...[0o040, 0o020, 0o010, 0o004, 0o002, 0o001].map(bit => 0o600 | bit)]) {
      assert.throws(() => posixSecretOwnership({ uid: expectedUid, mode: 0o100000 | permissions }, expectedUid));
    }
    // lstat file types: symlink, directory, FIFO, socket, block/character devices.
    for (const type of [0o120000, 0o040000, 0o010000, 0o140000, 0o060000, 0o020000]) {
      assert.throws(() => posixSecretOwnership({ uid: expectedUid, mode: type | 0o600 }, expectedUid));
    }
  }
});

test("real secret checks do not treat synthetic runner ownership as container ownership", async () => {
  await withSyntheticFiles(env => {
    if (process.platform === "win32") {
      assert.deepEqual(checkSecretFiles(env), ["OWNER_ACL_REVIEW_REQUIRED", "OWNER_ACL_REVIEW_REQUIRED"]);
    } else {
      // Both fixtures have the same actual owner; they cannot satisfy the two container UIDs.
      assert.throws(() => checkSecretFiles(env), { message: "STAGING_SECRET_FILE_INVALID" });
    }
  });
});

test("secret-file presence/permissions and temporary cleanup hold on success and failure", async () => {
  let directory;
  await withSyntheticFiles(env => {
    directory = dirname(env.DROWK_STAGING_DATABASE_URL_FILE);
    const runnerUid = process.getuid?.();
    assert.ok(secretFile(env.DROWK_STAGING_DATABASE_URL_FILE, runnerUid));
    assert.throws(() => secretFile(directory, runnerUid));
    const absent = join(directory, "missing");
    assert.throws(() => secretFile(absent, runnerUid));
    mkdirSync(absent);
    assert.throws(() => secretFile(absent, runnerUid));
    if (process.platform !== "win32") {
      const link = join(directory, "linked-input");
      symlinkSync(env.DROWK_STAGING_DATABASE_URL_FILE, link);
      assert.throws(() => secretFile(link, runnerUid));
      chmodSync(env.DROWK_STAGING_DATABASE_URL_FILE, 0o200);
      assert.throws(() => secretFile(env.DROWK_STAGING_DATABASE_URL_FILE, runnerUid));
      chmodSync(env.DROWK_STAGING_DATABASE_URL_FILE, 0o644);
      assert.throws(() => secretFile(env.DROWK_STAGING_DATABASE_URL_FILE, runnerUid));
    }
  });
  assert.ok(!existsSync(directory));
  await assert.rejects(withSyntheticFiles(env => {
    directory = dirname(env.DROWK_STAGING_DATABASE_URL_FILE);
    throw new Error("synthetic failure");
  }));
  assert.ok(!existsSync(directory));
});

test("rollback/kill are deterministic plans only; mutable rollback inputs fail", () => {
  const current = { sha: "a".repeat(40), api: `example.invalid/api@sha256:${"1".repeat(64)}`, worker: `example.invalid/worker@sha256:${"2".repeat(64)}` };
  const previous = { ...current, sha: "b".repeat(40) };
  const plan = rollbackPlan({ current, previous });
  assert.deepEqual(plan, rollbackPlan({ current, previous }));
  assert.equal(plan.executable, false);
  assert.equal(plan.schemaRollback, false);
  for (const target of ["current", "previous"]) for (const key of ["api", "worker"]) {
    const invalid = structuredClone({ current, previous }); invalid[target][key] = "mutable:latest";
    assert.throws(() => rollbackPlan(invalid));
  }
  const kill = killPlan();
  assert.deepEqual(kill.services, ["cloudflared", "api", "worker"]);
  assert.equal(kill.managedDatabasePreserved, true);
  assert.equal(kill.secretSourcePreserved, true);
  assert.equal(kill.executable, false);
  assert.deepEqual(kill.commandArgv.map(args => args.slice(args.indexOf("stop"))), [["stop", "cloudflared"], ["stop", "api", "worker"]]);
  assert.ok(!kill.commandArgv.flat().some(value => ["down", "rm", "--volumes", "-v"].includes(value)));
});

test("CI keeps existing checks and runs staging verification after runtime verification", () => {
  const ci = read(".github/workflows/ci.yml");
  assert.match(ci, /run: pnpm harness:ci[\s\S]*run: pnpm runtime:verify[\s\S]*run: pnpm staging:verify/);
  assert.match(ci, /^  verify:/m); assert.match(ci, /^  postgres-foundation:/m);
  for (const action of ci.matchAll(/uses: (\S+)/g)) assert.match(action[1], /@[a-f0-9]{40}$/);
});
