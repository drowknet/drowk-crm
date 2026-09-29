import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { compareState, policy, run } from "./verify-main-protection.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
function exactState() {
  return [
    { full_name: "drowknet/drowk-crm", allow_update_branch: true, delete_branch_on_merge: true,
      allow_auto_merge: false, allow_merge_commit: true, allow_squash_merge: true, allow_rebase_merge: true },
    { name: "main", protected: true },
    {
      required_status_checks: { strict: true, contexts: ["verify", "postgres-foundation"],
        checks: [{ context: "verify", app_id: 15368 }, { context: "postgres-foundation", app_id: 15368 }] },
      required_pull_request_reviews: { required_approving_review_count: 0, dismiss_stale_reviews: true,
        require_code_owner_reviews: false, require_last_push_approval: false,
        bypass_pull_request_allowances: { users: [], teams: [], apps: [] } },
      enforce_admins: { enabled: true }, required_conversation_resolution: { enabled: true },
      allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false },
      block_creations: { enabled: false }, required_linear_history: { enabled: false },
      lock_branch: { enabled: false }, allow_fork_syncing: { enabled: false }, restrictions: null,
    },
  ];
}

test("exact independently specified state and order-normalized checks pass", () => {
  assert.deepEqual(compareState(...exactState()), []);
  const state = exactState();
  state[2].required_status_checks.checks.reverse();
  state[2].required_status_checks.contexts.reverse();
  assert.deepEqual(compareState(...state), []);
  state[2].required_status_checks.contexts = [];
  delete state[2].required_pull_request_reviews.bypass_pull_request_allowances;
  delete state[2].restrictions;
  assert.deepEqual(compareState(...state), []);
  assert.equal(policy.branch, "main");
  assert.equal(policy.required_pull_request_reviews.enabled, true);
  assert.deepEqual(policy.required_pull_request_reviews.bypass_pull_request_allowances, { users: [], teams: [], apps: [] });
  assert.equal(policy.restrictions, null);
  assert.equal(policy.required_pull_request_reviews.dismissal_restrictions, null);
});

const drifts = [
  ["unprotected main", s => { s[1].protected = false; }],
  ["wrong branch", s => { s[1].name = "other"; }],
  ["wrong repository", s => { s[0].full_name = "other/repository"; }],
  ["strict false", s => { s[2].required_status_checks.strict = false; }],
  ["missing check", s => { s[2].required_status_checks.checks.pop(); }],
  ["extra check", s => { s[2].required_status_checks.checks.push({ context: "extra", app_id: 15368 }); }],
  ["duplicate check", s => { s[2].required_status_checks.checks[1] = s[2].required_status_checks.checks[0]; }],
  ["wrong app", s => { s[2].required_status_checks.checks[0].app_id = 1; }],
  ["any app", s => { s[2].required_status_checks.checks[0].app_id = -1; }],
  ["extra legacy context", s => { s[2].required_status_checks.contexts.push("extra"); }],
  ["PR disabled", s => { s[2].required_pull_request_reviews = null; }],
  ["checks disabled", s => { s[2].required_status_checks = null; }],
  ["approvals", s => { s[2].required_pull_request_reviews.required_approving_review_count = 1; }],
  ...["dismiss_stale_reviews", "require_code_owner_reviews", "require_last_push_approval"].map(key =>
    [key, s => { s[2].required_pull_request_reviews[key] = !s[2].required_pull_request_reviews[key]; }]),
  ...["enforce_admins", "required_conversation_resolution", "allow_force_pushes", "allow_deletions",
    "block_creations", "required_linear_history", "lock_branch", "allow_fork_syncing"].map(key =>
    [key, s => { s[2][key].enabled = !s[2][key].enabled; }]),
  ...["users", "teams", "apps"].map(key => ["bypass " + key, s => {
    s[2].required_pull_request_reviews.bypass_pull_request_allowances[key].push({ id: 1 });
  }]),
  ["unknown bypass allowance", s => { s[2].required_pull_request_reviews.bypass_pull_request_allowances.other = []; }],
  ["push restriction", s => { s[2].restrictions = { users: [], teams: [], apps: [] }; }],
  ["dismissal restriction", s => { s[2].required_pull_request_reviews.dismissal_restrictions = { users: [{ id: 1 }] }; }],
  ...["allow_update_branch", "delete_branch_on_merge", "allow_auto_merge", "allow_merge_commit",
    "allow_squash_merge", "allow_rebase_merge"].map(key => [key, s => { s[0][key] = !s[0][key]; }]),
];
for (const [name, change] of drifts) test(`policy drift fails: ${name}`, () => {
  const state = exactState(); change(state);
  assert.ok(compareState(...state).some(i => i.code === "MISMATCH"));
});

