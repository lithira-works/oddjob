/**
 * Fixed-window limiter held in memory. Good for one server and for development. Before
 * launch on serverless hosting, replace the store with a shared one (see docs/SECURITY.md),
 * because each instance would otherwise keep its own count.
 */
type Window = { count: number; resetAt: number };
const store = new Map<string, Window>();
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  if (store.size > MAX_KEYS) {
    for (const [k, w] of store) if (w.resetAt <= now) store.delete(k);
  }
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}

/**
 * Anyone can fake a forwarded-IP header, so only the one the host overwrites is believed.
 * Set TRUSTED_IP_HEADER when deploying, such as x-real-ip on Vercel. Until then everyone
 * shares one limit, which is strict but can't be dodged.
 */
export function clientKey(headers: Headers, scope: string, trustedHeader = process.env.TRUSTED_IP_HEADER) {
  const ip = trustedHeader ? headers.get(trustedHeader)?.split(",")[0]?.trim() : undefined;
  return `${scope}:${ip || "shared"}`;
}
