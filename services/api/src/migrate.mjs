import { readDatabaseUrl } from "./database-config.mjs";

// Explicit staging-only entrypoint; the API never imports or invokes this module.
try {
  if (process.env.APP_ENV !== "staging" || process.argv.length !== 3
    || !["plan", "status", "apply"].includes(process.argv[2])) throw new Error();
  const databaseUrl = readDatabaseUrl(process.env);
  process.env.DATABASE_URL = databaseUrl;
  delete process.env.DATABASE_URL_FILE;
  await import("../node_modules/@drowk/db/dist/migrate-cli.js");
} catch { console.error("STAGING_MIGRATION_FAILED"); process.exitCode = 1; }
