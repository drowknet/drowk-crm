import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { IMAGE, fixture, schema, plan, validatePlan, sourceFacts, normalizeResult } from "../prospecting-lab/crawl4ai/lab.mjs";

const root = new URL("../prospecting-lab/crawl4ai/", import.meta.url);
const script = readFileSync(new URL("candidate.py", root), "utf8");
const moduleText = readFileSync(new URL("lab.mjs", root), "utf8");
const candidate = (facts = sourceFacts(fixture), html = fixture) => normalizeResult({ html,
  exitCode: 0, stdout: JSON.stringify({ success: true, records: [facts] }) });
const rejectArgs = extra => {
  const value = plan(); value.args.push(...extra);
  assert.throws(() => validatePlan(value), /REJECTED/);
};

test("exact version and digest; latest/version/digest drift fail closed", () => {
  assert.equal(IMAGE, "unclecode/crawl4ai:0.9.4@sha256:9021b3cb5c6f12570bbcd5395638495e0a06969b3148e377b953d174af2ebc9b");
  assert.equal(validatePlan(plan()), true);
  for (const bad of ["unclecode/crawl4ai:latest", IMAGE.replace("0.9.4", "0.9.3"), IMAGE.slice(0, -1) + "0"]) {
    const value = plan(); value.args[value.args.indexOf(IMAGE)] = bad;
    assert.throws(() => validatePlan(value));
  }
});
test("network none, zero ports, no privileged or host networking", () => {
  const args = plan().args;
  assert.equal(args[args.indexOf("--network") + 1], "none");
  assert.ok(args.includes("--rm"));
  assert.equal(args[args.indexOf("--cap-drop") + 1], "ALL");
  assert.equal(args[args.indexOf("--security-opt") + 1], "no-new-privileges");
  assert.ok(!args.some(arg => /^(?:-p|-P|--publish|--privileged|--net=host)/.test(arg)));
  for (const flags of [["--network", "bridge"], ["--network=host"], ["--net", "host"], ["--privileged"], ["-p", "80:80"], ["-P"], ["--publish=80:80"]]) rejectArgs(flags);
});
test("only three exact read-only inputs, no credential/session/browser/socket mounts", () => {
  const mounts = plan().args.filter(arg => arg.startsWith("type=bind"));
  assert.equal(mounts.length, 3);
  assert.ok(mounts.every(mount => mount.endsWith(",readonly")));
  for (const path of [".ssh", ".aws", ".docker", "docker.sock", "SSH_AUTH_SOCK", "browser-profile", "user-data", "cookies", "session", "linkedin"]) rejectArgs(["-v", `${path}:/input:ro`]);
});
test("bounded resources, no inherited keys, no LinkedIn material or external targets", () => {
  assert.deepEqual(plan().environment, {});
  assert.equal(plan().timeoutMs, 45000);
  assert.equal(plan().maxOutputBytes, 16384);
  for (const flag of ["--memory", "--cpus", "--pids-limit", "--read-only", "--tmpfs"]) assert.ok(plan().args.includes(flag));
  assert.equal(plan().args[plan().args.indexOf("--pull") + 1], "never");
  for (const target of ["https://example.com", "http://example.com"]) rejectArgs([target]);
  rejectArgs(["--env", "MODEL_API_KEY"]);
  assert.doesNotMatch(script + moduleText + fixture, /linkedin|process\.env|os\.environ|api_key|access_token/i);
  assert.match(script, /url='raw:' \+ html/);
});
test("reserved synthetic fixture and explicit selected schema exclude noise", () => {
  assert.match(fixture, /data-synthetic="true"/);
  assert.match(fixture, /<title>Example Synthetic Works<\/title>/);
  assert.doesNotMatch(fixture, /https?:|@|<script|<iframe/i);
  assert.equal(schema.baseSelector, "main#synthetic-company[data-synthetic='true']");
  assert.deepEqual(schema.fields.map(field => field.selector), ["h1", "p#facility", "p#service", "a#procurement"]);
  assert.deepEqual(sourceFacts(fixture), { companyTitle: "Example Synthetic Works", facility: "Example Facility, Example City", service: "Synthetic component fabrication", procurementRoute: "/vendors/register" });
  assert.doesNotMatch(JSON.stringify(candidate().facts), /puzzle|weather|noise/);
  assert.equal(candidate({ ...sourceFacts(fixture), noise: "weather" }).resultState, "ERROR");
});
test("same input stable; changed selected fixture changes both fingerprints", () => {
  assert.deepEqual(candidate(), candidate());
  const changed = fixture.replace("Synthetic component fabrication", "Synthetic component assembly");
  const result = candidate(sourceFacts(changed), changed);
  assert.notEqual(result.fixtureFingerprint, candidate().fixtureFingerprint);
  assert.notEqual(result.selectedFactsFingerprint, candidate().selectedFactsFingerprint);
  const noiseChanged = fixture.replace("puzzle", "game");
  assert.equal(candidate(sourceFacts(noiseChanged), noiseChanged).selectedFactsFingerprint, candidate().selectedFactsFingerprint);
});
test("malformed, insufficient, fabricated and failed results never invent facts", () => {
  assert.equal(candidate().resultState, "PRESENT");
  assert.equal(candidate({ facility: "Example Facility, Example City" }).resultState, "PARTIAL");
  assert.equal(candidate({}, "<html>").resultState, "UNKNOWN");
  assert.equal(candidate(sourceFacts(fixture), "<html>").resultState, "ERROR");
  for (const malformed of [`<!--${fixture}-->`, fixture.replace("</h1>", "</p>"), fixture.replace("</body>", "")]) {
    assert.deepEqual(sourceFacts(malformed), {});
    assert.equal(candidate(sourceFacts(fixture), malformed).resultState, "ERROR");
  }
  assert.equal(candidate({ facility: "invented" }).resultState, "ERROR");
  for (const stdout of ["broken", "null", '{"success":false}', '{"success":true,"records":[null]}', "x".repeat(16385)]) {
    const result = normalizeResult({ exitCode: 0, stdout });
    assert.equal(result.resultState, "ERROR"); assert.deepEqual(result.facts, {});
  }
  for (const failure of [{ exitCode: 1 }, { timedOut: true }, { exitCode: null }]) {
    assert.equal(normalizeResult({ exitCode: 0, stdout: JSON.stringify({ success: true, records: [sourceFacts(fixture)] }), ...failure }).resultState, "ERROR");
  }
  const result = candidate();
  assert.equal(result.authority, "EVIDENCE_CANDIDATE");
  assert.equal(result.rightsClass, "SYNTHETIC_ALLOWED");
  assert.equal(result.synthetic, true); assert.equal(result.observedAt, null);
});
test("no DB, CRM writes, LLM, application dependency or execution; removable lab", () => {
  assert.doesNotMatch(moduleText + script, /@drowk|packages\/|services\/|connectors\/|ProviderRun|ResearchRun|INSERT INTO|UPDATE .* SET|LLMExtraction|fetch\(|child_process|spawn\(|execFile|writeFile/);
  assert.match(script, /JsonCssExtractionStrategy/);
  assert.ok([...moduleText.matchAll(/from "([^"]+)"/g)].every(match => match[1].startsWith("node:")));
  assert.deepEqual(readdirSync(root).sort(), ["README.md", "candidate.py", "fixture.html", "lab.mjs", "schema.json"]);
  const pkg = readFileSync(new URL("../../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(pkg, /crawl4ai/i);
});
