import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("goldens 17-18: human continuity has no model, provider or execution call path", () => {
  const sources = [
    new URL("../../contracts/src/human-continuity.ts", import.meta.url),
    new URL("../../contracts/src/crm.ts", import.meta.url),
    new URL("../src/human-continuity.ts", import.meta.url),
    new URL("../../db/src/human-continuity.ts", import.meta.url),
  ];
  for (const url of sources) {
    const source = readFileSync(url, "utf8");
    const imports = [...source.matchAll(/\b(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)/g)]
      .map(match => match[1]);
    assert.ok(imports.every(name => ["@drowk/contracts", "pg", "./ids.js"].includes(name)),
      `${url.pathname} imports only contracts or PostgreSQL`);
    assert.doesNotMatch(source, /\b(?:fetch|sendMail|createDraft|dispatch|executeAction|invokeModel)\s*\(/);
  }
  const dbDependencies = JSON.parse(readFileSync(
    new URL("../../db/package.json", import.meta.url), "utf8")).dependencies;
  assert.deepEqual(Object.keys(dbDependencies).sort(), ["@drowk/contracts", "pg"]);
  const domainDependencies = JSON.parse(readFileSync(
    new URL("../package.json", import.meta.url), "utf8")).dependencies;
  assert.deepEqual(Object.keys(domainDependencies), ["@drowk/contracts"]);
});
