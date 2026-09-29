# Cloudflare Checkpoint — DROWK CRM

Status: OWNER-SUPPLIED INFRASTRUCTURE CHECKPOINT / NO DEPLOYMENT YET

## Observed owner-supplied state

The owner showed the Cloudflare dashboard for `drowk.net` with:
- DNS setup shown as Full;
- no Worker connected to the zone at that checkpoint;
- Cloudflare Workers & Pages GitHub App authorization scoped specifically to `drowknet/drowk-crm`;
- Cloudflare repository selection able to see `drowk-crm`;
- no DROWK CRM app created/deployed yet.

## Current decision

Do not create the Cloudflare application merely because repository access is configured.

First complete DCRM-00 architecture/runtime decisions.

## Approved namespace direction

Production CRM target:
`crm.drowk.net`

Likely future environments:
- local development;
- branch/PR preview;
- staging at `crm-staging.drowk.net`;
- production at `crm.drowk.net`.

## Deployment boundary

GitHub should own code/version history.

Cloudflare may later own edge/web deployment, DNS/TLS and Access gates.

Canonical CRM business state must not live in Cloudflare deployment configuration.

## Architecture options still open

A. Cloudflare frontend only + backend elsewhere.

B. Cloudflare full-stack Workers where technically appropriate.

C. Hybrid: Cloudflare web/BFF/edge plus separate backend/intelligence workers/services and PostgreSQL.

No option is selected by this checkpoint.

## Security

The GitHub App's repository-specific authorization is a desirable least-privilege pattern.

Future deployment must use separate development/staging/production secrets and bindings.

Never commit Cloudflare credentials to Git.
