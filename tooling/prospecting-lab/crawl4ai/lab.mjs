import { createHash } from "node:crypto";
import { readFileSync, lstatSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const IMAGE = "unclecode/crawl4ai:0.9.4@sha256:9021b3cb5c6f12570bbcd5395638495e0a06969b3148e377b953d174af2ebc9b";
const directory = dirname(fileURLToPath(import.meta.url));
export const fixture = readFileSync(join(directory, "fixture.html"), "utf8");
export const schema = JSON.parse(readFileSync(join(directory, "schema.json"), "utf8"));
export const fingerprint = value => createHash("sha256").update(value).digest("hex");

// No subprocess API: this module can only construct a reviewable future argv.
export function plan() {
  const mounts = ["fixture.html", "schema.json", "candidate.py"].flatMap(name => {
    const path = join(directory, name);
    if (!lstatSync(path).isFile() || realpathSync(path) !== path || /[,\r\n]/.test(path)) throw new Error("LAB_INPUT_INVALID");
    return ["--mount", `type=bind,source=${path},target=/lab/${name},readonly`];
  });
  return { executable: "docker", args: ["run", "--rm", "--pull", "never", "--network", "none",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--read-only",
    "--memory", "1g", "--cpus", "1", "--pids-limit", "128", "--shm-size", "64m",
    "--tmpfs", "/tmp:rw,nosuid,nodev,size=256m", ...mounts,
    "--entrypoint", "python", IMAGE, "-B", "/lab/candidate.py"],
  timeoutMs: 45000, maxOutputBytes: 16384, environment: {} };
}

// Exact allowlist rejects extra flags, mounts, targets, env and alternate spellings.
export function validatePlan(candidate) {
  if (JSON.stringify(candidate) !== JSON.stringify(plan())) throw new Error("LAB_PLAN_REJECTED");
  return true;
}

const normalize = value => value.normalize("NFC").replace(/\s+/gu, " ").trim();

// Deliberately narrow oracle for this repo-owned fixture grammar, not an HTML parser.
export function sourceFacts(html) {
  if (typeof html !== "string" || html.length > 16384) return {};
  if (!/^<!doctype html>\s*<html lang="en"><head><title>[^<>]+<\/title><\/head><body>\s*<main id="synthetic-company" data-synthetic="true">[\s\S]*?<\/main>\s*<aside id="noise">[^<>]*<\/aside>\s*<\/body><\/html>\s*$/.test(html) || html.includes("<!--")) return {};
  const main = html.match(/<main id="synthetic-company" data-synthetic="true">([\s\S]*?)<\/main>/g);
  if (main?.length !== 1 || /<(?:script|iframe|img|link)\b|https?:|\/\//i.test(html)) return {};
  const patterns = {
    companyTitle: /<h1>([^<>]+)<\/h1>/g,
    facility: /<p id="facility">([^<>]+)<\/p>/g,
    service: /<p id="service">([^<>]+)<\/p>/g,
    procurementRoute: /<a id="procurement" href="(\/[a-z/-]+)">[^<>]+<\/a>/g,
  };
  const facts = {};
  let remaining = main[0].replace(/^<main[^>]*>|<\/main>$/g, "");
  for (const [key, pattern] of Object.entries(patterns)) {
    const matches = [...main[0].matchAll(pattern)];
    if (matches.length === 1 && !matches[0][1].includes("&")) facts[key] = normalize(matches[0][1]);
    remaining = remaining.replace(pattern, "");
  }
  return remaining.trim() ? {} : facts;
}

// Accept only bounded, successful candidate output corroborated by selected source text.
// Test doubles exercise this contract; they are never evidence of candidate execution.
export function normalizeResult({ html = fixture, stdout, exitCode, timedOut = false } = {}) {
  const base = { capabilityId: "EXTRACT_WEB_PAGE", authority: "EVIDENCE_CANDIDATE",
    rightsClass: "SYNTHETIC_ALLOWED", synthetic: true, observedAt: null,
    fixtureFingerprint: typeof html === "string" ? fingerprint(html) : null };
  const finish = (resultState, facts = {}) => ({ ...base, resultState, facts,
    selectedFactsFingerprint: fingerprint(JSON.stringify(facts)) });
  if (exitCode !== 0 || timedOut || typeof stdout !== "string" || Buffer.byteLength(stdout) > 16384) return finish("ERROR");
  try {
    const output = JSON.parse(stdout);
    if (output?.success !== true || !Array.isArray(output.records)) return finish("ERROR");
    if (!output.records.length) return finish("UNKNOWN");
    if (output.records.length !== 1) return finish("ERROR");
    const record = output.records[0];
    if (!record || typeof record !== "object" || Array.isArray(record)) return finish("ERROR");
    const allowed = schema.fields.map(field => field.name);
    if (Object.keys(record).some(key => !allowed.includes(key))) return finish("ERROR");
    const expected = sourceFacts(html), facts = {};
    for (const key of allowed) {
      if (record[key] === undefined || record[key] === "") continue;
      if (typeof record[key] !== "string" || !expected[key] || normalize(record[key]) !== expected[key]) return finish("ERROR");
      facts[key] = normalize(record[key]);
    }
    const count = Object.keys(facts).length;
    return finish(count === allowed.length ? "PRESENT" : count ? "PARTIAL" : "UNKNOWN", facts);
  } catch { return finish("ERROR"); }
}
