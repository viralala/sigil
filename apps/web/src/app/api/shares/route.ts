import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { id?: string; ciphertext?: string; shown?: string[]; days?: number };

/** Stores an encrypted share. We cannot read it: the key stays in the link fragment. */
export const POST = route("share", 30, async (req) => {
  const wallet = await sessionOf("wallet");
  if (!wallet) return fail("NOT_SIGNED_IN", 401);
  const b = await readJson<Body>(req, 1_500_000);
  const days = Number(b?.days);
  if (!b?.id || !/^sh_[a-z0-9]{16}$/.test(b.id) || typeof b.ciphertext !== "string" || !Array.isArray(b.shown) || !(days >= 1 && days <= 90))
    return fail("BAD_INPUT", 400);
  const shown = b.shown.filter((s) => typeof s === "string").slice(0, 60).map((s) => s.slice(0, 40));
  const expires = new Date(Date.now() + days * 864e5);
  await db()`insert into shares (id, wallet_id, ciphertext, shown, expires_at) values (${b.id}, ${wallet}, ${b.ciphertext}, ${shown}, ${expires})`;
  await audit(`wallet:${wallet}`, "share.created", b.id);
  return ok({ id: b.id, expiresAt: expires });
});
