import { createServer, type Server } from "node:http";
import pg from "pg";
import { migrationStatus, PostgresIdentityRepository } from "@drowk/db";
import { health } from "./index.js";
import { authorizeRequest, type AuthorizationDependencies, type PrincipalVerifier } from "./authorization.js";
import { configuredVerifier, readAccessConfig, type AccessConfig } from "./cloudflare-access.js";
import { createClose } from "./runtime.mjs";
import { readDatabaseUrl, validateStagingAccess } from "./database-config.mjs";

export interface RuntimeConfig {
  databaseUrl: string;
  environment: string;
  host: string;
  port: number;
  access?: AccessConfig;
}

export function readRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  if (!env.APP_ENV?.trim()) throw new Error("APP_ENV is required");
  const databaseUrl = readDatabaseUrl(env);
  validateStagingAccess(env);
  const port = env.PORT ?? "8000";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error("Invalid PORT");
  const access = readAccessConfig(env);
  return {
    databaseUrl, environment: env.APP_ENV,
    host: env.HOST ?? "127.0.0.1", port: Number(port), ...(access ? { access } : {}),
  };
}

/** Small replaceable HTTP boundary; readiness dependencies are injected for testing. */
export function createProbeServer(isReady: () => Promise<boolean>, authorization?: AuthorizationDependencies): Server {
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
    } else if (request.method === "GET" && request.url === "/operator/context") {
      void (async () => {
        if (!authorization) { reply(401, { status: "unauthenticated" }); return; }
        const result = await authorizeRequest(request, authorization);
        reply(result.status, result.status === 200 ? result.context : { status: result.error });
      })();
    } else {
      reply(404, { status: "not_found" });
    }
  });
}

/** Startup does not connect to PostgreSQL or apply migrations. */
export function createRuntime(config: RuntimeConfig, verifier: PrincipalVerifier = configuredVerifier(config.access)): { server: Server; close: () => Promise<void> } {
  const pool = new pg.Pool({
    connectionString: config.databaseUrl,
    max: 2,
    connectionTimeoutMillis: 1500,
    statement_timeout: 1500,
    query_timeout: 2000,
    idleTimeoutMillis: 10000,
  });
  pool.on("error", () => { /* A subsequent readiness check reports a generic failure. */ });
  const server = createProbeServer(async () => (await migrationStatus(pool)).current, {
    verifier, identities: new PostgresIdentityRepository(pool),
  });
  return {
    server,
    close: createClose(server, pool),
  };
}
