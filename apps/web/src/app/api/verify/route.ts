import { NextResponse } from "next/server";
import { checkSample } from "@sigil/core";
import { parseShareLink } from "@/lib/link";
import { sampleWorld } from "@/lib/world";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });

/** POST { link } -> a real check of a sample Seal: fresh one-time challenge, presentation, verify. */
export async function POST(req: Request) {
  if (!allow("verify:" + clientKey(req))) return err("RATE_LIMITED", 429);
  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > 2_000) return err("TOO_LONG", 413);
    body = JSON.parse(text);
  } catch {
    return err("BAD_JSON", 400);
  }
  const parsed = parseShareLink((body as { link?: unknown } | null)?.link);
  if (!parsed.ok) return err(parsed.error, 400);
  try {
    const result = checkSample(sampleWorld(), parsed.id);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if ((e as { code?: string }).code === "UNKNOWN_SAMPLE") return err("UNKNOWN_SAMPLE", 404);
    console.error("verify failed", (e as Error).name); // no PII in logs
    return err("SERVER", 500);
  }
}
