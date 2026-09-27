import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Pool, PoolClient } from "pg";
import { migrationBody } from "./migration-sql.js";

export const defaultMigrationsDirectory = fileURLToPath(new URL("../migrations/", import.meta.url));
// Stable application namespace. PostgreSQL advisory locks are scoped to the database.
const lockKey = [1146241869, 1] as const;

export class MigrationError extends Error {
  constructor(readonly code: string) { super(code); this.name = "MigrationError"; }
}

interface Migration {
  version: string;
  filename: string;
  checksum: string;
  body: string;
}

export interface MigrationStatus {
  current: boolean;
  migrations: Array<{
    version: string;
    filename: string;
    checksum: string;
    state: "applied" | "pending";
  }>;
}

async function discover(directory: string): Promise<Migration[]> {
  const entries = (await readdir(directory, { withFileTypes: true }))
    .filter(entry => entry.name.endsWith(".sql"))
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  if (!entries.length) throw new MigrationError("MIGRATIONS_MISSING");
  const versions = new Set<string>();
  const migrations: Migration[] = [];
  for (const entry of entries) {
    const version = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(entry.name)?.[1];
    if (!entry.isFile() || !version || versions.has(version)) {
      throw new MigrationError("MIGRATION_FILENAME_INVALID");
    }
    versions.add(version);
    const bytes = await readFile(join(directory, entry.name));
    let body: string;
    try { body = migrationBody(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { throw new MigrationError("MIGRATION_SQL_INVALID"); }
    migrations.push({
      version, filename: entry.name,
      checksum: createHash("sha256").update(bytes).digest("hex"), body,
    });
  }
  return migrations;
}

async function locked<T>(pool: Pool, mode: "read" | "apply", work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  const shared = mode === "read";
  let acquired = false;
  // If acquiring the lock loses its response, do not reuse an uncertain session.
  let discard = true;
  try {
    const result = await client.query<{ locked: boolean }>(
      shared ? "SELECT pg_try_advisory_lock_shared($1, $2) AS locked"
        : "SELECT pg_try_advisory_lock($1, $2) AS locked", [...lockKey],
    );
    acquired = result.rows[0]?.locked === true;
    discard = false;
    if (!acquired) throw new MigrationError("MIGRATION_LOCKED");
    return await work(client);
  } catch (error) {
    if (error instanceof MigrationError && error.code === "MIGRATION_ROLLBACK_FAILED") discard = true;
    throw error;
  } finally {
    if (acquired && !discard) {
      try {
        const result = await client.query<{ unlocked: boolean }>(
          shared ? "SELECT pg_advisory_unlock_shared($1, $2) AS unlocked"
            : "SELECT pg_advisory_unlock($1, $2) AS unlocked", [...lockKey],
        );
        discard = result.rows[0]?.unlocked !== true;
      } catch { discard = true; }
    }
    client.release(discard);
  }
}

async function inspect(client: PoolClient, migrations: Migration[]): Promise<MigrationStatus> {
  const exists = await client.query<{ name: string | null }>(
    "SELECT to_regclass('public.drowk_schema_migrations')::text AS name",
  );
  const applied = exists.rows[0]?.name
    ? (await client.query<{ version: string; filename: string; checksum: string }>(
      'SELECT version, filename, checksum FROM public.drowk_schema_migrations ORDER BY filename COLLATE "C"',
    )).rows : [];
  for (let i = 0; i < applied.length; i++) {
    const entry = applied[i]!;
    const migration = migrations[i];
    if (!migration || entry.filename !== migration.filename || entry.version !== migration.version) {
      throw new MigrationError("MIGRATION_HISTORY_INVALID");
    }
    if (entry.checksum !== migration.checksum) throw new MigrationError("MIGRATION_CHECKSUM_CHANGED");
  }
  return {
    current: applied.length === migrations.length,
    migrations: migrations.map((migration, i) => ({
      version: migration.version, filename: migration.filename, checksum: migration.checksum,
      state: i < applied.length ? "applied" : "pending",
    })),
  };
}

/** A read-only plan: database reachability, immutable history, and pending files. */
export async function migrationStatus(pool: Pool, directory = defaultMigrationsDirectory): Promise<MigrationStatus> {
  const migrations = await discover(directory);
  return locked(pool, "read", client => inspect(client, migrations));
}

export async function applyMigrations(pool: Pool, directory = defaultMigrationsDirectory): Promise<{ applied: string[] }> {
  const migrations = await discover(directory);
  return locked(pool, "apply", async client => {
    const status = await inspect(client, migrations);
    if (status.current) return { applied: [] };
    await client.query(`CREATE TABLE IF NOT EXISTS public.drowk_schema_migrations (
      version text PRIMARY KEY,
      filename text NOT NULL UNIQUE,
      checksum text NOT NULL CHECK (checksum ~ '^[a-f0-9]{64}$'),
      applied_at timestamptz NOT NULL DEFAULT current_timestamp
    )`);
    const applied: string[] = [];
    for (let i = 0; i < migrations.length; i++) {
      if (status.migrations[i]!.state === "applied") continue;
      const migration = migrations[i]!;
      try {
        await client.query("BEGIN");
        await client.query("SET LOCAL search_path TO public");
        await client.query("SET LOCAL standard_conforming_strings = on");
        await client.query(migration.body);
        await client.query(
          "INSERT INTO public.drowk_schema_migrations (version, filename, checksum) VALUES ($1, $2, $3)",
          [migration.version, migration.filename, migration.checksum],
        );
        await client.query("COMMIT");
      } catch {
        try { await client.query("ROLLBACK"); }
        catch { throw new MigrationError("MIGRATION_ROLLBACK_FAILED"); }
        throw new MigrationError("MIGRATION_APPLY_FAILED");
      }
      applied.push(migration.filename);
    }
    return { applied };
  });
}
