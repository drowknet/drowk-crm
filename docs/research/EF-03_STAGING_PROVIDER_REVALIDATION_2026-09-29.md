# EF-03 Staging Provider Revalidation — 2026-09-29

Status: CURRENT OFFICIAL-SOURCE INPUT / NO EXTERNAL MUTATION

This note records current provider facts used to freeze EF-03. Provider behavior remains
time-sensitive and must be revalidated at the live deployment gate.

## Cloudflare

Official sources reviewed:
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- https://developers.cloudflare.com/tunnel/
- https://developers.cloudflare.com/tunnel/reference/tunnel-tokens/
- https://developers.cloudflare.com/tunnel/reference/run-parameters/
- https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/

Current facts used:
- Cloudflare recommends creating the Access application before publishing the Tunnel route;
  otherwise the published hostname can be reachable without Access until policy is added.
- Tunnel establishes outbound connections from `cloudflared`; the application origin need not
  expose an inbound public HTTP port.
- remotely managed Tunnel tokens are bearer-equivalent secrets: possession can run the Tunnel.
- `cloudflared` supports token-file input for remotely managed Tunnels on current releases.
- service tokens exist for automated Access clients, but the first EF-03 proof does not require
  automated SSH/TCP administration.

Decision:
- Access first, Tunnel route second;
- app validates Access JWT even when edge/Tunnel also enforce Access;
- token file, pinned cloudflared image, no public API origin port.

## Managed PostgreSQL

Official Neon sources reviewed:
- https://neon.com/docs/get-started-with-neon/workflow-primer
- https://neon.com/docs/manage/endpoints/

Comparison source:
- https://supabase.com/docs/guides/database/overview
- https://supabase.com/docs/guides/platform/backups

Current facts used:
- Neon presents standard PostgreSQL connection strings and isolated database branches;
- direct and pooled connection paths are distinct;
- Neon pooling uses PgBouncer and is intended to raise connection capacity;
- Supabase is also full PostgreSQL with managed backups/PITR options, but adds broader platform
  surface not needed for the first DROWK staging cell.

Decision:
- Neon is the reference managed staging provider for EF-03;
- use a direct TLS connection in the first cell;
- do not use the pooler until advisory/session semantics are explicitly proven.

This is a staging choice, not a permanent canonical provider lock-in.

## GitHub staging secrets and deployment controls

Official sources reviewed:
- https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments
- https://docs.github.com/en/actions/concepts/security/secrets
- https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments
- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations

Current facts used:
- GitHub environment secrets are available to private repositories on GitHub Pro;
- deployment branch restrictions are available on private Pro;
- required reviewers/wait-timer enforcement for private repos is not available on the current
  personal Pro topology in the same way as public/Enterprise cases;
- GHCR can be published from Actions using narrowly scoped `GITHUB_TOKEN` package permissions;
- deployments should consume immutable image digests;
- GitHub artifact attestations for private repositories require Enterprise Cloud, so EF-03 must
  not claim that control on the current plan.

Decision:
- GitHub Environment `staging` is an acceptable managed deployment-secret source after the
  live gate;
- explicit owner authorization remains the human deployment gate;
- GHCR is the intended staging registry after explicit image-push authorization;
- exact Git revision label + registry digest remain the staging image identity controls.

## Compute

No compute vendor is selected in the repo-owned phase.

Reason:
- the architecture baseline already requires replaceable compute;
- provider account, region and cost are live operational facts;
- selecting a vendor is not required to implement/test the Docker staging contract.

Live gate must freeze vendor, region and monthly ceiling before provisioning.

## Authority conclusion

This research authorizes no resource creation, secret retrieval, DNS change, image push or deploy.
