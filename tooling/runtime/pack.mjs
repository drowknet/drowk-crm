import { cpSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Copy the installed production graph, resolving pnpm links, never the pnpm store.
// Each dependency resolves from its own original package, preserving versions.
export function pack(source, destination, ancestors = []) {
  source = realpathSync(source);
  if (ancestors.includes(source)) throw new Error("RUNTIME_DEPENDENCY_CYCLE");
  const manifest = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
  mkdirSync(destination, { recursive: true });
  const workspace = manifest.name.startsWith("@drowk/");
  for (const entry of readdirSync(source)) {
    if (entry === "node_modules" || /^(?:tests?|docs?|fixtures?|\.git|\.env.*)$/i.test(entry)) continue;
    if (workspace && !["package.json", "dist", "migrations"].includes(entry)) continue;
    cpSync(join(source, entry), join(destination, entry), { recursive: true,
      filter: path => !/(?:^|[/\\])(?:tests?|fixtures?|docs?|\.git|\.env[^/\\]*)(?:[/\\]|$)/i.test(path) });
  }
  if (workspace) {
    delete manifest.devDependencies;
    delete manifest.scripts;
    writeFileSync(join(destination, "package.json"), JSON.stringify(manifest, null, 2) + "\n");
  }
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.optionalDependencies }).sort()) {
    let cursor = source;
    let dependency;
    for (;;) {
      const candidate = join(cursor, "node_modules", name);
      try { if (statSync(join(candidate, "package.json")).isFile()) { dependency = candidate; break; } } catch { /* Walk Node's lookup paths. */ }
      const parent = dirname(cursor);
      if (parent === cursor) {
        if (Object.hasOwn(manifest.optionalDependencies ?? {}, name)) break;
        throw new Error("RUNTIME_DEPENDENCY_MISSING");
      }
      cursor = parent;
    }
    if (dependency) pack(dependency, join(destination, "node_modules", name), [...ancestors, source]);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) throw new Error("PACK_USAGE");
  pack(resolve(process.argv[2]), resolve(process.argv[3]));
}
