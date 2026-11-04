import "server-only";
import { NextResponse } from "next/server";
import { allow, clientKey } from "@/lib/rate-limit";

const NO_STORE = { "cache-control": "no-store" };

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: NO_STORE });
export const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: NO_STORE });

export async function readJson<T>(req: Request, max = 2_000_000): Promise<T | null> {
  try {
    const text = await req.text();
    if (text.length > max) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Wraps a handler: rate limit, then any throw becomes a plain SERVER error with no personal data logged. */
export function route<A extends unknown[]>(name: string, limit: number, fn: (req: Request, ...a: A) => Promise<Response>) {
  return async (req: Request, ...a: A) => {
    if (!allow(`${name}:${clientKey(req)}`, limit)) return fail("RATE_LIMITED", 429);
    try {
      return await fn(req, ...a);
    } catch (e) {
      console.error(name, "failed", (e as Error).name, (e as Error).message.slice(0, 120));
      return fail("SERVER", 500);
    }
  };
}
