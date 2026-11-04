import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { endSession, sessionOf } from "@/lib/server/session";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the server holds for this wallet: ciphertext seals, request states, shares, receipts. */
export const GET = route("me", 120, async () => {
  const id = await sessionOf("wallet");
  if (!id) return fail("NOT_SIGNED_IN", 401);
  const sql = db();
  const [seals, requests, shares] = await Promise.all([
    sql`select s.id, s.kind, s.ciphertext, s.created_at, s.revoked_at, s.revoke_reason, s.request_id, o.name as org_name
        from seals s join orgs o on o.id = s.org_id where s.wallet_id = ${id} order by s.created_at desc`,
    sql`select r.id, r.kind, r.state, r.created_at, r.decided_at, o.name as org_name
        from requests r join orgs o on o.id = r.org_id where r.wallet_id = ${id} order by r.created_at desc`,
    sql`select s.id, s.shown, s.expires_at, s.stopped_at, s.created_at,
          coalesce((select json_agg(json_build_object('verdict', r.verdict, 'at', r.viewed_at) order by r.viewed_at desc)
                    from receipts r where r.share_id = s.id), '[]') as receipts
        from shares s where s.wallet_id = ${id} order by s.created_at desc`,
  ]);
  return ok({ id, seals, requests, shares });
});

/** Erase this wallet and everything linked to it (DPDP erasure). */
export const DELETE = route("erase", 10, async () => {
  const id = await sessionOf("wallet");
  if (!id) return fail("NOT_SIGNED_IN", 401);
  await db()`delete from wallets where id = ${id}`;
  await audit(`wallet:${id}`, "wallet.erased", null);
  await endSession("wallet");
  return ok({ erased: true });
});
