# Invoice Builder -> DROWK CRM Transfer Notes

Status: READ-ONLY APPLICATION PATTERN REFERENCE

Source repository: `drowknet/invoice-builder`
Observed main head: `0821f43d7dd7f901486473ead92944ff0a71ad1c`

The business domain is unrelated to CRM. Only application/runtime patterns were harvested.

## 1. Data ownership and portability

### Source-derived

The application emphasizes user-owned storage and explicit export/backup. It supports SQLite and PostgreSQL and treats historical invoice/quote snapshots as immutable historical context.

### DROWK CRM consequence

Preserve:
- explicit exportability;
- tested backup/restore;
- historical snapshots for policy/message/outcome context where required.

Do not copy the invoice data model.

## 2. Multi-session isolation

### Source-derived

Web mode introduced:
- opaque server-issued session tokens;
- workspace/session binding to selected database;
- independent database context per browser session;
- automatic session expiration and cleanup;
- HttpOnly cookies;
- no browser persistence of connection credentials.

The source documentation explicitly states:

session isolation is not account authentication.

### DROWK CRM consequence

This negative lesson is important. DROWK CRM needs real:
- user identity;
- tenant membership;
- roles/permissions;
- session security;
- workspace/tenant scoping.

Do not confuse an opaque session cookie with authentication/authorization.

## 3. HTTPS and reverse proxy

### Source-derived

The web mode:
- uses HttpOnly cookies;
- marks the cookie Secure when HTTPS is indicated;
- forwards `X-Forwarded-Proto` through nginx;
- proxies `/api/*` to the backend;
- serves SPA fallback for unknown frontend paths.

### DROWK CRM consequence

Behind Cloudflare/reverse proxies:
- trust forwarded protocol only from trusted proxy boundaries;
- secure cookies must be enforced in production;
- frontend should not need raw backend credentials;
- API and SPA routing should remain explicit.

Cloudflare-native deployment may make nginx unnecessary; this is a pattern, not a prescribed component.

## 4. Workspace/database-context lesson

### Source-derived

The application moved from one global DB context toward per-session/per-workspace DB context and explicit ownership maps, with serialized setup and cleanup of inactive handles.

### DROWK CRM consequence

Use explicit Tenant/Workspace context on every request and background job.

Prefer one canonical multi-tenant database with tenant-scoped authorization unless future isolation requirements justify separate databases. Do not copy the invoice-builder multi-database design blindly.

## 5. Concurrency and cleanup

### Source-derived

Database setup is serialized to avoid overlapping replacement. Failed setup does not poison the next queued setup. Inactive database handles and expired sessions are explicitly cleaned.

### DROWK CRM consequence

Useful general rules:
- serialize critical configuration/cursor transitions;
- failures must not poison future jobs;
- cleanup is explicit and testable;
- resource ownership must be attributable.

## 6. Testing lessons

### Source-derived

The repo contains unit/security tests for:
- independent session/database contexts;
- session security;
- cookie flags;
- controller behavior;
- database setup and cleanup.

### DROWK CRM consequence

Security invariants such as tenant isolation, session binding and capability separation require executable tests, not documentation only.

## 7. What NOT to transfer

Do not transfer:
- invoice/quote entities;
- Electron assumptions;
- SQLite-first architecture;
- session-only pseudo-auth;
- database credentials supplied by browser users;
- its frontend stack merely because it already exists.

Those solve a different product.
