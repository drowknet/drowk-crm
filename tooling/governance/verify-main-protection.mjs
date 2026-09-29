import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const policy = JSON.parse(readFileSync(new URL("main-protection-policy.json", import.meta.url), "utf8"));
const repositoryFields = ["allow_update_branch", "delete_branch_on_merge", "allow_auto_merge",
  "allow_merge_commit", "allow_squash_merge", "allow_rebase_merge"];
const protectionFlags = ["enforce_admins", "required_conversation_resolution", "allow_force_pushes",
  "allow_deletions", "block_creations", "required_linear_history", "lock_branch", "allow_fork_syncing"];
const reviewFlags = ["dismiss_stale_reviews", "require_code_owner_reviews", "require_last_push_approval"];
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);

/** Returns only locally defined field names/codes, never remote values or keys. */
export function compareState(repository, branch, protection) {
  const issues = [];
  const issue = (field, code = "MISMATCH") => issues.push({ field, code });
  const scalar = (container, key, expected, field) => {
    if (!object(container) || !own(container, key) || typeof container[key] !== typeof expected ||
        (typeof expected === "number" && !Number.isInteger(container[key]))) issue(field, "MALFORMED");
    else if (container[key] !== expected) issue(field);
  };
  if (!object(repository)) issue("repository", "MALFORMED");
  else {
    scalar(repository, "full_name", policy.repository, "repository.full_name");
    for (const key of repositoryFields) scalar(repository, key, policy.repository_settings[key], `repository.${key}`);
  }
  if (!object(branch)) issue("branch", "MALFORMED");
  else {
    scalar(branch, "name", policy.branch, "branch.name");
    scalar(branch, "protected", policy.protected, "branch.protected");
  }
  if (!object(protection)) { issue("protection", "MALFORMED"); return issues; }
  for (const key of protectionFlags) scalar(protection[key], "enabled", policy[key], `protection.${key}`);

  const checks = protection.required_status_checks;
  if (checks === null) issue("protection.required_status_checks");
  else if (!object(checks)) issue("protection.required_status_checks", "MALFORMED");
  else {
    scalar(checks, "strict", policy.required_status_checks.strict, "protection.required_status_checks.strict");
    const validChecks = Array.isArray(checks.checks) && checks.checks.every(c => object(c) &&
      typeof c.context === "string" && Number.isInteger(c.app_id));
    if (!validChecks) issue("protection.required_status_checks.checks", "MALFORMED");
    else {
      const expected = policy.required_status_checks.checks;
      if (checks.checks.length !== expected.length || new Set(checks.checks.map(c => c.context)).size !== expected.length ||
          !expected.every(e => checks.checks.some(c => c.context === e.context && c.app_id === e.app_id))) {
        issue("protection.required_status_checks.checks");
      }
    }
    // GitHub's legacy contexts projection may be empty or mirror the app-bound checks.
    if (!Array.isArray(checks.contexts) || !checks.contexts.every(c => typeof c === "string")) {
      issue("protection.required_status_checks.contexts", "MALFORMED");
    } else if (checks.contexts.length && (!validChecks || checks.contexts.length !== checks.checks.length ||
        new Set(checks.contexts).size !== checks.contexts.length ||
        !checks.checks.every(c => checks.contexts.includes(c.context)))) issue("protection.required_status_checks.contexts");
  }

  const reviews = protection.required_pull_request_reviews;
  if (reviews === null) issue("protection.required_pull_request_reviews.enabled");
  else if (!object(reviews)) issue("protection.required_pull_request_reviews", "MALFORMED");
  else {
    scalar(reviews, "required_approving_review_count", policy.required_pull_request_reviews.required_approving_review_count,
      "protection.required_pull_request_reviews.required_approving_review_count");
    for (const key of reviewFlags) scalar(reviews, key, policy.required_pull_request_reviews[key], `protection.required_pull_request_reviews.${key}`);
    const bypass = reviews.bypass_pull_request_allowances;
    // GitHub omits disabled optional allowance blocks. Present blocks must be complete and empty.
    if (own(reviews, "bypass_pull_request_allowances")) {
      if (!object(bypass) || !["users", "teams", "apps"].every(key => Array.isArray(bypass[key]))) {
        issue("protection.required_pull_request_reviews.bypass_pull_request_allowances", "MALFORMED");
      } else if (["users", "teams", "apps"].some(key => bypass[key].length) ||
          Object.keys(bypass).some(key => !["users", "teams", "apps"].includes(key))) {
        issue("protection.required_pull_request_reviews.bypass_pull_request_allowances");
      }
    }
    if (own(reviews, "dismissal_restrictions") && reviews.dismissal_restrictions !== null) {
      issue("protection.required_pull_request_reviews.dismissal_restrictions");
    }
  }
  // Omitted/null restrictions both mean no push restriction; even an empty object enables a restriction.
  if (own(protection, "restrictions") && protection.restrictions !== null) issue("protection.restrictions");
  return issues;
}

