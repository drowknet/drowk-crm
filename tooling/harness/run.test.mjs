import assert from "node:assert/strict";
import { test } from "node:test";
import { childEnvironment, integrationBoundary, plan } from "./run.mjs";

const disposable = { APP_ENV: "test", DROWK_TEST_DISPOSABLE: "1",
  DROWK_TEST_DATABASE_URL: "postgresql://localhost/drowk_test" };

test("integration requires both gates and a local explicitly test-named PostgreSQL URL", () => {
  assert.equal(integrationBoundary(disposable).pathname, "/drowk_test");
  for (const env of [{}, { ...disposable, APP_ENV: "production" },
    { ...disposable, DROWK_TEST_DISPOSABLE: "0" },
    { ...disposable, DROWK_TEST_DATABASE_URL: "postgresql://remote.invalid/drowk_test" },
    { ...disposable, DROWK_TEST_DATABASE_URL: "postgresql://localhost/production" },
    { ...disposable, DROWK_TEST_DATABASE_URL: "postgresql://localhost/drowk_test?host=remote.invalid" }]) {
    assert.throws(() => integrationBoundary(env));
  }
});

test("ordinary modes cannot inherit DB integration or live provider authority", () => {
  const env = childEnvironment({ ...disposable, AISA_API_KEY: "synthetic", GMAIL_TOKEN: "example",
    DROWK_AISA_LIVE_VALIDATION_ENABLED: "true", DATABASE_URL: "example", NODE_OPTIONS: "example", PATH: "example" });
  for (const key of ["AISA_API_KEY", "GMAIL_TOKEN", "DATABASE_URL", "DROWK_TEST_DATABASE_URL", "DROWK_TEST_DISPOSABLE", "NODE_OPTIONS"]) assert.equal(key in env, false);
  assert.equal(env.DROWK_AISA_LIVE_VALIDATION_ENABLED, "false");
  assert.equal(env.PATH, "example");
  assert.equal(childEnvironment(disposable, true).PGDATABASE, "drowk_test");
});

test("plans have no recursive graph; ci is full; integration preserves every foundation sensor", () => {
  assert.deepEqual(plan("ci"), plan("full"));
  assert.deepEqual(plan("full").slice(0, -1), plan("fast"));
  assert.deepEqual(plan("ci")[0], ["node", "tooling/harness/secrets.mjs", "all"]);
  assert.deepEqual(plan("ci")[1], ["node", "tooling/harness/public-oss.mjs"]);
  assert.deepEqual(plan("full").at(-1), ["pnpm", "test"]);
  assert.throws(() => plan("live"));
  for (const mode of ["preflight", "fast", "full", "ci", "integration"]) {
    const serialized = JSON.stringify(plan(mode));
    assert.doesNotMatch(serialized, /live:once|runner-cli|outbound|harness:(?:fast|full|ci|integration)|verify/);
  }
  const integration = plan("integration");
  assert.equal(integration.length, 8);
  assert.ok(integration.some(c => c.includes("apply")));
  assert.ok(integration.some(c => c.includes("packages/db/test/0001_foundation.integration.sql")));
  assert.ok(integration.some(c => c.includes("connectors/gmail/test/persistence.integration.test.mjs")));
  assert.ok(integration.some(c => c.includes("@drowk/api")));
});
