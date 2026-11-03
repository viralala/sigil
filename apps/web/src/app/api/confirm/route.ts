import { NextResponse } from "next/server";
import { confirmSample } from "@sigil/core";
import { sampleWorld } from "@/lib/world";
import { allow, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const err = (error: string, status: number) =>
  NextResponse.json({ error }, { status, headers: { "cache-control": "no-store" } });

/** POST { name, degree, year } -> the sample college signs a new Seal (one-tap registrar confirm). */
export async function POST(req: Request) {
  if (!allow("confirm:" + clientKey(req), 20)) return err("RATE_LIMITED", 429);
  let body: { name?: unknown; degree?: unknown; year?: unknown };
  try {
    const text = await req.text();
    if (text.length > 2_000) return err("BAD_INPUT", 413);
    body = JSON.parse(text) ?? {};
  } catch {
    return err("BAD_INPUT", 400);
  }
  try {
    const id = confirmSample(sampleWorld(), {
      name: String(body.name ?? ""),
      degree: String(body.degree ?? ""),
      year: Number(body.year),
    });
    return NextResponse.json({ id, sample: true }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    if ((e as { code?: string }).code === "BAD_INPUT") return err("BAD_INPUT", 400);
    console.error("confirm failed", (e as Error).name);
    return err("SERVER", 500);
  }
}
