# Observability

Cross-cutting telemetry adapters.

Initial direction:
- OpenTelemetry-compatible traces/metrics/logs;
- correlation across API, worker, connectors and provider calls;
- AI evaluation projections where useful.

Canonical durable business evidence remains in DROWK storage.

Telemetry should carry identifiers such as tenant, run, correlation, capability,
provider, policy version and work/action references while minimizing raw sensitive
payloads.
