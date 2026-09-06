/**
 * In-memory sliding-window rate limiter. Sufficient for a single-instance
 * deployment; once Skuware runs multiple app instances behind a load
 * balancer, replace the store with Redis (e.g. Upstash) so limits are
 * shared across instances. Interface is kept intentionally small so that
 * swap is a one-file change.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the map doesn't grow unbounded on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < 60 * 60 * 1000);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  const limited = bucket.hits.length >= limit;
  if (!limited) {
    bucket.hits.push(now);
  }
  buckets.set(key, bucket);
  return limited;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
