# Maintainer Workflow

This workflow makes maintenance observable, repeatable, and useful to contributors.

## Issue triage

For new issues:

- confirm the report is actionable and safely reproducible;
- classify bug, enhancement, documentation, dependency, or security;
- request missing evidence;
- close duplicates with a pointer to the canonical issue;
- route security reports through the private process.

## Pull requests

Review for:

- architecture and invariant compatibility;
- tenant and security impact;
- provenance and auditability;
- tests and evals;
- provider and capability boundaries;
- migration and rollback effects;
- documentation accuracy.

CI passing is necessary but not sufficient for merge.

## Dependencies

Dependency updates should be reviewed for security impact, license compatibility, runtime impact, behavioral changes, and reproducible lockfile updates.

## Releases

Follow [RELEASE_PROCESS.md](RELEASE_PROCESS.md). Releases should correspond to real maintained checkpoints, not artificial cadence.

## Project health

Stars, forks, downloads, issue counts, and release counts should not be inflated. Project-health claims must be grounded in observable repository activity.

## Security

Security reports use [../../SECURITY.md](../../SECURITY.md). High-impact fixes should preserve auditability and avoid creating a temporary bypass that becomes permanent.