test("missing required fields and malformed/partial response shapes fail closed", () => {
  for (const index of [0, 1, 2]) {
    for (const value of [undefined, null, [], true, "untrusted", {}]) {
      const state = exactState(); state[index] = value;
      assert.ok(compareState(...state).length > 0);
    }
  }
  for (const [index, keys] of [[0, Object.keys(exactState()[0])], [1, ["name", "protected"]],
    [2, Object.keys(exactState()[2]).filter(key => key !== "restrictions")]]) {
    for (const key of keys) {
      const state = exactState(); delete state[index][key];
      assert.ok(compareState(...state).some(i => i.code === "MALFORMED"));
    }
  }
  for (const change of [
    s => { s[1].protected = "true"; },
    s => { s[2].enforce_admins = true; },
    s => { s[2].required_status_checks.checks[0].app_id = "15368"; },
    s => { delete s[2].required_status_checks.checks; },
    s => { delete s[2].required_status_checks.contexts; },
    s => { delete s[2].required_status_checks.strict; },
    s => { s[2].required_pull_request_reviews.required_approving_review_count = 0.5; },
    s => { s[2].required_pull_request_reviews.bypass_pull_request_allowances = { users: [] }; },
    s => { s[2].required_pull_request_reviews.bypass_pull_request_allowances = null; },
  ]) {
    const state = exactState(); change(state);
    assert.ok(compareState(...state).some(i => i.code === "MALFORMED"));
  }
});

function fakeCommand(states, ghResult) {
  const calls = [];
  const execute = (binary, args, options) => {
    calls.push({ binary, args, options });
    if (binary === "git") return { status: 0, stdout: args[0] === "rev-parse" ? root : "https://github.com/drowknet/drowk-crm.git" };
    const index = args.at(-1).endsWith("/protection") ? 2 : args.at(-1).endsWith("/main") ? 1 : 0;
    return ghResult ? ghResult(index) : { status: 0, stdout: JSON.stringify(states[index]) };
  };
  return { execute, calls };
}

test("live boundary issues exactly three fixed GETs and no auth/admin mutation commands", () => {
  const { execute, calls } = fakeCommand(exactState()), output = [];
  assert.equal(run({ execute, cwd: root, emit: line => output.push(line) }), 0);
  const api = calls.filter(c => c.binary === "gh");
  assert.equal(api.length, 3);
  assert.deepEqual(api.map(c => c.args.at(-1)), ["repos/drowknet/drowk-crm", "repos/drowknet/drowk-crm/branches/main", "repos/drowknet/drowk-crm/branches/main/protection"]);
  for (const { args, options } of api) {
    assert.deepEqual(args.slice(0, 5), ["api", "--hostname", "github.com", "--method", "GET"]);
    assert.equal(options.shell, false);
    assert.deepEqual(options.stdio, ["ignore", "pipe", "pipe"]);
    assert.equal(args.includes("--include"), false);
    assert.equal(args.includes("--input"), false);
  }
  assert.deepEqual(JSON.parse(output[0]), { status: "PASS", issues: [] });
});

test("wrong root or wrong origin prevents any remote read", () => {
  const { execute, calls } = fakeCommand(exactState());
  assert.equal(run({ execute, cwd: dirname(root), emit: () => {} }), 1);
  assert.equal(calls.length, 0);
  const wrongOrigin = (binary, args) => ({ status: 0, stdout: args[0] === "rev-parse" ? root : "https://github.com/other/repo.git" });
  assert.equal(run({ execute: wrongOrigin, cwd: root, emit: () => {} }), 1);
});

test("missing gh, auth/API errors, invalid JSON and arbitrary failures never echo raw content", () => {
  const marker = ["untrusted", "-diagnostic-", "do-not-echo"].join("");
  for (const response of [
    () => ({ status: null, error: new Error(marker), stdout: marker, stderr: marker }),
    () => ({ status: 1, stdout: JSON.stringify(exactState()[0]), stderr: marker }),
    () => ({ status: 0, stdout: marker, stderr: marker }),
    () => { throw new Error(marker); },
  ]) {
    const { execute } = fakeCommand(exactState(), response), output = [];
    assert.equal(run({ execute, cwd: root, emit: line => output.push(line) }), 1);
    assert.equal(output.join("").includes(marker), false);
    assert.ok(JSON.parse(output[0]).issues.length > 0);
  }
  const state = exactState();
  state[0].full_name = marker; state[1].name = marker;
  state[2].required_status_checks.checks[0].context = marker;
  state[2].required_pull_request_reviews.bypass_pull_request_allowances[marker] = [marker];
  const { execute } = fakeCommand(state), output = [];
  assert.equal(run({ execute, cwd: root, emit: line => output.push(line) }), 1);
  assert.equal(output.join("").includes(marker), false);
  for (const finding of JSON.parse(output[0]).issues) assert.deepEqual(Object.keys(finding).sort(), ["code", "field"]);
});

test("protection API failure remains failure even with valid repository/branch responses", () => {
  const state = exactState(); state[1].protected = false;
  const { execute } = fakeCommand(state, index => index === 2 ? { status: 1, stderr: "synthetic" } : { status: 0, stdout: JSON.stringify(state[index]) });
  const output = [];
  assert.equal(run({ execute, cwd: root, emit: line => output.push(line) }), 1);
  const issues = JSON.parse(output[0]).issues;
  assert.ok(issues.some(i => i.field === "protection" && i.code === "API_READ_FAILED"));
  assert.ok(issues.some(i => i.field === "branch.protected" && i.code === "MISMATCH"));
});
