# API scope

This service is the application boundary for canonical DROWK operations.

Rules:
- authorization happens before mutation;
- handlers call domain/policy code rather than embedding business rules;
- provider SDK schemas never become public/domain contracts;
- do not expose secrets or raw sensitive provider payloads;
- keep framework choice replaceable until explicitly adopted.
