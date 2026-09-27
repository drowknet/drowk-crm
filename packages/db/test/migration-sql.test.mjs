import assert from "node:assert/strict";
import { test } from "node:test";
import { migrationBody } from "../dist/migration-sql.js";

test("outer wrapper is removed while quoted SQL and function bodies are preserved", () => {
  const body = migrationBody(`-- leading comment
    BEGIN;
    SELECT 'COMMIT; it''s text', E'escaped\\\'quote;';
    DO $body$ BEGIN PERFORM 1; END; $body$;
    /* nested /* comment */ */ COMMIT; -- final comment`);
  assert.match(body, /SELECT 'COMMIT; it''s text'/);
  assert.match(body, /DO \$body\$ BEGIN PERFORM 1; END; \$body\$/);
  assert.doesNotMatch(body, /^BEGIN/);
  assert.doesNotMatch(body, /COMMIT;$/);
});

test("transaction escapes and malformed wrappers are rejected before execution", () => {
  for (const sql of [
    "BEGIN; SELECT 1", "SELECT 1; COMMIT", "SELECT 1; END", "SELECT 1; ABORT",
    "START TRANSACTION; SELECT 1", "BEGIN; COMMIT; SELECT 1; COMMIT",
    "BEGIN; SELECT 1; ROLLBACK; COMMIT", "SELECT 1; PREPARE TRANSACTION 'x'",
    "SELECT 1 AS foo$tag$; COMMIT; SELECT 1 AS end$tag$;",
    "SELECT 'unclosed", "DO $$ unclosed", "/* unclosed", "-- empty",
  ]) assert.throws(() => migrationBody(sql));
});
