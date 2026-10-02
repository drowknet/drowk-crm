# Public OSS Publication Checklist

This checklist is the completion gate for the initial public DROWK CRM open-source baseline.

## Preservation

- [x] Pin the pre-change repository state with a named archive ref.
- [ ] Copy the pre-change state to a separate private repository controlled by the owner.
- [ ] Verify the private copy before removing or generalizing historical tenant-specific material.

## Repository baseline

- [x] Add Apache-2.0 license.
- [x] Add SECURITY.md.
- [x] Add CONTRIBUTING.md.
- [x] Add GOVERNANCE.md.
- [x] Add SUPPORT.md.
- [x] Add CODE_OF_CONDUCT.md.
- [x] Add CHANGELOG.md.
- [x] Add CODEOWNERS.
- [x] Add issue and pull-request templates.
- [x] Add Dependabot configuration.
- [x] Add CodeQL workflow.
- [ ] Enable Dependency Graph, then restore dependency-review workflow.

## Public sanitization

- [x] Remove or generalize private account identifiers and tenant-specific provider bindings.
- [x] Remove local-machine paths and owner-only workspace instructions from public canon.
- [x] Generalize tenant-specific reason codes in reusable core code.
- [x] Remove internal harvest manifest/handoff artifacts from the public tree; preserved by the pre-change archive ref pending the separate private repository.
- [x] Re-run repository secret/privacy scans after sanitization.
- [ ] Review Git history exposure separately from current-tree cleanup.

## Public documentation

- [ ] Replace the internal-status README with the public OSS README.
- [x] Keep deep architecture, ADRs, and engineering evidence discoverable under docs/.
- [x] Verify install/harness behavior in the clean GitHub Actions checkout on supported Node 22.
- [x] Confirm repository-relative Markdown links resolve through the harness documentation-link sensor.

## GitHub settings

- [ ] Dependency graph.
- [ ] Dependabot alerts and security updates.
- [ ] Secret scanning and push protection.
- [ ] Private vulnerability reporting.
- [ ] Code scanning results.
- [ ] Public repository topics and social preview.
- [ ] Protected-main required checks remain intact.

## Release readiness

- [x] Required CI is green on the reviewed OSS baseline head.
- [x] CodeQL is green on the reviewed OSS baseline head.
- [ ] No unresolved known high-severity issue at release gate.
- [ ] CHANGELOG is current.
- [ ] Publish the first alpha only after the public baseline is merged.

This checklist measures real repository readiness. It must not be used to fabricate adoption, stars, downloads, issues, or release activity.
