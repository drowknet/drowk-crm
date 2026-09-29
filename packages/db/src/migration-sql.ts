/** Split top-level SQL statements; comments/quoted bodies cannot end a statement. */
function statements(sql: string): string[] {
  const result: string[] = [];
  let current = "";
  let i = 0;
  while (i < sql.length) {
    if (sql.startsWith("--", i)) {
      const end = sql.indexOf("\n", i);
      i = end < 0 ? sql.length : end + 1;
      current += " ";
    } else if (sql.startsWith("/*", i)) {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth > 0) {
        if (sql.startsWith("/*", i)) { depth++; i += 2; }
        else if (sql.startsWith("*/", i)) { depth--; i += 2; }
        else i++;
      }
      if (depth !== 0) throw new Error("Unclosed SQL comment");
      current += " ";
    } else if (sql[i] === "'" || sql[i] === '"') {
      const quote = sql[i]!;
      const escapes = quote === "'" && /(?:^|\W)[eE]$/.test(current);
      const start = i++;
      let closed = false;
      while (i < sql.length) {
        if (escapes && sql[i] === "\\") i += 2;
        else if (sql[i] === quote && sql[i + 1] === quote) i += 2;
        else if (sql[i++] === quote) { closed = true; break; }
      }
      if (!closed) throw new Error("Unclosed SQL quote");
      current += sql.slice(start, i);
    } else if (sql[i] === "$" && !/[\p{L}\p{N}_$]/u.test(sql[i - 1] ?? "")
      && /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.test(sql.slice(i))) {
      const delimiter = /^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/.exec(sql.slice(i))![0];
      const end = sql.indexOf(delimiter, i + delimiter.length);
      if (end < 0) throw new Error("Unclosed SQL body");
      current += sql.slice(i, end + delimiter.length);
      i = end + delimiter.length;
    } else if (sql[i] === ";") {
      if (current.trim()) result.push(current.trim());
      current = "";
      i++;
    } else {
      current += sql[i++];
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

/** The runner owns the transaction, including the ledger write. Files remain unchanged. */
export function migrationBody(sql: string): string {
  const parts = statements(sql);
  if (/^BEGIN(?:\s+(?:WORK|TRANSACTION))?$/i.test(parts[0] ?? "")) {
    if (!/^COMMIT(?:\s+(?:WORK|TRANSACTION))?$/i.test(parts.at(-1) ?? "")) {
      throw new Error("Migration has an incomplete transaction wrapper");
    }
    parts.shift();
    parts.pop();
  }
  if (!parts.length) throw new Error("Empty migration");
  for (const part of parts) {
    if (/^(?:BEGIN|START|COMMIT|END|ROLLBACK|ABORT|SAVEPOINT|RELEASE|PREPARE)\b/i.test(part)
      || /^SET\s+(?:(?:LOCAL|SESSION)\s+)?(?:TRANSACTION|CHARACTERISTICS)\b/i.test(part)) {
      throw new Error("Migration contains transaction control");
    }
  }
  return `${parts.join(";\n")};`;
}
