import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve, relative } from "node:path";
import { git } from "./secrets.mjs";

const markdownLink = /\[[^\]]*\]\(([^)]+)\)/g;

export function relativeLinkTargets(content) {
  const targets = [];
  for (const match of content.matchAll(markdownLink)) {
    const raw = match[1]?.trim();
    if (!raw || raw.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) continue;
    const target = raw.split(/\s+/)[0]?.replace(/^<|>$/g, "").split("#")[0]?.split("?")[0];
    if (target) targets.push(target);
  }
  return targets;
}

export function brokenRelativeLinks(path, content, root, exists = existsSync) {
  const findings = [];
  for (const target of relativeLinkTargets(content)) {
    let decoded;
    try { decoded = decodeURIComponent(target); } catch { decoded = target; }
    const absolute = resolve(root, dirname(path), decoded);
    const rel = relative(root, absolute);
    if (rel.startsWith("..") || rel === "") {
      if (rel.startsWith("..")) findings.push({ path, target, code: "OUTSIDE_REPOSITORY" });
      continue;
    }
    if (!exists(absolute)) findings.push({ path, target, code: "MISSING_TARGET" });
  }
  return findings;
}

export function scanMarkdownLinks(root) {
  const paths = git(root, ["ls-files", "-z"]).split("\0").filter(Boolean)
    .filter(path => extname(path).toLowerCase() === ".md");
  const findings = [];
  for (const path of paths) {
    let content;
    try { content = readFileSync(resolve(root, path), "utf8"); }
    catch { throw new Error("DOC_LINK_READ_FAILED"); }
    findings.push(...brokenRelativeLinks(path, content, root));
  }
  return findings;
}

export function formatLinkFindings(findings) {
  return findings.map(f => `DOC_LINK_FINDING code=${f.code} path=${f.path} target=${f.target}`).join("\n");
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  try {
    const root = resolve(new URL("../..", import.meta.url).pathname);
    const findings = scanMarkdownLinks(root);
    if (findings.length) {
      console.error(formatLinkFindings(findings));
      process.exitCode = 1;
    } else {
      console.log("DOC_LINK_SCAN_PASS");
    }
  } catch {
    console.error("DOC_LINK_SCAN_FAILED_CLOSED");
    process.exitCode = 1;
  }
}
