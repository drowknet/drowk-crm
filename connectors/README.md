# Connectors

Connectors integrate external systems into the Observation/Evidence boundary.

Expected connectors:
- Gmail / Google Workspace
- AIsa capability fabric
- LinkedIn export
- future supported mail/data providers

Rules:
- preserve source IDs and timestamps;
- capture source watermarks/cursors where supported;
- normalize into Observation/Evidence contracts;
- do not silently mutate CRM truth;
- separate read from write capability.
- bind provider account, source identity and sending identity independently;
- never infer a commercial sender from the provider/login used for research;
- a PWM Gmail/Workspace outage must fail closed for Gmail-dependent capability without taking down unrelated DROWK/provider capabilities.

Current owner-confirmed bindings are documented in
[`docs/architecture/EXTERNAL_IDENTITY_DEPENDENCY_BOUNDARY.md`](../docs/architecture/EXTERNAL_IDENTITY_DEPENDENCY_BOUNDARY.md).
