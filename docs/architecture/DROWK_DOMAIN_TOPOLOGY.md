# DROWK Domain and Product Topology

Status: OWNER-APPROVED FOUNDATION DIRECTION

## Principle

Separate:
1. DROWK brand identity;
2. DROWK systems/products;
3. public commercial vertical brands.

## drowk.com — brand / corporate identity

Use:
- DROWK corporate/public website;
- product/solution presentation;
- public company identity;
- future DROWK-controlled human email identity if desired.

Do not make core system runtimes depend on the public brand website.

## drowk.net — systems namespace

Approved direction:

- `crm.drowk.net` — DROWK CRM production application.
- `hds.drowk.net` — HDS internal/operational system/Brain surface.
- `admin.drowk.net` — future DROWK Control Plane.
- `api.drowk.net` — future cross-product/API gateway if justified.
- `docs.drowk.net` — technical/operational documentation if deployed.
- `status.drowk.net` — future service status if justified.
- `lab.drowk.net` — optional controlled experiments, not production truth.

Staging naming should be consistent, e.g. `crm-staging.drowk.net`.

PR/feature previews may use provider-generated preview URLs rather than permanent DNS.

## highdustingservice.com — HDS public commercial brand

`highdustingservice.com` / `www.highdustingservice.com` remains the customer-facing HDS site.

Internal HDS systems belong under `hds.drowk.net`, not the customer-facing website namespace.

## Product/repository boundaries

- `drowknet/drowk-crm` — DROWK CRM product.
- other DROWK repositories remain separate products/projects.
- shared code must become an explicit package/interface if reuse is later justified; do not create hidden cross-repository coupling.

## DROWK CRM connector principle

A tenant mailbox such as an employer-controlled Gmail/Workspace account is a Connector.

It is not:
- product ownership;
- engineering canon;
- CRM database;
- DROWK identity root.

Loss/revocation of a tenant connector may remove access to that source, but must not destroy the DROWK CRM product, code, policies or unrelated tenants.

## Future control plane

A future `admin.drowk.net` may aggregate:
- application health;
- deploy/version;
- database health;
- provider health/cost;
- agent/job status;
- eval status;
- security alerts.

This is a future product surface, not authorization to implement it during DCRM-00.
