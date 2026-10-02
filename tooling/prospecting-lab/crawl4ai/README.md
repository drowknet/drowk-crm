# Static Crawl4AI lab harness

STATIC HARNESS IMPLEMENTED / ONE OWNER-GATED Q2A EXECUTION OBSERVED / CANDIDATE LAB_BLOCKED /
NO CURRENT EXECUTION AUTHORITY.

The static harness itself does not execute or qualify Crawl4AI. Its tests use synthetic candidate
output doubles and do not prove Crawl4AI compatibility. Separately, Q2A recorded one valid isolated
owner-gated execution inside the frozen boundary; it exited 1 and normalized to `ERROR` with no
facts. Root cause remains unresolved. This historical observation does not authorize a rerun.

`lab.mjs` exports a pure `plan()` and exact-allowlist `validatePlan()`. There is no
execution CLI. The future owner-gated executor must validate the plan immediately
before execution, use argv without a shell, enforce its timeout and stdout byte limit,
discard stderr, and supply only an explicitly reviewed host plumbing environment.
Never inherit provider credentials. `--pull never` requires the already acquired image.
Only the fixture, schema and candidate entrypoint are bound read-only. No ports or
external fetch target are accepted. Writable scratch is bounded tmpfs.

`candidate.py` is the in-container entrypoint defined for Q2A, using raw HTML and deterministic
CSS extraction. Static tests do not execute it. The recorded Q2A run did not qualify successful
candidate behavior; it ended exit 1 and the internal cause is intentionally unknown because raw
stderr was discarded. Any future execution still requires a separate owner gate, platform/image
identity checks and the frozen boundary. The planner does not inspect Docker.

`normalizeResult()` accepts bounded candidate JSON plus exit status; failures clear
facts. Selected values must agree with the narrow repo-owned fixture grammar.
This oracle is not a general HTML parser. Fingerprints use SHA-256 over exact fixture
UTF-8 bytes and JSON of schema-ordered, NFC/whitespace-normalized selected facts.
No timestamps, environment, raw logs or persistence enter results.

Remove this directory and `tooling/harness/crawl4ai-lab.test.mjs` to remove the lab.
No application runtime, package manifest or database depends on it.

Static check: `node --test tooling/harness/crawl4ai-lab.test.mjs`.
