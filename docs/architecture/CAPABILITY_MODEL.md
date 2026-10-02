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
- DISCOVER_PUBLIC_PROFESSIONAL_PROFILE
- FIND_PROFESSIONAL_EMAIL
- VERIFY_PROFESSIONAL_EMAIL
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

## Provider account and channel identity

Capability bindings must not use one generic email identity for provider access, human identity
and outbound sender identity.

External identity references and provider configuration semantics are recorded in
[External Identity and Dependency Boundary](EXTERNAL_IDENTITY_DEPENDENCY_BOUNDARY.md).
In particular:
- a previously recorded Apollo account identity is `drowknet@gmail.com`, but the DROWK Apollo
  integration is currently **UNCONFIGURED**;
- LinkedIn / Sales Navigator uses the recorded login reference `asbrito@proton.me`;
- PWM commercial Gmail belongs to the `andersonpacificwestinc.net` Google Workspace domain.

Tool/plugin availability and account identifiers do not establish provider configuration, and
provider configuration does not grant READ/WRITE/live authority.

These are independent provider/channel bindings. A provider used for research does not select or
authorize a commercial sender. Provider-account credentials must be independently revocable and
must not become infrastructure roots of trust.

## Prospecting open-source qualification consequence — 2026-10-01

The prospecting OSS harvest introduces candidate implementations/patterns for search, extraction,
buyer discovery, company enrichment, professional-email discovery/verification, Employment evidence
and procurement-route research.

See:
- [DCRM-05D — Prospecting Open-Source Harvest & Capability Qualification](../work-packages/DCRM-05D-prospecting-oss-harvest-capability-qualification.md)
- [Prospecting Open-Source Harvest — 2026-10-01](../reference-harvest/PROSPECTING_OSS_HARVEST_2026-10-01.md)

These are capability candidates only. No new cell is `LIVE_VALIDATED_CAPABILITY`, no new provider
call is authorized, and no open-source project becomes canonical truth or platform authority by
appearing in the harvest.

Public/indexed LinkedIn discovery, if later qualified, is a low-authority EvidenceCandidate path.
Authenticated LinkedIn scraping/session-cookie/browser automation remains outside the canonical
prospecting path.

## Physical capability isolation

READ and WRITE capabilities must be independently controlled.

A provider adapter that supports both must expose separate policy permissions.

Examples:
- APOLLO_READ != APOLLO_WRITE
- GMAIL_READ != GMAIL_DRAFT != GMAIL_SEND
- AGENTMAIL_READ != AGENTMAIL_SEND
