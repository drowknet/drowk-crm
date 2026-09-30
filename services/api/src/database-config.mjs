import { readFileSync, statSync } from "node:fs";
import { isAbsolute } from "node:path";

/** Errors carry fixed categories only, never URL contents or filesystem paths. */
export function readDatabaseUrl(env, read = readFileSync) {
  const direct = env.DATABASE_URL !== undefined;
  const file = env.DATABASE_URL_FILE !== undefined;
  if (direct === file) throw new Error("DATABASE_CONFIG_EXCLUSIVE");
  let value = env.DATABASE_URL;
  if (file) {
    try {
      const path = env.DATABASE_URL_FILE;
      if (typeof path !== "string" || !isAbsolute(path)) throw new Error();
      const info = statSync(path);
      if (!info.isFile() || info.size > 16384) throw new Error();
      value = read(path, "utf8").replace(/\r?\n$/, "");
    } catch { throw new Error("DATABASE_FILE_INVALID"); }
  }
  if (typeof value !== "string" || !value || value.length > 16384 || /\s/.test(value)
    || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) {
    throw new Error("DATABASE_URL_INVALID");
  }
  if (env.APP_ENV === "staging") {
    if (env.NODE_TLS_REJECT_UNAUTHORIZED !== undefined && env.NODE_TLS_REJECT_UNAUTHORIZED !== "1") {
      throw new Error("STAGING_DATABASE_TLS_REQUIRED");
    }
    validateStagingDatabaseUrl(value);
  }
  return value;
}

export function validateStagingDatabaseUrl(value) {
  try {
    const url = new URL(value);
    // Only one explicit TLS option: no duplicate modes or parser-specific overrides.
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname
      || /[%/\\]/.test(url.hostname) || url.hostname.toLowerCase().split(".")[0].endsWith("-pooler")
      || !/^\/[^/]+$/.test(url.pathname) || /[\s/]/.test(decodeURIComponent(url.pathname.slice(1)))
      || url.hash || /\s/.test(value) || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
      || url.searchParams.size !== 1 || !["require", "verify-full"].includes(url.searchParams.get("sslmode"))) throw new Error();
  } catch { throw new Error("STAGING_DATABASE_TLS_REQUIRED"); }
}

export function validateStagingAccess(env) {
  if (env.APP_ENV !== "staging") return;
  try {
    const issuer = new URL(env.CLOUDFLARE_ACCESS_ISSUER);
    if (env.AUTH_PROVIDER !== "cloudflare-access" || issuer.protocol !== "https:"
      || issuer.origin !== env.CLOUDFLARE_ACCESS_ISSUER || issuer.username || issuer.password
      || typeof env.CLOUDFLARE_ACCESS_AUDIENCE !== "string" || !env.CLOUDFLARE_ACCESS_AUDIENCE
      || [...env.CLOUDFLARE_ACCESS_AUDIENCE].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
      || /\s/.test(env.CLOUDFLARE_ACCESS_AUDIENCE)) throw new Error();
  } catch { throw new Error("STAGING_ACCESS_REQUIRED"); }
}
