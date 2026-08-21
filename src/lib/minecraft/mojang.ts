/**
 * Server-side Mojang profile lookup. Never called from the browser — the
 * frontend always talks to our own `/api/minecraft/player` route instead
 * (see that route for rate limiting and validation).
 */

interface CacheEntry {
  uuid: string | null; // null = confirmed "no such player"
  username: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — usernames rarely change
const cache = new Map<string, CacheEntry>();

export interface MojangLookupResult {
  found: boolean;
  uuid?: string;
  username?: string;
}

/** Resolves a Java Edition username to its canonical UUID via Mojang. */
export async function resolveUsername(username: string): Promise<MojangLookupResult> {
  const key = username.toLowerCase();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.uuid ? { found: true, uuid: cached.uuid, username: cached.username! } : { found: false };
  }

  const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
    headers: { Accept: "application/json" },
    // Mojang has no documented bulk contract here — this is a single,
    // cached, user-initiated lookup, never a loop over many usernames.
    signal: AbortSignal.timeout(5000),
  });

  if (res.status === 404 || res.status === 204) {
    cache.set(key, { uuid: null, username: null, expiresAt: Date.now() + CACHE_TTL_MS });
    return { found: false };
  }
  if (!res.ok) {
    throw new Error(`Mojang lookup failed with status ${res.status}`);
  }

  const data = (await res.json()) as { id: string; name: string };
  cache.set(key, { uuid: data.id, username: data.name, expiresAt: Date.now() + CACHE_TTL_MS });
  return { found: true, uuid: data.id, username: data.name };
}
