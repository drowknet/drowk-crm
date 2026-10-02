# GitHub Security Settings — Public OSS Baseline

These repository-host settings complement the controls committed in source.

## Verify in repository settings

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Push protection for secrets
- Private vulnerability reporting
- Code scanning / CodeQL results
- Protected `main` with required CI checks

Do not weaken the existing protected-main policy.

## Dependency review

GitHub Dependency Review requires Dependency Graph. The workflow should be added only after Dependency Graph is confirmed active.

## CodeQL

The repository carries an explicit CodeQL workflow so configuration remains reviewable in source control. CodeQL is one security signal and does not replace threat modeling, tests, or review.

## Secret scanning

GitHub scanning and the repository-owned secret sensors are complementary controls.

## Verification

Record owner-side settings changes in the OSS hardening issue or pull request without adding private administration details to the repository.
