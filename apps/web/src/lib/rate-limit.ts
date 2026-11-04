// Small fixed-window limiter for the public demo APIs. Per process; good enough for one server.
const hits = new Map<string, { n: number; reset: number }>();

export function allow(key: string, limit = 60, windowMs = 60_000, now = Date.now()): boolean {
  if (process.env.SIGIL_NO_RATE_LIMIT === "1") return true;
  const h = hits.get(key);
  if (!h || now > h.reset) {
    if (hits.size > 10_000) hits.clear();
    hits.set(key, { n: 1, reset: now + windowMs });
    return true;
  }
  h.n += 1;
  return h.n <= limit;
}

export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
