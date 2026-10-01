type SupabaseToken = {
  token: string;
  expiresAt: number;
};

const EXPIRY_BUFFER_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 10_000;

let cachedToken: SupabaseToken | null = null;
let pendingRequest: Promise<string | null> | null = null;
let pendingController: AbortController | null = null;
let cacheGeneration = 0;

export function clearSupabaseTokenCache(): void {
  cachedToken = null;
  cacheGeneration += 1;
  pendingRequest = null;
  pendingController?.abort();
  pendingController = null;
}

function isValidToken(value: unknown): value is SupabaseToken {
  if (typeof value !== "object" || value === null) return false;
  if (!("token" in value) || !("expiresAt" in value)) return false;
  if (typeof value.token !== "string" || !value.token.trim()) return false;
  if (typeof value.expiresAt !== "number" || !Number.isFinite(value.expiresAt)) {
    return false;
  }
  return value.expiresAt > Date.now() / 1000;
}

export function getSupabaseToken(): Promise<string | null> {
  const cacheIsFresh = cachedToken !== null &&
    Date.now() / 1000 < cachedToken.expiresAt - EXPIRY_BUFFER_SECONDS;
  if (cacheIsFresh && cachedToken) return Promise.resolve(cachedToken.token);
  if (pendingRequest) return pendingRequest;

  cachedToken = null;
  const requestGeneration = cacheGeneration;
  const controller = new AbortController();
  pendingController = controller;
  let timeout: ReturnType<typeof setTimeout>;
  const deadline = new Promise<null>((resolve) => {
    timeout = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, REQUEST_TIMEOUT_MS);
  });

  const fetchToken = async (): Promise<SupabaseToken | null> => {
    const response = await fetch("/api/auth/supabase-token", {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    if (requestGeneration !== cacheGeneration || controller.signal.aborted) {
      return null;
    }
    if (response.status === 401) {
      clearSupabaseTokenCache();
      return null;
    }
    if (!response.ok) return null;
    const responseBody: unknown = await response.json();
    if (!isValidToken(responseBody)) return null;
    return responseBody;
  };

  const request = Promise.race([fetchToken(), deadline])
    .then((tokenResponse) => {
      // A cleared session or timed-out request must never restore cached credentials.
      if (requestGeneration !== cacheGeneration || controller.signal.aborted) {
        return null;
      }
      if (!tokenResponse) return null;
      cachedToken = tokenResponse;
      return tokenResponse.token;
    })
    .catch(() => null)
    .finally(() => {
      clearTimeout(timeout);
      // An older request can finish while the next session's request is pending.
      if (pendingRequest !== request) return;
      pendingRequest = null;
      pendingController = null;
    });

  pendingRequest = request;
  return request;
}
