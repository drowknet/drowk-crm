import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { createAccessVerifier } from "../dist/cloudflare-access.js";

export const access = { issuer: "https://synthetic.cloudflareaccess.com", audience: "synthetic-application" };
export async function accessFixture() {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const keys = createLocalJWKSet({ keys: [{ ...await exportJWK(publicKey), kid: "synthetic", alg: "RS256" }] });
  const verifier = createAccessVerifier(access, keys);
  const sign = async (overrides = {}, key = privateKey, algorithm = "RS256") => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { iss: access.issuer, aud: [access.audience], sub: "operator", exp: now + 3600, nbf: now - 60, type: "app", ...overrides };
    for (const name of Object.keys(payload)) if (payload[name] === undefined) delete payload[name];
    return new SignJWT(payload).setProtectedHeader({ alg: algorithm, kid: "synthetic" }).sign(key);
  };
  const request = token => ({ headers: { "cf-access-jwt-assertion": token }, rawHeaders: ["Cf-Access-Jwt-Assertion", token] });
  return { verifier, sign, request };
}
