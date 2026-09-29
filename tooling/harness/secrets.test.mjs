import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { allowances, forbiddenPath, formatFindings, git, scanHistory, scanText, scanTree } from "./secrets.mjs";

function candidates() {
  return [
    ["PRIVATE_KEY", ["-----BEGIN ", "PRIVATE", " KEY-----"].join("")],
    ["GITHUB_TOKEN", ["gh", "p_", "a".repeat(36)].join("")],
    ["PROVIDER_TOKEN", ["s", "k-", "q".repeat(30)].join("")],
    ["AWS_ACCESS_KEY", ["AK", "IA", "A".repeat(16)].join("")],
    ["JWT", ["ey", "J", "a".repeat(14), ".", "b".repeat(16), ".", "c".repeat(18)].join("")],
    ["SECRET_ASSIGNMENT", 'const apiKey = "' + ["candidate", "-", "value-12345"].join("") + '";'],
  ];
}

test("detectors find runtime-built synthetic material without returning content", () => {
  for (const [detector, value] of candidates()) {
    const findings = scanText(`\n${value}\n`, "fixture.txt");
    assert.ok(findings.some(f => f.detector === detector));
    const output = formatFindings(findings);
    assert.equal(output.includes(value), false);
    assert.deepEqual(Object.keys(findings[0]).sort(), ["detector", "line", "path"]);
  }
});

test("empty, reference and example literals pass; dotenv blanks never consume next line", () => {
  const text = 'API_KEY=\nGOOGLE_CLIENT_SECRET=\nAPP_SECRET=\n' +
    'PASSWORD=example\nTOKEN=your-token-here\nsecret: "<injected>"\n' +
    'const secret = process.env.SECRET;\nconst apiKey = "";\n';
  assert.deepEqual(scanText(text, ".env.example"), []);
  assert.deepEqual(scanText(readFileSync(new URL("../../.env.example", import.meta.url), "utf8"), ".env.example"), []);
  const candidate = candidates().at(-1)[1];
  assert.equal(scanText(candidate, ".env.example").length, 1); // no path-wide exemption
});

test("generic key and unquoted YAML password literals are covered without matching monkey", () => {
  const value = ["candidate", "-value-12345"].join("");
  for (const text of [`const key = "${value}";`, `SIGNING_KEY=${value}`,
    `const signingKey = "${value}";`, `password: ${value}`, `PASSWORD=${value}.suffix`]) {
    assert.equal(scanText(text, "fixture.txt").some(f => f.detector === "SECRET_ASSIGNMENT"), true);
  }
  assert.deepEqual(scanText(`const monkey = "${value}";`, "fixture.txt"), []);
});

test("allowances are exact in both path and value with written justification", () => {
  for (const a of allowances) {
    assert.ok(a.justification.length > 20);
    assert.ok(!/[\*?]/.test(a.path));
    const literal = `PASSWORD="${a.value}"`;
    assert.equal(scanText(literal, a.path).length, 0);
    assert.equal(scanText(literal, "elsewhere.txt").length, 1);
    assert.equal(scanText(`PASSWORD="${a.value}-changed"`, a.path).length, 1);
  }
});

test("forbidden tracked secret classes are blocked while .env.example is allowed", () => {
  for (const path of [".env", "a/.env.local", "a/private.pem", "id_ed25519", "secrets/a.txt", "credentials.json", ".dev.vars"]) assert.equal(forbiddenPath(path), true);
  assert.equal(forbiddenPath(".env.example"), false);
});

function repository(t) {
  const directory = mkdtempSync(join(tmpdir(), "drowk-secret-sensor-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  git(directory, ["init", "--quiet"]);
  git(directory, ["config", "user.name", "Synthetic sensor"]);
  git(directory, ["config", "user.email", "sensor@example.invalid"]);
  git(directory, ["config", "commit.gpgsign", "false"]);
  return directory;
}

test("history catches removed synthetic material and CLI emits metadata only", t => {
  const directory = repository(t), value = candidates()[1][1];
  writeFileSync(join(directory, "candidate.txt"), value);
  git(directory, ["add", "candidate.txt"]);
  git(directory, ["commit", "--quiet", "-m", "synthetic candidate"]);
  writeFileSync(join(directory, "candidate.txt"), "example\n");
  git(directory, ["add", "candidate.txt"]);
  git(directory, ["commit", "--quiet", "-m", "remove candidate"]);
  assert.deepEqual(scanTree(directory), []);
  const findings = scanHistory(directory);
  assert.equal(findings.length, 1);
  assert.match(findings[0].commit, /^[a-f0-9]{40}$/);
  assert.equal(formatFindings(findings).includes(value), false);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("secrets.mjs", import.meta.url)), "history"], { cwd: directory, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.ok(result.stderr.includes("GITHUB_TOKEN"));
  assert.equal((result.stdout + result.stderr).includes(value), false);
});

test("shallow history fails closed", t => {
  const directory = repository(t);
  writeFileSync(join(directory, "safe.txt"), "example\n");
  git(directory, ["add", "safe.txt"]);
  git(directory, ["commit", "--quiet", "-m", "safe"]);
  writeFileSync(join(directory, ".git", "shallow"), git(directory, ["rev-parse", "HEAD"]));
  assert.throws(() => scanHistory(directory), /SECRET_HISTORY_SHALLOW/);
});

test("history inspects symlink blobs without following and rejects unscanned gitlinks", t => {
  const directory = repository(t), value = candidates()[1][1];
  writeFileSync(join(directory, "candidate.txt"), value);
  const oid = git(directory, ["hash-object", "-w", "candidate.txt"]).trim();
  git(directory, ["update-index", "--add", "--cacheinfo", `120000,${oid},synthetic-link`]);
  git(directory, ["commit", "--quiet", "-m", "synthetic link"]);
  assert.equal(scanHistory(directory)[0].detector, "GITHUB_TOKEN");
  const commit = git(directory, ["rev-parse", "HEAD"]).trim();
  git(directory, ["update-index", "--add", "--cacheinfo", `160000,${commit},unscanned-module`]);
  git(directory, ["commit", "--quiet", "-m", "synthetic gitlink"]);
  assert.throws(() => scanHistory(directory), /SECRET_HISTORY_UNSUPPORTED_GITLINK/);
});
