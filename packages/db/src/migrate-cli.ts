import pg from "pg";
import { applyMigrations, MigrationError, migrationStatus } from "./migrations.js";

const command = process.argv[2];
if (process.argv.length !== 3 || !["plan", "status", "apply"].includes(command ?? "")) {
  console.error("Usage: migrate <plan|status|apply>");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL || !process.env.APP_ENV?.trim()) {
  console.error("DATABASE_URL and APP_ENV are required");
  process.exitCode = 1;
} else {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 1 });
  pool.on("error", () => { /* Errors are surfaced without connection details. */ });
  try {
    const result = command === "apply" ? await applyMigrations(pool) : await migrationStatus(pool);
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof MigrationError ? error.code : "MIGRATION_COMMAND_FAILED");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
