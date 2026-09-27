# Domain

Canonical DROWK CRM business behavior.

Owns domain rules and use cases around:
- Tenant / Actor boundaries;
- Account / Facility / Contact;
- Conversation / Activity;
- Pursuit / Opportunity;
- Evidence-aware promotion;
- Signals;
- Research;
- Work;
- Outcomes.

The domain must not import provider-specific schemas as canonical types.

Source connectors, AIsa, Gmail, queue engines, auth providers and observability
systems remain adapters around this boundary.
