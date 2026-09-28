import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("goldens 17-18: interaction contracts/domain/repository have no live provider or outbound path", () => {
  const sources = [
    new URL("../../contracts/src/interaction.ts", import.meta.url),
    new URL("../src/interaction.ts", import.meta.url),
    new URL("../../db/src/interaction.ts", import.meta.url),
  ];
  for (const url of sources) {
    const source = readFileSync(url, "utf8");
    const imports = [...source.matchAll(/\b(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)/g)]
      .map(match => match[1]);
    assert.ok(imports.every(name => ["@drowk/contracts", "pg", "./ids.js", "node:crypto"].includes(name)),
      `${url.pathname} imports only contracts or PostgreSQL`);
    assert.doesNotMatch(source, /\b(?:fetch|sendMail|createDraft|dispatch|executeAction|invokeModel)\s*\(/);
  }
  const dbDependencies = JSON.parse(readFileSync(
    new URL("../../db/package.json", import.meta.url), "utf8")).dependencies;
  assert.deepEqual(Object.keys(dbDependencies).sort(), ["@drowk/contracts", "pg"]);
});
