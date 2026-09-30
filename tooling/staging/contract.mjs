import assert from "node:assert/strict";
import { accessSync, constants, lstatSync, readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { readDatabaseUrl, validateStagingAccess } from "../../services/api/src/database-config.mjs";
import { revision } from "../runtime/verify.mjs";

export const manifestUrl = new URL("../../infra/staging/compose.yaml", import.meta.url);
export const cloudflaredImage = "cloudflare/cloudflared:2026.9.3@sha256:072c067d25ccbe61d46e18f0d0723255f2bb5304f7317caa95b27031520ff92c";
export const configKeys = ["DROWK_STAGING_SHA", "DROWK_STAGING_API_IMAGE", "DROWK_STAGING_WORKER_IMAGE",
  "DROWK_STAGING_ACCESS_ISSUER", "DROWK_STAGING_ACCESS_AUDIENCE", "DROWK_STAGING_DATABASE_URL_FILE", "DROWK_STAGING_TUNNEL_TOKEN_FILE"];

export function imageRef(value) {
  if (typeof value !== "string" || value.length > 512 || /\s/.test(value)
    || !/^[a-z0-9]+(?:[._-][a-z0-9]+)*(?::\d+)?(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)+(?::[A-Za-z0-9_][A-Za-z0-9_.-]{0,127})?@sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error("STAGING_IMMUTABLE_IMAGE_REQUIRED");
  }
  return value;
}

export function stagingConfig(input) {
  const env = Object.fromEntries(configKeys.map(key => [key, input[key]]));
  revision(env.DROWK_STAGING_SHA);
  imageRef(env.DROWK_STAGING_API_IMAGE);
  imageRef(env.DROWK_STAGING_WORKER_IMAGE);
  validateStagingAccess({ APP_ENV: "staging", AUTH_PROVIDER: "cloudflare-access",
    CLOUDFLARE_ACCESS_ISSUER: env.DROWK_STAGING_ACCESS_ISSUER, CLOUDFLARE_ACCESS_AUDIENCE: env.DROWK_STAGING_ACCESS_AUDIENCE });
  for (const key of ["DROWK_STAGING_DATABASE_URL_FILE", "DROWK_STAGING_TUNNEL_TOKEN_FILE"]) {
    if (typeof env[key] !== "string" || !isAbsolute(env[key]) || env[key] !== env[key].trim()
      || /[\r\n\0]/.test(env[key])) throw new Error("STAGING_SECRET_PATH_INVALID");
  }
  if (env.DROWK_STAGING_DATABASE_URL_FILE === env.DROWK_STAGING_TUNNEL_TOKEN_FILE) throw new Error("STAGING_SECRETS_MUST_BE_DISTINCT");
  return env;
}

/** Pure policy over lstat metadata; caller readability cannot establish container readability. */
export function posixSecretOwnership({ mode, uid }, expectedUid) {
  if (!Number.isInteger(mode) || !Number.isInteger(uid) || !Number.isInteger(expectedUid)
    || expectedUid < 0 || uid !== expectedUid || (mode & 0o170000) !== 0o100000
    || !(mode & 0o400) || (mode & 0o077)) throw new Error("STAGING_SECRET_FILE_INVALID");
  return "POSIX_PRIVATE";
}

export function secretFile(path, expectedUid, platform = process.platform) {
  try {
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink() || !info.size || info.size > 16384) throw new Error();
    const permissions = platform === "win32" ? "OWNER_ACL_REVIEW_REQUIRED" : posixSecretOwnership(info, expectedUid);
    accessSync(path, constants.R_OK);
    return permissions;
  } catch { throw new Error("STAGING_SECRET_FILE_INVALID"); }
}

export function checkSecretFiles(env) {
  const permissions = [secretFile(env.DROWK_STAGING_DATABASE_URL_FILE, 1000), secretFile(env.DROWK_STAGING_TUNNEL_TOKEN_FILE, 65532)];
  readDatabaseUrl({ APP_ENV: "staging", DATABASE_URL_FILE: env.DROWK_STAGING_DATABASE_URL_FILE });
  // The Tunnel credential is never read by repo tooling, only checked for presence/permissions.
  return permissions;
}

export function sourceManifest() { return JSON.parse(readFileSync(manifestUrl, "utf8")); }

/** JSON is a YAML subset: use the same source for offline policy and Docker rendering. */
export function resolvedManifest(input) {
  const env = stagingConfig(input);
  const encoded = JSON.stringify(sourceManifest());
  return JSON.parse(encoded.replace(/\$\{([A-Z_]+):\?[^}]+\}/g, (_match, key) => {
    if (!configKeys.includes(key) || !env[key]) throw new Error("STAGING_INPUT_REQUIRED");
    return JSON.stringify(env[key]).slice(1, -1);
  }));
}

function secretTargets(service) {
  return (service.secrets ?? []).map(item => {
    if (typeof item === "string") return item;
    const target = item.target ?? item.source;
    assert.ok(target === item.source || target === `/run/secrets/${item.source}`);
    return item.source;
  }).sort();
}

