# Capability and Provider Model

## Goal

DROWK CRM asks for capabilities, not hard-coded vendors.

Examples:
- FIND_BUYERS
- ENRICH_PERSON
- ENRICH_COMPANY
- DISCOVER_LOCATIONS
- VERIFY_EMPLOYMENT
- FIND_PROCUREMENT_ROUTE
- RESEARCH_COMPANY
- SEARCH_WEB
- EXTRACT_WEB_PAGE
- CLASSIFY_MESSAGE
- GENERATE_DRAFT
- READ_MAILBOX
- PREPARE_DRAFT
- SEND_MESSAGE

## Capability registry fields

Each capability/provider binding should record:
- capability_id
- provider
- operation
- interface (REST/MCP/native/etc.)
- read_or_write
- input contract
- output contract
- required credential scope
- provider data retention notes
- unit cost / pricing metadata
- latency expectations
- freshness
- reliability
- current enablement state
- environment restrictions
- allowed tenant(s)
- approval class

## AIsa

AIsa is expected to be a major external capability fabric.

Initial evaluation candidates include:
- Apollo
- LinkedIn evidence
- DataForSEO
- Similarweb
- Exa
- Tavily
- Firecrawl
- grounded search/research tools
- Jina
- model gateway
- AgentMail for non-production sandbox testing

Do not assume every catalog capability should be enabled.

## Progressive intelligence

Research depth should increase only when additional evidence has expected value.

Example:

```text
cheap deterministic filters
-> inexpensive provider evidence
-> multi-source triangulation
-> deeper research
-> human-reviewed pursuit
```

Each research run should have:
- objective
- evidence gaps
- max provider cost
- max tool calls
- allowed capability classes
- stopping conditions
- output evidence IDs

## Physical capability isolation

READ and WRITE capabilities must be independently controlled.

A provider adapter that supports both must expose separate policy permissions.

Examples:
- APOLLO_READ != APOLLO_WRITE
- GMAIL_READ != GMAIL_DRAFT != GMAIL_SEND
- AGENTMAIL_READ != AGENTMAIL_SEND
