import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("goldens 20-22: Commitment has no Relationship, model, provider or outbound authority", () => {
  const sources = [
    new URL("../../contracts/src/commitment.ts", import.meta.url),
    new URL("../src/commitment.ts", import.meta.url),
    new URL("../../db/src/commitment.ts", import.meta.url),
  ];
  for (const url of sources) {
    const source = readFileSync(url, "utf8");
    const imports = [...source.matchAll(/\b(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)/g)]
      .map(match => match[1]);
    assert.ok(imports.every(name => ["@drowk/contracts", "pg", "./ids.js", "node:crypto"].includes(name)));
    assert.doesNotMatch(source, /\b(?:fetch|sendMail|createDraft|dispatch|executeAction|invokeModel)\s*\(/);
    assert.doesNotMatch(source, /\b(?:Relationship|BuyerRole|WorkItem|Task)\b/);
  }
});
