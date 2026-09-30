import { isIP } from "node:net";

export function readProcessConfig(env) {
  if (!["development", "test", "staging", "production"].includes(env.APP_ENV)) throw new Error("APP_ENV_INVALID");
  let url;
  try { url = new URL(env.DATABASE_URL); } catch { throw new Error("DATABASE_URL_INVALID"); }
  if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.pathname.length < 2) {
    throw new Error("DATABASE_URL_INVALID");
  }
  const host = env.HOST ?? "127.0.0.1";
  if (!isIP(host)) throw new Error("HOST_INVALID");
  const port = env.PORT ?? "8000";
  if (typeof port !== "string" || port !== port.trim() || !/^\d+$/.test(port)
    || Number(port) < 1 || Number(port) > 65535) throw new Error("PORT_INVALID");
  return { databaseUrl: env.DATABASE_URL, environment: env.APP_ENV, host, port: Number(port) };
}

/** One close operation; always attempt pool shutdown, including listener errors. */
export function createClose(server, pool) {
  let closing;
  return () => closing ??= (async () => {
    try {
      if (server.listening) await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    } finally { await pool.end(); }
  })();
}

/** A referenced deadline also bounds stuck HTTP requests and pool clients. */
export function installShutdown(close, { target = process, timeoutMs = 5000,
  exit = code => process.exit(code), log = marker => console.log(marker) } = {}) {
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => { log("API_SHUTDOWN_TIMEOUT"); exit(1); }, timeoutMs);
    void Promise.resolve().then(close).then(() => {
      clearTimeout(deadline);
      log("API_STOPPED");
      exit(0);
    }, () => {
      clearTimeout(deadline);
      log("API_SHUTDOWN_FAILED");
      exit(1);
    });
  };
  target.on("SIGTERM", stop);
  target.on("SIGINT", stop);
  return stop;
}
