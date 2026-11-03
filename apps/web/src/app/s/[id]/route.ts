import { NextResponse } from "next/server";
import { parseShareLink } from "@/lib/link";

// A scanned share link (/s/<id>) opens the check page with the id filled in.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = parseShareLink(id);
  const url = new URL("/check", req.url);
  if (parsed.ok) url.searchParams.set("s", parsed.id);
  return NextResponse.redirect(url, 307);
}
