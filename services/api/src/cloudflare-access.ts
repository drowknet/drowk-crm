import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import type { ExternalPrincipal } from "@drowk/contracts";
import { denyAllVerifier, type PrincipalVerifier } from "./authorization.js";

export interface AccessConfig { issuer: string; audience: string }

function validateConfig(config: AccessConfig): URL {
  const issuer = new URL(config.issuer);
  if (issuer.protocol !== "https:" || issuer.origin !== config.issuer || issuer.username || issuer.password
    || !config.audience?.trim() || config.audience !== config.audience.trim()) {
    throw new Error("Invalid Access configuration");
  }
  return new URL("/cdn-cgi/access/certs", issuer);
}

/** Keys come only from operator configuration, never token-supplied URLs or keys. */
export function createAccessVerifier(config: AccessConfig, keySource?: JWTVerifyGetKey): PrincipalVerifier {
  const url = validateConfig(config);
  const keys = keySource ?? createRemoteJWKSet(url, { timeoutDuration: 3000 });
  return { verify: async request => {
    const token = request.headers["cf-access-jwt-assertion"];
    const count = request.rawHeaders.filter((value, index) => index % 2 === 0
      && value.toLowerCase() === "cf-access-jwt-assertion").length;
    if (count !== 1 || typeof token !== "string" || !token.trim()) return null;
    try {
      const { payload } = await jwtVerify(token, keys, {
        algorithms: ["RS256"], issuer: config.issuer, audience: config.audience,
        requiredClaims: ["exp", "sub"],
      });
      if (typeof payload.sub !== "string" || !payload.sub.trim()
        || (payload.type !== undefined && payload.type !== "app")) return null;
      const principal: ExternalPrincipal = { issuer: payload.iss!, subject: payload.sub };
      if (typeof payload.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) principal.email = payload.email;
      if (typeof payload.name === "string" && payload.name.trim() && !/[\x00-\x1f\x7f]/.test(payload.name)) principal.displayName = payload.name;
      return principal;
    } catch { return null; }
  } };
}

export function readAccessConfig(env: NodeJS.ProcessEnv): AccessConfig | undefined {
  const mode = env.AUTH_PROVIDER ?? "none";
  if (mode === "none") {
    if (env.CLOUDFLARE_ACCESS_ISSUER !== undefined || env.CLOUDFLARE_ACCESS_AUDIENCE !== undefined) {
      throw new Error("Access configuration requires explicit provider selection");
    }
    return undefined;
  }
  if (mode !== "cloudflare-access") throw new Error("Invalid AUTH_PROVIDER");
  const config = { issuer: env.CLOUDFLARE_ACCESS_ISSUER ?? "", audience: env.CLOUDFLARE_ACCESS_AUDIENCE ?? "" };
  validateConfig(config);
  return config;
}

export function configuredVerifier(config?: AccessConfig): PrincipalVerifier {
  return config ? createAccessVerifier(config) : denyAllVerifier;
}
