# Harness scope

This directory owns deterministic engineering sensors and verification helpers.

Rules:
- sensors verify; they do not redefine architecture to make tests pass;
- never weaken a sensor to green a change;
- keep fixtures synthetic/redacted;
- prefer independent checks for migrations, tenant isolation, identity, policy and fail-closed behavior;
- report exact evidence and failure reason.