const endpoints = [
  ["repository", "repos/drowknet/drowk-crm"],
  ["branch", "repos/drowknet/drowk-crm/branches/main"],
  ["protection", "repos/drowknet/drowk-crm/branches/main/protection"],
];

function command(execute, binary, args) {
  try {
    return execute(binary, args, { cwd: root, shell: false, encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"], timeout: 30000, maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_DEBUG: "", GH_PAGER: "cat" } });
  } catch { return { status: null }; }
}

function canonicalRoot(execute, cwd) {
  try {
    if (realpathSync(cwd) !== realpathSync(root)) return false;
    const top = command(execute, "git", ["rev-parse", "--show-toplevel"]);
    if (top.error || top.status !== 0 || realpathSync(top.stdout.trim()) !== realpathSync(root)) return false;
    const remote = command(execute, "git", ["remote", "get-url", "origin"]);
    return !remote.error && remote.status === 0 &&
      /^(?:https:\/\/github\.com\/|git@(?:github\.com|github-drowk-crm):)drowknet\/drowk-crm(?:\.git)?$/.test(remote.stdout.trim()) &&
      JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).name === "@drowk/crm";
  } catch { return false; }
}

/** Injectable process boundary for offline tests. Only fixed GET requests are possible. */
export function verify({ execute = spawnSync, cwd = process.cwd() } = {}) {
  if (!canonicalRoot(execute, cwd)) return { status: "FAIL", issues: [{ field: "repository.root", code: "INVALID_ROOT" }] };
  const values = [], issues = [];
  for (const [field, endpoint] of endpoints) {
    const result = command(execute, "gh", ["api", "--hostname", "github.com", "--method", "GET",
      "-H", "Accept: application/vnd.github+json", "-H", "X-GitHub-Api-Version: 2026-03-10", endpoint]);
    if (!result || result.error || result.status !== 0) {
      issues.push({ field, code: "API_READ_FAILED" }); values.push(undefined); continue;
    }
    try { values.push(JSON.parse(result.stdout)); }
    catch { issues.push({ field, code: "MALFORMED_JSON" }); values.push(undefined); }
  }
  // An API failure never becomes an inferred absence or a successful policy check.
  const compared = compareState(...values);
  issues.push(...compared.filter(i => !issues.some(failure => i.field === failure.field || i.field.startsWith(`${failure.field}.`))));
  return { status: issues.length ? "FAIL" : "PASS", issues };
}

export function run({ execute = spawnSync, cwd = process.cwd(), emit = text => console.log(text) } = {}) {
  let result;
  try { result = verify({ execute, cwd }); }
  catch { result = { status: "FAIL", issues: [{ field: "verification", code: "FAILED_CLOSED" }] }; }
  emit(JSON.stringify(result));
  return result.status === "PASS" ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) {
    console.log(JSON.stringify({ status: "FAIL", issues: [{ field: "command", code: "NO_ARGUMENTS_ALLOWED" }] }));
    process.exitCode = 1;
  } else process.exitCode = run();
}
