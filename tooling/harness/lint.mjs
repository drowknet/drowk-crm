import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const exceptions = JSON.parse(readFileSync(new URL("lint-exceptions.json", import.meta.url), "utf8"));
export const sourceDigest = source => createHash("sha256").update(source.replaceAll("\r\n", "\n")).digest("hex");

// Exact reviewed finding + whole-file content digest, never a file/rule-wide disable.
// Any edit invalidates that file's exceptions and requires review or removing them.
export function acceptedFinding(path, digest, message) {
  return exceptions.some(e => e.path === path && e.sha256 === digest &&
    e.ruleId === message.ruleId && e.line === message.line && e.column === message.column &&
    message.severity === 2 && e.justification.length > 0);
}

export async function main() {
  const lint = new ESLint({ cwd: root, fix: false });
  const results = await lint.lintFiles(["."]);
  let errors = 0, warnings = 0, reviewed = 0;
  for (const result of results) {
    const path = relative(root, result.filePath).replaceAll("\\", "/");
    const digest = sourceDigest(readFileSync(result.filePath, "utf8"));
    for (const message of result.messages) {
      if (acceptedFinding(path, digest, message)) { reviewed++; continue; }
      if (message.severity === 2) errors++; else warnings++;
      // ESLint messages may contain source values. Expose location/rule only.
      console.error(JSON.stringify({ path, ruleId: message.ruleId, line: message.line,
        column: message.column, severity: message.severity }));
    }
  }
  console.log(JSON.stringify({ lintedFiles: results.length, errors, warnings, reviewedFindings: reviewed }));
  return errors || warnings ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await main(); }
  catch { console.error("LINT_FAILED_CLOSED"); process.exitCode = 1; }
}
