import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { rollbackPlan, killPlan } from "./plans.mjs";

export function main(args) {
  if (args.length === 1 && args[0] === "kill-plan") return killPlan();
  if (args.length === 2 && args[0] === "rollback-plan") return rollbackPlan(JSON.parse(readFileSync(args[1], "utf8")));
  throw new Error("STAGING_PLAN_USAGE");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(main(process.argv.slice(2)), null, 2)); }
  catch { console.error("STAGING_PLAN_INVALID"); process.exitCode = 1; }
}
