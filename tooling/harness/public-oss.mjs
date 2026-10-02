import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { git } from "./secrets.mjs";

export const publicOssPatterns = [
  ["OWNER_EMAIL", /asbrito@proton\.me/gi],
  ["PROVIDER_ACCOUNT_EMAIL", /drowknet@gmail\.com/gi],
  ["TENANT_DOMAIN", /andersonpacificwestinc\.net/gi],
  ["LOCAL_TENANT_PATH", /D:\\Workspace\\Projects\\PWM\\PWM_CRM/gi],
  ["TENANT_NAME", /\bPacific West\b/gi],
  ["TENANT_SOURCE_ID", /\bPWM_CRM\b/g],
  ["TENANT_REASON_CODE", /COMMERCIAL_EXCLUSION_EXISTING_PWM/g],
];

const textExtensions = new Set([".md", ".json", ".yml", ".yaml", ".mjs", ".js", ".ts", ".sql", ".txt", ".example"]);

export function trackedTextPaths(root) {
  return git(root, ["ls-files", "-z"]).split("\0").filter(Boolean)
    .filter(path => textExtensions.has(extname(path)) || path.endsWith(".env.example"));
}

export function scanPublicOssText(path, content) {
  const findings = [];
  const lines = content.split(/\r?\n/);
  for (const [detector, pattern] of publicOssPatterns) {
    pattern.lastIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) findings.push({ detector, path, line: i + 1 });
    }
  }
  return findings;
}

export function scanPublicOssTree(root) {
  const findings = [];
  for (const path of trackedTextPaths(root)) {
    let content;
    try { content = readFileSync(resolve(root, path), "utf8"); }
    catch { throw new Error("PUBLIC_OSS_READ_FAILED"); }
    findings.push(...scanPublicOssText(path, content));
  }
  return findings;
}

export function formatPublicOssFindings(findings) {
  return findings.map(f => `PUBLIC_OSS_FINDING detector=${f.detector} path=${f.path} line=${f.line}`).join("\n");
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  try {
    const root = resolve(new URL("../..", import.meta.url).pathname);
    const findings = scanPublicOssTree(root);
    if (findings.length) {
      console.error(formatPublicOssFindings(findings));
      process.exitCode = 1;
    } else {
      console.log("PUBLIC_OSS_SCAN_PASS");
    }
  } catch {
    console.error("PUBLIC_OSS_SCAN_FAILED_CLOSED");
    process.exitCode = 1;
  }
}
