import { db } from "@/lib/server/db";
import { audit, getOrg, revokeIndex } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const REASONS = ["issued-in-error", "record-corrected", "fraud", "holder-request"];

/** Cancel a Seal: flips its bit on the signed status list. */
export const POST = route("revoke", 30, async (req, { params }: Ctx) => {
  const orgId = await sessionOf("issuer");
  if (!orgId) return fail("NOT_SIGNED_IN", 401);
  const { id } = await params;
  const b = await readJson<{ reason?: string }>(req, 200);
  if (!b?.reason || !REASONS.includes(b.reason)) return fail("BAD_INPUT", 400);
  const sql = db();
  const [s] = await sql`select status_idx from seals where id = ${id} and org_id = ${orgId} and revoked_at is null`;
  if (!s) return fail("NOT_FOUND", 404);
  await revokeIndex((await getOrg(orgId))!, s.status_idx);
  await sql`update seals set revoked_at = now(), revoke_reason = ${b.reason} where id = ${id}`;
  await audit(`org:${orgId}`, "seal.revoked", id);
  return ok({ revoked: true });
});
