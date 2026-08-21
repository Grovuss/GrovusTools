/**
 * Best-effort per-IP rate limiting for the Minecraft API routes.
 *
 * This is an in-memory sliding window, which is fine for a single server
 * process but resets on redeploy and isn't shared across serverless
 * instances. For real production traffic on Vercel, swap this for a shared
 * store (Vercel KV / Upstash Redis) — the call site (`checkRateLimit`)
 * wouldn't need to change.
 */
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  bucket.count++;
  return { ok: true, remaining: limit - bucket.count };
}

export function clientKeyFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
