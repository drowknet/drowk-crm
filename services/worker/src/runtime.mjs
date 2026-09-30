export function readWorkerConfig(env) {
  if (typeof env.APP_ENV !== "string" || env.APP_ENV !== env.APP_ENV.trim()
    || !/^[a-z][a-z0-9_-]{0,31}$/.test(env.APP_ENV)) throw new Error("APP_ENV_INVALID");
  return { environment: env.APP_ENV };
}

/** Inert process boundary only. No work scheduling or external effects. */
export function startWorker(env = process.env, target = process, log = marker => console.log(marker)) {
  readWorkerConfig(env);
  const keepAlive = setInterval(() => {}, 60_000);
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(keepAlive);
    target.removeListener("SIGTERM", stop);
    target.removeListener("SIGINT", stop);
    log("WORKER_INERT_STOPPED");
  };
  target.on("SIGTERM", stop);
  target.on("SIGINT", stop);
  log("WORKER_INERT_STARTED");
  return stop;
}
