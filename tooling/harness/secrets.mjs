import { execFileSync } from "node:child_process";
import { readFileSync, lstatSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Findings contain metadata only. Never return captures, source lines or Git stderr.
const detectors = [
  ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g],
  ["GITHUB_TOKEN", /\b(?:gh[pousr]_[A-Za-z0-9]{36,255}|github_pat_[A-Za-z0-9_]{60,255})\b/g],
  ["PROVIDER_TOKEN", /\b(?:sk-(?:proj-|ant-api\d+-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{35}|xox[baprs]-[A-Za-z0-9-]{20,})\b/g],
  ["AWS_ACCESS_KEY", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ["JWT", /\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{16,}\b/g],
];
const placeholder = /^(?:example|placeholder|changeme|redacted|synthetic|dummy|test|your[-_ ].*|<[^>]+>|\$\{[^}]+\})$/i;
// Exact known synthetic literals only; never suppress other values in these files.
export const allowances = [
  { path: ".github/workflows/ci.yml", detector: "SECRET_ASSIGNMENT", value: "drowk_ci_password",
    justification: "Public disposable CI PostgreSQL service fixture, not a deployed credential." },
  { path: "capabilities/aisa/test/business-listings.test.mjs", detector: "SECRET_ASSIGNMENT", value: "credential-like",
    justification: "Existing rejection-test input for forbidden normalizedInput.apiKey." },
];

export function scanText(text, path, { history = false, commit } = {}) {
  const findings = [];
  const add = (detector, index) => findings.push({ detector, path,
    line: text.slice(0, index).split("\n").length, ...(commit ? { commit } : {}) });
  for (const [id, pattern] of detectors) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) add(id, match.index);
  }
  if (!history) {
    // Literal assignments in JS/TS, JSON, YAML, shell and dotenv. Expressions are not values.
    const assignments = /(?:^|[\s,{;])['"]?([A-Za-z_$][\w$.-]*)['"]?[ \t]*[:=][ \t]*(?:(["'`])([^\r\n]*?)\2|([^\s,;#}"'`]+))/gm;
    for (const match of text.matchAll(assignments)) {
      const name = match[1];
      if (!/(?:secret|token|password|passwd|api[_-]?key|private[_-]?key)$/i.test(name) &&
          !/^(?:key|[A-Z][A-Z0-9_]*_KEY)$/.test(name) &&
          !/(?:signing|encryption|access|auth|client|session)[_-]?key$/i.test(name)) continue;
      const value = match[3] ?? match[4];
      if (!value || placeholder.test(value)) continue;
      // Only unquoted env/YAML literals, not function calls or identifier references.
      const lineStart = text.lastIndexOf("\n", match.index + match[0].indexOf(name)) + 1;
      const sourceFile = /\.[cm]?[jt]sx?$/.test(path);
      const yamlLiteral = !sourceFile && /^[ \t]*[\w-]+[ \t]*:/.test(text.slice(lineStart));
      const envLiteral = !sourceFile && /^[ \t]*(?:export[ \t]+)?[A-Z][A-Z0-9_]*[ \t]*=/.test(text.slice(lineStart));
      if (!match[2] && ((!envLiteral && !yamlLiteral) ||
          /^(?:null|undefined|true|false)$/i.test(value) || /[()[\]$]/.test(value))) continue;
      if (value.length >= 8 && !allowances.some(a => a.path === path &&
          a.detector === "SECRET_ASSIGNMENT" && a.value === value && a.justification)) {
        add("SECRET_ASSIGNMENT", match.index + match[0].indexOf(match[1]));
      }
    }
  }
  return findings;
}

export function git(root, args) {
  try { return execFileSync("git", ["--no-pager", ...args], { cwd: root,
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }); }
  catch { throw new Error("SECRET_GIT_READ_FAILED"); }
}

export function forbiddenPath(path) {
  const name = path.split("/").at(-1);
  return (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) ||
    /\.(?:pem|key|p12|pfx)$/i.test(name) ||
    /^(?:credentials|service-account).*\.json$/i.test(name) ||
    /^(?:id_rsa|id_ed25519|id_ecdsa|\.dev\.vars)$/.test(name) ||
    /(?:^|\/)(?:secrets|\.local-secrets)\//.test(path);
}

export function trackedPaths(root) {
  return git(root, ["ls-files", "-z"]).split("\0").filter(Boolean).sort();
}

export function scanTree(root) {
  const findings = [];
  for (const path of trackedPaths(root)) {
    if (forbiddenPath(path)) findings.push({ detector: "SECRET_FILE", path });
    const absolute = resolve(root, path);
    // Do not follow links into an untracked secret store.
    if (!lstatSync(absolute).isFile()) throw new Error("SECRET_UNSUPPORTED_TRACKED_FILE");
    findings.push(...scanText(readFileSync(absolute, "utf8"), path));
  }
  return findings;
}

export function scanHistory(root) {
  if (git(root, ["rev-parse", "--is-shallow-repository"]).trim() !== "false") {
    throw new Error("SECRET_HISTORY_SHALLOW");
  }
  const findings = [], seen = new Set();
  const commits = git(root, ["rev-list", "--all", "HEAD"]).trim().split("\n").filter(Boolean);
  for (const commit of commits) {
    const entries = git(root, ["ls-tree", "-r", "-z", commit]).split("\0").filter(Boolean);
    for (const entry of entries) {
      const split = entry.indexOf("\t"), path = entry.slice(split + 1);
      const [mode, type, oid] = entry.slice(0, split).split(" ");
      if (type !== "blob" || mode === "160000") throw new Error("SECRET_HISTORY_UNSUPPORTED_GITLINK");
      // Symlink blobs are content, not filesystem paths: inspect without following.
      const blobPathIdentity = `${oid}:${path}`;
      if (seen.has(blobPathIdentity)) continue;
      seen.add(blobPathIdentity);
      findings.push(...scanText(git(root, ["cat-file", "blob", oid]), path, { history: true, commit }));
    }
  }
  return findings;
}

export function formatFindings(findings) {
  return findings.map(({ detector, path, line, commit }) =>
    JSON.stringify({ detector, path, ...(line ? { line } : {}), ...(commit ? { commit } : {}) })).join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const mode = process.argv[2];
    if (!["tree", "history", "all"].includes(mode) || process.argv.length !== 3) throw new Error("SECRET_USAGE");
    const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]).trim();
    const findings = [...(mode !== "history" ? scanTree(root) : []),
      ...(mode !== "tree" ? scanHistory(root) : [])];
    if (findings.length) { console.error(formatFindings(findings)); process.exitCode = 1; }
    else console.log(`SECRET_SCAN_PASS ${mode}`);
  } catch { console.error("SECRET_SCAN_FAILED_CLOSED"); process.exitCode = 1; }
}
