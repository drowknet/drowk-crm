# Engineering Harness

Executable EF-01A gates. Run from the repository root using
`npx --yes pnpm@10.17.1 <command>`; no global pnpm installation is required.
Install dependencies with `npx --yes pnpm@10.17.1 install --frozen-lockfile`.
Canonical CI uses Node 22 (22.13+ for ESLint); local Node 24 also works.

## Commands

| Command | Behavior |
| --- | --- |
| `harness:preflight` | Physical repository/Git root, canonical origin, package identity, branch/HEAD (including CI detached HEAD), pnpm version, lockfile format, forbidden tracked secret files. |
| `harness:fast` | Preflight + current-tree/history secrets + public-OSS privacy scan + internal-doc link scan + harness tests + lint + typecheck. |
| `harness:full` | Fast + complete ordinary tests. |
| `harness:ci` | Non-interactive full gate, additionally requires Node 22; used by GitHub verify. |
| `harness:integration` | Explicit guarded disposable PostgreSQL sensors described below. |
| `harness:test` | Synthetic detection/redaction/history, harness-boundary and static-analysis sensors. |
| `secrets:scan` | Tree + history; `secrets:tree` and `secrets:history` select one. |
| `lint` | Root ESLint correctness rules for TS/JS; warnings fail; no auto-fix or inline suppression. |
| `verify` | Lint + typecheck + tests. Harness adds preflight/secret gates. |

Preflight verifies lockfile presence/format; frozen install enforces dependency
consistency without repairing the lockfile. Modes invoke leaf scripts, never
`verify` or another mode: no recursive script graph.

Lint excludes only package-generated dist directories and node_modules. Its explicit
correctness baseline catches unsafe control flow, invalid assignments, duplicate
branches, malformed regexes, precision loss, debugger/eval and related defects
independently of typecheck, without requiring a product/style migration.

The lint command runs ESLint through its API with fix disabled and fails on every
unreviewed error or warning. lint-exceptions.json records 11 existing findings:
intentional control-character rejection, ignored Server returns in callback-based
Promise test wrappers, and one concurrent-migration finally rethrow. The last can
mask an earlier assertion; EF-01A preserves that existing sensor behavior. Every
exception requires an exact file, rule, line, column, whole-file SHA-256 (normalized
line endings), and justification. Any content change invalidates the exception;
no file-wide or rule-wide disable is used. Synthetic tests prove that changed
content, different paths/locations and warnings cannot use these exceptions.

## Public OSS privacy sensor\n\nOrdinary harness modes also scan tracked text for repository-specific private account identifiers, tenant domains/local paths, tenant-source IDs, tenant names and tenant-specific reusable reason codes that should not remain in the public OSS tree. Findings report detector, path and line metadata only. The sensor is intentionally narrower than arbitrary privacy classification and complements manual review.\n\n## Documentation link sensor\n\nOrdinary harness modes verify repository-relative Markdown links against the tracked checkout. External URLs and in-page anchors are ignored; missing local targets and links escaping the repository fail closed with path/target metadata.\n\n## Secret sensors

Tree scanning reads Git-tracked working files, including staged additions. Stage
new files before scanning. Missing/unreadable files fail closed; symlinks are not
followed. No environment file or secret store is loaded. Forbidden tracked classes
include non-example dotenv files, key containers, credential JSON and secret
folders. The example dotenv file is still content-scanned.

Content detectors cover private-key headers, GitHub/provider tokens, AWS keys and
JWTs. Tree scanning additionally checks conservative literal assignments to secret,
key, token and password variables; empty/example values and expressions pass.
These heuristics cannot prove absence of arbitrary encoded secrets.

History scanning requires non-shallow Git and checks unique blob/path versions in
every commit reachable from local refs and HEAD, including removed files. Only
high-confidence content detectors apply to history. Symlink blob content is read
without following links; historical gitlinks fail closed because their objects
are outside this repository scan. Remote refs not fetched and
unreachable/pruned objects cannot be scanned. CI fetches full history explicitly.

Output contains detector ID, path, line and optional commit metadata only, never
source lines or matched values. Findings and scan failures exit nonzero. Existing
synthetic exceptions require exact path + detector + literal and written
justification in secrets.mjs; no broad path/regex suppression exists. Test token
candidates are assembled at runtime.

On a probable real finding: stop and report metadata only. No credential rotation
or history rewrite is authorized without another owner gate.

## Disposable PostgreSQL integration

Before any integration subprocess, require all of:

- `DROWK_TEST_DISPOSABLE=1`;
- `APP_ENV=test`;
- `DROWK_TEST_DATABASE_URL` targets PostgreSQL on loopback (localhost, 127.0.0.1,
  ::1), with a database ending in _test or _ci and no URL query/fragment.

These guards express explicit permission to run destructive test sensors against
an already prepared disposable boundary; a database name alone is not proof of
that boundary. No database service/container is provisioned. The existing test
role permissions and psql on PATH are required. If unavailable locally, defer to
GitHub postgres-foundation, never staging or production.

The integration mode preserves all prior foundation commands, in order:

1. Build repositories.
2. Migration plan.
3. Migration apply.
4. Migration status.
5. Tenant-isolation SQL with ON_ERROR_STOP=1.
6. Complete DB migration/persistence tests, including fake-transport audit sensors.
7. Gmail observation persistence test (no live Gmail).
8. Complete API tests including readiness.

Child processes use an allowlisted OS/package-manager environment. Ordinary modes
omit DB/provider credentials and disable the live AIsa switch; integration passes
only the guarded disposable DB settings. Node injection options and inherited
provider/outbound configuration are excluded. No mode invokes a live provider CLI,
Gmail sync or outbound action.

Steps fail immediately on nonzero exit. Child output is captured rather than
relayed because DB diagnostics could contain connection material. Only the
metadata-only secret scanner output is relayed. Step labels expose no environment
values; this intentionally limits verbose integration diagnostics.

CI Action pins are immutable with release comments; checkout has
persist-credentials: false and fetch-depth: 0; permissions remain contents: read.
Passing the harness does not authorize merge, deployment or live calls.
