import { Buffer } from "node:buffer";

const headers = { "Cache-Control": "private, no-store" };

/**
 * @param {number} status
 * @param {string} error
 */
function failure(status, error) {
  return Response.json({ error }, { status, headers });
}

/**
 * Decode only the ID token supplied by the trusted Auth0 SDK session.
 * This is a claim-shape check, not signature verification; Supabase verifies
 * the issued token at its own boundary.
 * @param {string} token
 * @returns {{sub?: unknown, exp?: unknown, role?: unknown} | null}
 */
function readClaims(token) {
  const segments = token.split(".");
  if (segments.length !== 3) return null;
  if (segments.some((segment) => !/^[A-Za-z0-9_-]+$/.test(segment))) return null;
  try {
    const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Session and actor callbacks are supplied only by the server route.
 * Request data never supplies identity or tokens.
 * @param {Request} request
 * @param {{
 *   appBaseUrl: string | undefined,
 *   getSession: () => Promise<{user: {sub?: unknown}, tokenSet: {idToken?: string}} | null>,
 *   requireActor: () => Promise<{auth0Subject: string}>,
 *   ActorError: new (status: 401 | 403, code: string) => Error & {status: 401 | 403},
 *   now?: () => number
 * }} dependencies
 * @returns {Promise<Response>}
 */
export async function createSupabaseTokenResponse(request, dependencies) {
  const { appBaseUrl, getSession, requireActor, ActorError, now = Date.now } = dependencies;
  let origin;
  try {
    if (!appBaseUrl?.trim()) return failure(503, "TOKEN_UNAVAILABLE");
    const appUrl = new URL(appBaseUrl);
    if (!["http:", "https:"].includes(appUrl.protocol)) return failure(503, "TOKEN_UNAVAILABLE");
    origin = appUrl.origin;
  } catch {
    return failure(503, "TOKEN_UNAVAILABLE");
  }

  const requestOrigin = request.headers.get("origin");
  if (new URL(request.url).origin !== origin) return failure(403, "FORBIDDEN");
  if (requestOrigin !== null && requestOrigin !== origin) return failure(403, "FORBIDDEN");
  if (request.headers.get("sec-fetch-site") === "cross-site") return failure(403, "FORBIDDEN");

  try {
    const session = await getSession();
    const subject = session?.user?.sub;
    if (typeof subject !== "string" || !subject.trim()) return failure(401, "UNAUTHENTICATED");

    const token = session?.tokenSet?.idToken;
    if (typeof token !== "string" || !token) return failure(401, "UNAUTHENTICATED");
    const claims = readClaims(token);
    if (!claims || typeof claims.exp !== "number" || !Number.isFinite(claims.exp)) {
      return failure(401, "UNAUTHENTICATED");
    }
    if (claims.exp <= now() / 1000) return failure(401, "UNAUTHENTICATED");
    if (claims.sub !== subject || claims.role !== "authenticated") return failure(401, "UNAUTHENTICATED");

    const actor = await requireActor();
    if (actor.auth0Subject !== subject) return failure(401, "UNAUTHENTICATED");
    if (claims.exp <= now() / 1000) return failure(401, "UNAUTHENTICATED");
    return Response.json({ token, expiresAt: claims.exp }, { headers });
  } catch (error) {
    if (error instanceof ActorError) {
      if (error.status === 401) return failure(401, "UNAUTHENTICATED");
      if (error.status === 403) return failure(403, "FORBIDDEN");
    }
    return failure(503, "TOKEN_UNAVAILABLE");
  }
}
