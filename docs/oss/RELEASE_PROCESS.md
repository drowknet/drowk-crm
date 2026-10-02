# Release Process

DROWK CRM uses releases to communicate reproducible public checkpoints.

## Versioning

Public releases follow Semantic Versioning. During early development, prereleases may use identifiers such as `0.1.0-alpha.1`.

A prerelease is not a production-readiness claim.

## Release gate

Before publishing a release:

1. `main` is green under required CI.
2. Known security findings have been triaged.
3. Documentation matches externally visible behavior.
4. Migration and configuration changes are documented.
5. Known limitations are stated.
6. Rollback or recovery implications are understood.
7. The changelog contains the release summary.
8. The release is tagged from the reviewed `main` commit.

## Release notes

Release notes should include capabilities or fixes, security-relevant changes, breaking changes, migration requirements, known limitations, and the exact tag/version.

## Current milestone

The first intended public milestone is an early alpha after the public OSS baseline, sanitization, clean-clone instructions, and required harness checks are complete.
