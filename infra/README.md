# Infrastructure

Target design:
- drowk.net / Cloudflare edge
- separate development, staging and production environments
- PostgreSQL canonical database
- managed secret storage
- CI/CD with review gates
- backups and tested restore procedures
- observability and audit

Infrastructure should be defined as code where practical.

No production credentials belong in this repository.
