import assert from "node:assert/strict";
import { test } from "node:test";
import { brokenRelativeLinks, relativeLinkTargets } from "./docs-links.mjs";

test("relative link parser ignores external URLs and anchors", () => {
  assert.deepEqual(relativeLinkTargets([
    "[local](../README.md#top)",
    "[web](https://example.com/x)",
    "[anchor](#section)",
    "[mail](mailto:test@example.invalid)",
  ].join("\n")), ["../README.md"]);
});

test("relative link checker reports missing and outside-repository targets", () => {
  const exists = path => path.endsWith("/README.md");
  assert.deepEqual(brokenRelativeLinks("docs/x.md",
    "[ok](../README.md)\n[missing](missing.md)\n[out](../../outside.md)",
    "/repo", exists), [
      { path: "docs/x.md", target: "missing.md", code: "MISSING_TARGET" },
      { path: "docs/x.md", target: "../../outside.md", code: "OUTSIDE_REPOSITORY" },
    ]);
});
