import { randomUUID } from "node:crypto";
import pg from "pg";
import { PostgresCapabilityLabRepository } from "@drowk/db";
import type { IsoDateTime, TenantId } from "@drowk/contracts";
import { aisaRuntimeConfig } from "./business-listings.js";
import { runSelectedBusinessListingsOnce } from "./one-shot.js";

const args = process.argv.slice(2);
const mode = args[0];
const now = () => new Date().toISOString() as IsoDateTime;
const code = (value: string) => {
  process.stdout.write(`${JSON.stringify({ disposition: "BLOCKED", code: value })}\n`);
  process.exitCode = 1;
};
const tenant = process.env.DROWK_TENANT_ID;
const uuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

if (mode === "--dry-run" && args.length === 1) {
  const result = await runSelectedBusinessListingsOnce({
    mode: "DRY_RUN", tenantId: "00000000-0000-0000-0000-000000000000" as TenantId,
    config: { liveValidationEnabled: false, apiKey: null }, now,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} else if (!["--live", "--status", "--reconcile"].includes(mode ?? "")) {
  code("AISA_COMMAND_NOT_ALLOWED");
} else if (!tenant || !uuid.test(tenant) || !process.env.DATABASE_URL ||
    !process.env.APP_ENV?.trim()) {
  code("AISA_RUNTIME_CONFIG_REQUIRED");
} else if (mode === "--live" && args.length !== 1) {
  code("AISA_COMMAND_NOT_ALLOWED");
} else if (mode === "--live" && !aisaRuntimeConfig(process.env).liveValidationEnabled) {
  code("AISA_LIVE_DISABLED");
} else if (mode === "--live" && !aisaRuntimeConfig(process.env).apiKey) {
  code("AISA_KEY_REQUIRED");
} else {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL,
    max: 1, connectionTimeoutMillis: 5000 });
  const store = new PostgresCapabilityLabRepository(pool);
  try {
    if (mode === "--live") {
      const result = await runSelectedBusinessListingsOnce({
        mode: "LIVE", tenantId: tenant as TenantId,
        config: aisaRuntimeConfig(process.env), store, now,
      });
      process.stdout.write(`${JSON.stringify(result)}\n`);
      process.exitCode = result.exitCode;
    } else if (mode === "--status" && args.length === 2 && uuid.test(args[1]!)) {
      const status = await store.getLiveDispatchStatus(tenant as TenantId, args[1]!);
      if (!status) code("AISA_RESEARCH_NOT_FOUND");
      else {
        process.stdout.write(`${JSON.stringify(status)}\n`);
        process.exitCode = status.disposition === "UNKNOWN" ||
          status.disposition === "UNCLAIMED" ? 1 : 0;
      }
    } else if (mode === "--reconcile" && args.length === 5 &&
        uuid.test(args[1]!) && uuid.test(args[2]!)) {
      const status = await store.reconcileUnknownLiveDispatch(tenant as TenantId, args[1]!, {
        id: randomUUID(), actorRef: args[2]!, evidenceDigest: args[3]!,
        outcome: args[4] as "UNKNOWN_AFTER_REVIEW" | "CONFIRMED_NO_DISPATCH",
        reviewedAt: now(),
      });
      process.stdout.write(`${JSON.stringify(status)}\n`);
      process.exitCode = status.reconciliationOutcome === "UNKNOWN_AFTER_REVIEW" ? 1 : 0;
    } else code("AISA_COMMAND_NOT_ALLOWED");
  } catch {
    // Never print transport errors, DB URLs, request headers or credential material.
    code("AISA_COMMAND_FAILED");
  } finally { await pool.end(); }
}
