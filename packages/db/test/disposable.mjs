import { randomUUID } from "node:crypto";
import { setTimeout } from "node:timers/promises";
import pg from "pg";

/** Creates only a new synthetic database; never migrates the supplied admin DB. */
export async function disposableDatabase(t) {
  const url = new URL(process.env.DROWK_TEST_DATABASE_URL);
  if (process.env.DROWK_TEST_DISPOSABLE !== "1" || !/(_test|_ci)$/.test(decodeURIComponent(url.pathname.slice(1)))) {
    throw new Error("Tests require an explicitly disposable *_test or *_ci database");
  }
  const name = `drowk_${randomUUID().replaceAll("-", "")}_test`;
  const admin = new pg.Pool({ connectionString: url.href, max: 1, connectionTimeoutMillis: 3000 });
  try { await admin.query(`CREATE DATABASE "${name}"`); }
  catch (error) { await admin.end(); throw error; }
  url.pathname = `/${name}`;
  const pool = new pg.Pool({ connectionString: url.href, max: 5, connectionTimeoutMillis: 3000 });
  t.after(async () => {
    await pool.end();
    try {
      // pg.Pool.end() can resolve before PostgreSQL observes every socket close.
      // Wait for graceful shutdown; FORCE can race it and emit an unhandled client error.
      const deadline = Date.now() + 5000;
      while ((await admin.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = $1", [name])).rows[0].n > 0) {
        if (Date.now() >= deadline) throw new Error("Disposable database still has open test connections");
        await setTimeout(20);
      }
      await admin.query(`DROP DATABASE "${name}"`);
    }
    finally { await admin.end(); }
  });
  return { pool, url: url.href };
}
