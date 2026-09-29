import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("interaction continuity has no Relationship, BuyerRole, Commitment, provider or outbound path", () => {
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
    assert.doesNotMatch(source, /\b(?:relationships|buyer_roles|commitments)\b/i);
  }
  const dbDependencies = JSON.parse(readFileSync(
    new URL("../../db/package.json", import.meta.url), "utf8")).dependencies;
  assert.deepEqual(Object.keys(dbDependencies).sort(), ["@drowk/contracts", "@drowk/domain", "pg"]);
});
