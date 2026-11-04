import { db } from "@/lib/server/db";
import { getOrg } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The org console data: waiting requests and issued Seals (references only, no names). */
export const GET = route("queue", 120, async () => {
  const id = await sessionOf("issuer");
  if (!id) return fail("NOT_SIGNED_IN", 401);
  const org = await getOrg(id);
  if (!org) return fail("NOT_SIGNED_IN", 401);
  const sql = db();
  const [requests, seals] = await Promise.all([
    sql`select id, kind, fields, created_at from requests where org_id = ${id} and state = 'pending' order by created_at`,
    sql`select id, kind, label, status_idx, created_at, revoked_at, revoke_reason, (wallet_id is not null) as claimed
        from seals where org_id = ${id} order by created_at desc limit 200`,
  ]);
  return ok({ org: { id: org.id, name: org.name, sample: org.sample, kind: org.kind }, requests, seals });
});
