import { createRuntime, readRuntimeConfig } from "./server.js";

try {
  const config = readRuntimeConfig(process.env);
  const runtime = createRuntime(config);
  runtime.server.on("error", () => {
    console.error("API_START_FAILED");
    process.exitCode = 1;
    void runtime.close();
  });
  runtime.server.listen(config.port, config.host, () => console.log("DROWK API listening"));
  const stop = () => { void runtime.close().catch(() => { process.exitCode = 1; }); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
} catch {
  console.error("API_CONFIGURATION_INVALID");
  process.exitCode = 1;
}
