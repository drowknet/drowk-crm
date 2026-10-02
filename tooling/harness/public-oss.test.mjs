import assert from "node:assert/strict";
import { test } from "node:test";
import { scanPublicOssText } from "./public-oss.mjs";

test("public OSS scanner flags tenant/account identifiers without echoing values", () => {
  const sample = [
    "owner login: " + "asbrito" + "@proton.me",
    "provider: " + "drowknet" + "@gmail.com",
    "tenant domain: " + "andersonpacificwestinc" + ".net",
    "source: " + "PWM" + "_CRM",
    "reason: COMMERCIAL_EXCLUSION_EXISTING_" + "PWM",
    "tenant acronym: " + "PWM",
  ].join("\n");
  const findings = scanPublicOssText("synthetic.md", sample);
  assert.equal(findings.length, 6);
  assert.deepEqual(new Set(findings.map(f => f.detector)), new Set([
    "OWNER_EMAIL", "PROVIDER_ACCOUNT_EMAIL", "TENANT_DOMAIN", "TENANT_SOURCE_ID", "TENANT_REASON_CODE", "TENANT_ACRONYM"
  ]));
  assert.ok(findings.every(f => f.path === "synthetic.md" && Number.isInteger(f.line)));
});

test("generic provider and synthetic examples pass", () => {
  assert.deepEqual(scanPublicOssText("example.md",
    "provider-account@example.invalid\nreference tenant\nlegacy CRM source\nCOMMERCIAL_EXCLUSION_EXISTING_ACCOUNT"), []);
});
