import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { ActorId, AuthIdentity, CorrelationId, ExternalPrincipal, RequestContext, RunId, TenantId, UserId } from "@drowk/contracts";

/** Adapter must authenticate credentials, including issuer/audience/expiry as applicable. */
export interface PrincipalVerifier {
  verify(request: IncomingMessage): Promise<ExternalPrincipal | null>;
}
export interface IdentityResolver {
  getIdentity(issuer: string, subject: string): Promise<AuthIdentity | null>;
  resolveActiveMembership(tenantId: TenantId, userId: UserId): Promise<{ tenantId: TenantId; userId: UserId; actorId: ActorId } | null>;
}
export interface AuthorizationDependencies {
  verifier: PrincipalVerifier;
  identities: IdentityResolver;
}
export type AuthorizationResult =
  | { status: 200; context: RequestContext }
  | { status: 400 | 401 | 403 | 503; error: string };

export const denyAllVerifier: PrincipalVerifier = { verify: async () => null };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function authorizeRequest(request: IncomingMessage, dependencies: AuthorizationDependencies): Promise<AuthorizationResult> {
  let principal: ExternalPrincipal | null;
  try { principal = await dependencies.verifier.verify(request); }
  catch { return { status: 401, error: "unauthenticated" }; }
  if (!principal || typeof principal.issuer !== "string" || !principal.issuer.trim()
    || typeof principal.subject !== "string" || !principal.subject.trim()) {
    return { status: 401, error: "unauthenticated" };
  }
  const selector = request.headers["x-drowk-tenant-id"];
  const selectorCount = request.rawHeaders.filter((value, index) => index % 2 === 0 && value.toLowerCase() === "x-drowk-tenant-id").length;
  if (selectorCount !== 1 || typeof selector !== "string" || !uuid.test(selector)) {
    return { status: 400, error: "invalid_tenant_selector" };
  }
  const tenantId = selector.toLowerCase() as TenantId;
  try {
    const identity = await dependencies.identities.getIdentity(principal.issuer, principal.subject);
    if (!identity) return { status: 403, error: "forbidden" };
    const membership = await dependencies.identities.resolveActiveMembership(tenantId, identity.userId);
    if (!membership || membership.tenantId !== tenantId || membership.userId !== identity.userId) {
      return { status: 403, error: "forbidden" };
    }
    return { status: 200, context: {
      tenantId, userId: identity.userId, actorId: membership.actorId,
      runId: randomUUID() as RunId, correlationId: randomUUID() as CorrelationId,
    } };
  } catch { return { status: 503, error: "unavailable" }; }
}
