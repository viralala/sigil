import { getOrg, statusListFor } from "@/lib/server/trust";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public signed status list for an org (url-encoded did). */
export const GET = route("status", 120, async (_req, { params }: { params: Promise<{ org: string }> }) => {
  const { org } = await params;
  const o = await getOrg(decodeURIComponent(org));
  if (!o) return fail("NOT_FOUND", 404);
  return ok(await statusListFor(o));
});
