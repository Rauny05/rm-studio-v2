import Ably from "ably";

let _client: Ably.Realtime | null = null;

/**
 * Returns a shared Ably Realtime client, or null if ABLY_API_KEY is not set.
 * Client-safe: uses token auth endpoint to avoid exposing the key in the browser.
 */
export function getAblyClient(): Ably.Realtime | null {
  if (typeof window === "undefined") return null; // server side — skip

  // We always use token auth for client-side to avoid exposing the secret key
  if (!_client) {
    try {
      _client = new Ably.Realtime({
        authUrl: "/api/ably/token",
        authMethod: "GET",
      });
    } catch {
      return null;
    }
  }
  return _client;
}

/**
 * Server-side helper: creates a token request using ABLY_API_KEY.
 * Returns null if the key is not configured.
 */
export function getAblyServer(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  try {
    return new Ably.Rest({ key });
  } catch {
    return null;
  }
}
