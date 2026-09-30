import { startWorker } from "./runtime.mjs";

try { startWorker(); }
catch { console.error("WORKER_CONFIGURATION_INVALID"); process.exitCode = 1; }
