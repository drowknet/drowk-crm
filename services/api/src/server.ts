import { createServer, type Server } from "node:http";
import pg from "pg";
import { migrationStatus } from "@drowk/db";
import { health } from "./index.js";

export interface RuntimeConfig {
  databaseUrl: string;
  environment: string;
  host: string;
  port: number;
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  if (!env.DATABASE_URL || !env.APP_ENV?.trim()) throw new Error("DATABASE_URL and APP_ENV are required");
  const port = env.PORT ?? "8000";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid PORT");
  return {
    databaseUrl: env.DATABASE_URL, environment: env.APP_ENV,
    host: env.HOST ?? "127.0.0.1", port: Number(port),
  };
}

/** Small replaceable HTTP boundary; readiness dependencies are injected for testing. */
export function createProbeServer(isReady: () => Promise<boolean>): Server {
  return createServer((request, response) => {
    const reply = (code: number, body: object) => {
      response.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      response.end(JSON.stringify(body));
    };
    if (request.method === "GET" && request.url === "/health") {
      reply(200, health());
    } else if (request.method === "GET" && request.url === "/ready") {
      void (async () => {
        let ready = false;
        try { ready = await isReady(); } catch { /* Public probes never include internal errors. */ }
        reply(ready ? 200 : 503, { service: "drowk-api", status: ready ? "ready" : "not_ready" });
      })();
    } else {
      reply(404, { status: "not_found" });
    }
  });
}

/** Startup does not connect to PostgreSQL or apply migrations. */
export function createRuntime(config: RuntimeConfig): { server: Server; close: () => Promise<void> } {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 1500,
    statement_timeout: 1500,
    query_timeout: 2000,
    idleTimeoutMillis: 10000,
  });
  pool.on("error", () => { /* A subsequent readiness check reports a generic failure. */ });
  const server = createProbeServer(async () => (await migrationStatus(pool)).current);
  return {
    server,
    close: async () => {
      if (server.listening) await new Promise<void>((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
      await pool.end();
    },
  };
}
