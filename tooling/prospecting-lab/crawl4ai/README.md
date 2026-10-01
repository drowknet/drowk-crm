# Static Crawl4AI lab harness

STATIC HARNESS IMPLEMENTED / ACTUAL LAB EXECUTION PENDING.

No candidate execution or lab qualification is claimed. Tests use synthetic candidate
output doubles; they do not prove Crawl4AI behavior or compatibility.

`lab.mjs` exports a pure `plan()` and exact-allowlist `validatePlan()`. There is no
execution CLI. The future owner-gated executor must validate the plan immediately
before execution, use argv without a shell, enforce its timeout and stdout byte limit,
discard stderr, and supply only an explicitly reviewed host plumbing environment.
Never inherit provider credentials. `--pull never` requires the already acquired image.
Only the fixture, schema and candidate entrypoint are bound read-only. No ports or
external fetch target are accepted. Writable scratch is bounded tmpfs.

`candidate.py` is a future in-container entrypoint using raw HTML and deterministic
CSS extraction. Browser startup under these restrictions remains unverified; stop
for review if it fails rather than weakening the boundary. The later gate must
inspect platform/image identity before execution. The planner does not inspect Docker.

`normalizeResult()` accepts bounded candidate JSON plus exit status; failures clear
facts. Selected values must agree with the narrow repo-owned fixture grammar.
This oracle is not a general HTML parser. Fingerprints use SHA-256 over exact fixture
UTF-8 bytes and JSON of schema-ordered, NFC/whitespace-normalized selected facts.
No timestamps, environment, raw logs or persistence enter results.

Remove this directory and `tooling/harness/crawl4ai-lab.test.mjs` to remove the lab.
No application runtime, package manifest or database depends on it.

Static check: `node --test tooling/harness/crawl4ai-lab.test.mjs`.