export function verifyManifest(manifest, input) {
  const env = stagingConfig(input);
  assert.deepEqual(Object.keys(manifest.services).sort(), ["api", "cloudflared", "migrate", "worker"]);
  for (const service of Object.values(manifest.services)) {
    assert.equal((service.ports ?? []).length, 0);
    assert.ok(!service.build && !service.privileged && !service.entrypoint && !service.env_file);
    assert.ok(!service.volumes && !service.devices && !service.external_links && !service.extra_hosts);
    assert.ok(!service.pid && !service.ipc && !service.cap_add);
    assert.ok(!service.network_mode || service.network_mode === "none");
    assert.equal(service.read_only, true);
    assert.deepEqual(service.cap_drop, ["ALL"]);
    assert.deepEqual(service.security_opt, ["no-new-privileges:true"]);
    assert.equal(service.stop_grace_period, "8s");
    imageRef(service.image);
  }
  const { api, worker, cloudflared, migrate } = manifest.services;
  assert.equal(api.image, env.DROWK_STAGING_API_IMAGE);
  assert.equal(migrate.image, api.image);
  assert.equal(worker.image, env.DROWK_STAGING_WORKER_IMAGE);
  assert.equal(cloudflared.image, cloudflaredImage);
  assert.equal(api.user, "1000:1000");
  assert.equal(worker.user, "1000:1000");
  assert.equal(migrate.user, "1000:1000");
  assert.equal(cloudflared.user, "65532:65532");
  assert.deepEqual(api.environment, { APP_ENV: "staging", HOST: "0.0.0.0", PORT: "8000", AUTH_PROVIDER: "cloudflare-access",
    CLOUDFLARE_ACCESS_ISSUER: env.DROWK_STAGING_ACCESS_ISSUER, CLOUDFLARE_ACCESS_AUDIENCE: env.DROWK_STAGING_ACCESS_AUDIENCE,
    DATABASE_URL_FILE: "/run/secrets/database_url" });
  assert.deepEqual(worker.environment, { APP_ENV: "staging" });
  assert.ok(!worker.secrets && !worker.networks && !worker.command);
  assert.equal(worker.network_mode, "none");
  assert.ok(!api.command && !api.depends_on && !api.profiles && !worker.profiles && !cloudflared.profiles);
  assert.deepEqual(migrate.environment, { APP_ENV: "staging", DATABASE_URL_FILE: "/run/secrets/database_url" });
  assert.deepEqual(secretTargets(api), ["database_url"]);
  assert.deepEqual(secretTargets(migrate), ["database_url"]);
  assert.deepEqual(secretTargets(cloudflared), ["cloudflare_tunnel_token"]);
  assert.deepEqual(cloudflared.command, ["tunnel", "--no-autoupdate", "run", "--token-file", "/run/secrets/cloudflare_tunnel_token"]);
  assert.ok(!cloudflared.environment);
  assert.equal(cloudflared.depends_on.api.condition, "service_healthy");
  assert.deepEqual(Object.keys(cloudflared.depends_on), ["api"]);
  assert.deepEqual(migrate.profiles, ["migration"]);
  assert.equal(migrate.restart, "no");
  assert.deepEqual(migrate.command, ["node", "dist/migrate.mjs", "apply"]);
  assert.ok(!migrate.depends_on);
  for (const service of [api, worker, cloudflared]) assert.equal(service.restart, "unless-stopped");
  assert.deepEqual(api.healthcheck, sourceManifest().services.api.healthcheck);
  for (const service of [api, cloudflared, migrate]) {
    assert.deepEqual(Array.isArray(service.networks) ? service.networks : Object.keys(service.networks), ["ingress"]);
  }
  assert.deepEqual(Object.keys(manifest.networks), ["ingress"]);
  assert.equal(manifest.networks.ingress.driver, "bridge");
  assert.ok(!manifest.networks.ingress.external && !manifest.networks.ingress.internal);
  assert.ok(!manifest.volumes);
  assert.deepEqual(Object.keys(manifest.secrets).sort(), ["cloudflare_tunnel_token", "database_url"]);
  for (const [name, path] of [["database_url", env.DROWK_STAGING_DATABASE_URL_FILE], ["cloudflare_tunnel_token", env.DROWK_STAGING_TUNNEL_TOKEN_FILE]]) {
    const item = manifest.secrets[name];
    assert.equal(item.file, path);
    assert.ok(Object.keys(item).every(key => ["name", "file"].includes(key)));
    if (item.name) assert.equal(item.name, `drowk-staging_${name}`);
  }
}

export function revisionEvidence(images, env) {
  for (const [service, key] of [["api", "DROWK_STAGING_API_IMAGE"], ["worker", "DROWK_STAGING_WORKER_IMAGE"]]) {
    const item = images[service];
    assert.ok(item.RepoDigests?.includes(imageRef(env[key]).replace(/:[^/:]+(?=@sha256:)/, "")));
    assert.equal(item.Config.Labels["org.opencontainers.image.revision"], revision(env.DROWK_STAGING_SHA));
    assert.equal(item.Config.User, "1000:1000");
  }
}
