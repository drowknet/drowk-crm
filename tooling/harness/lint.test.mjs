import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";
import { readFileSync } from "node:fs";
import { acceptedFinding, exceptions, sourceDigest } from "./lint.mjs";

test("real static analysis catches JS and TS defects without rewriting source", async () => {
  const lint = new ESLint({ fix: false });
  for (const [filePath, text] of [
    ["tooling/harness/synthetic.mjs", "debugger;\n"],
    ["packages/domain/src/synthetic.ts", "const n: number = 1; n = 2;\n"],
  ]) {
    const [result] = await lint.lintText(text, { filePath });
    assert.ok(result.errorCount > 0);
    assert.equal(result.output, undefined);
  }
  const [safe] = await lint.lintText("export const count: number = 1;\n", {
    filePath: "packages/contracts/src/synthetic.ts",
  });
  assert.equal(safe.errorCount, 0);
  const [suppressed] = await lint.lintText("/* eslint-disable no-debugger */\ndebugger;\n", {
    filePath: "tooling/harness/synthetic.mjs",
  });
  assert.ok(suppressed.errorCount > 0);
});

test("lint exceptions bind exact location/rule/content and cannot waive warnings or new code", () => {
  for (const exception of exceptions) {
    const source = readFileSync(new URL(`../../${exception.path}`, import.meta.url), "utf8");
    const digest = sourceDigest(source);
    const message = { ruleId: exception.ruleId, line: exception.line, column: exception.column, severity: 2 };
    assert.equal(acceptedFinding(exception.path, digest, message), true);
    assert.equal(acceptedFinding("other.ts", digest, message), false);
    assert.equal(acceptedFinding(exception.path, sourceDigest(source + "\n"), message), false);
    assert.equal(acceptedFinding(exception.path, digest, { ...message, line: message.line + 1 }), false);
    assert.equal(acceptedFinding(exception.path, digest, { ...message, severity: 1 }), false);
    assert.ok(exception.justification.length > 20);
  }
});
