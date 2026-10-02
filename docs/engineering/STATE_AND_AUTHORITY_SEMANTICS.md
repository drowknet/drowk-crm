# State & Authority Semantics

Status: CANONICAL ENGINEERING SEMANTICS

Purpose: prevent a passing sensor, installed tool, remembered local state or provider identifier
from being promoted into authority it does not have.

## Evidence planes

Keep these planes separate:

1. **GitHub remote state** — branch/SHA/PR/protection/CI facts observed directly from GitHub.
2. **Owner-local workspace state** — machine, user, repo root, branch, HEAD and worktree observed
   on the owner machine. Remote GitHub state never proves current local state.
3. **Tool availability state** — plugin/binary/connector exists or is installed. This does not
   prove authentication, project configuration or authorization.
4. **Provider configuration state** — the exact DROWK account/project/resource binding has been
   explicitly established and reviewed.
5. **Owner authority state** — the owner explicitly authorized an exact read/write/live action.
   Authority is scope- and stage-specific.

No plane silently upgrades another.

## Provider/tool vocabulary

- **AVAILABLE / INSTALLED**: integration or binary exists.
- **CONNECTED**: bounded authentication/connection was verified.
- **CONFIGURED**: DROWK-specific account/project/resource binding is established and reviewed.
- **AUTHORIZED**: owner permitted the exact operation at the exact scope.
- **EXECUTED**: the operation actually ran.
- **VALIDATED**: deterministic/review evidence supports the observed result.
- **ACCEPTED**: the owner/review process accepted the evidence for the stated consequence.

Each state is independent unless an explicit work package says otherwise.

Current owner-confirmed project state on 2026-10-01:
- DigitalOcean: **UNCONFIGURED for DROWK**.
- Neon: **UNCONFIGURED for DROWK**.
- Apollo: **UNCONFIGURED for DROWK** and not an EF-03 infrastructure dependency.
- GitHub: canonical engineering/version source; direct remote reads may establish remote facts.
- Cloudflare staging readiness is not established by this correction; EF-03 live authority remains closed.

## Harness and CI semantics

`harness:preflight` proves only the repository-preflight contract defined by EF-01A. It is not
owner-local workcell bootstrap and does not prove the expected task branch/HEAD, writer ownership,
merge permission, provider readiness or deploy permission.

`harness:fast`, `harness:full`, `harness:ci`, runtime verification, staging verification and
`postgres-foundation` prove only their deterministic sensor contracts at the tested source state.

Therefore:
- PASS != merge authorization;
- CI green != local worktree state;
- CI green != provider configuration;
- staging verification PASS != staging deployment;
- provider connection/configuration != live call authorization;
- execution != acceptance;
- model/reviewer approval != owner authorization.

Ordinary CI is Docker-backed by design for runtime packaging and disposable PostgreSQL. A docs/work
package that says "zero Docker" must explicitly mean zero candidate/Q2B/owner-local candidate Docker
execution if ordinary repository CI remains enabled.

## Owner-local bootstrap and Codex

Before material local writing, owner-local bootstrap establishes expected repo root, branch, HEAD
and worktree policy. Codex observes that state and stops on mismatch. Codex does not repair Git
state merely to reach the requested starting point.

Absent a separate explicit owner gate, Codex must not fetch, pull, switch/checkout/create/delete
branches, reset, rebase, merge, stash, clean, gc/repack/maintenance or repair commit graphs.

One operational stage completes and its evidence is reviewed before dependent commands for a later
stage are issued. Do not retry Git mutations solely because a wrapper reported stderr; revalidate
the actual process/remote result first.

## Deployment identity

Historical implementation SHAs are evidence checkpoints, not perpetual deployment candidates.
An EF-03 live plan must select one exact protected-main SHA and revalidate exact-head/post-merge CI
at the time that live plan is opened. Feature branch names never become long-lived deploy authority.
