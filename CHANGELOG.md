# Changelog

All notable public changes to DROWK CRM are documented here.

The project follows Semantic Versioning for public versioned releases.

## [Unreleased]

## [0.1.0-alpha.1] - 2026-10-02

### Added

- Public open-source community, governance, support, and security baseline.
- Apache License 2.0 licensing and repository package metadata.
- Public-facing README and project architecture entrypoints.
- GitHub issue forms, pull-request template, and CODEOWNERS.
- Dependabot configuration and CodeQL analysis.
- Repository-owned public-OSS privacy sensor.
- Repository-owned internal Markdown-link sensor.

### Changed

- Public-facing documentation and reusable domain semantics were generalized away from tenant-specific identifiers and local-machine paths.
- Tenant-specific migration/reference artifacts were renamed or removed from the public tree where they were not appropriate for OSS consumers.

### Security

- Added public vulnerability-reporting guidance and a repository threat-model entrypoint.
- Added CodeQL to the review and main-branch workflow.
- Preserved the pre-OSS file tree in a separately verified private archive before public sanitization.
- Confirmed protected-main CI, runtime packaging, staging-boundary verification, PostgreSQL foundation, and CodeQL were green for the OSS baseline merge.

### Known limitations

- This is an early alpha engineering checkpoint, not a production-ready hosted CRM.
- Live provider credentials, tenant data, production deployment, and high-impact external actions remain outside this release.
- GitHub-hosted Dependency Review remains deferred until Dependency Graph is enabled for the repository.

## Release policy

Prereleases such as `0.1.0-alpha.1` are public engineering checkpoints and are not production-readiness claims.
