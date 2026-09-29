import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("Relationship memory has no BuyerRole, score, Commitment writer or live provider authority", () => {
  const paths = [
    new URL("../../contracts/src/relationship.ts", import.meta.url),
    new URL("../src/relationship.ts", import.meta.url),
    new URL("../../db/src/relationship.ts", import.meta.url),
  ];
  for (const path of paths) {
    const source = readFileSync(path, "utf8");
    const imports = [...source.matchAll(/\b(?:from\s*|import\s*\(|require\s*\()\s*["']([^"']+)/g)]
      .map(match => match[1]);
    assert.ok(imports.every(name => ["@drowk/contracts", "pg", "./ids.js"].includes(name)),
      `${path.pathname} imports only contracts or PostgreSQL`);
    assert.doesNotMatch(source, /\b(?:buyer_roles|commitments|trust_score|health_score|readiness_score)\b/i);
    assert.doesNotMatch(source, /\b(?:fetch|sendMail|createDraft|dispatch|invokeModel)\s*\(/);
  }
  const dependencies = JSON.parse(readFileSync(
    new URL("../../db/package.json", import.meta.url), "utf8")).dependencies;
  assert.deepEqual(Object.keys(dependencies).sort(), ["@drowk/contracts", "@drowk/domain", "pg"]);
});
