# AIsa Capability Adapter

AIsa is a capability/provider fabric, never canonical CRM truth.

The adapter should translate DROWK capability requests such as:
- FIND_BUYERS;
- DISCOVER_LOCATIONS;
- VERIFY_EMPLOYMENT;
- FIND_PROCUREMENT_ROUTE;
- RESEARCH_COMPANY;
- SEARCH_WEB;
- EXTRACT_WEB_PAGE.

Production calls should preserve:
- requested capability;
- selected provider/tool;
- normalized inputs;
- READ/WRITE classification;
- estimated/actual cost when known;
- freshness;
- rights/retention classification;
- request/response fingerprints;
- run/correlation lineage;
- explicit empty/error/unknown semantics.

MCP is useful for discovery and agent-assisted research. Deterministic production
operations should use typed adapters and bounded budgets.
