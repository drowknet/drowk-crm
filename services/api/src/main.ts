import { createRuntime, readRuntimeConfig } from "./server.js";
import { installShutdown, readProcessConfig } from "./runtime.mjs";

try {
  // Validate the process boundary without changing the injectable library config contract.
  const resolved = readRuntimeConfig(process.env);
  const config = { ...resolved, ...readProcessConfig({ ...process.env,
    DATABASE_URL: resolved.databaseUrl, DATABASE_URL_FILE: undefined }) };
  const runtime = createRuntime(config);
  const stop = installShutdown(runtime.close, {
    exit: code => process.exit(code || Number(process.exitCode) || 0),
  });
  runtime.server.on("error", () => {
    console.error("API_START_FAILED");
    process.exitCode = 1;
    stop();
  });
  runtime.server.listen(config.port, config.host, () => console.log("DROWK API listening"));
} catch {
  console.error("API_CONFIGURATION_INVALID");
  process.exitCode = 1;
}
