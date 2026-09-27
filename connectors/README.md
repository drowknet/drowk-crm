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
