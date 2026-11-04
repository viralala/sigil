import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Public: the ciphertext, unless the holder stopped sharing or the link expired. */
export const GET = route("share-read", 120, async (_req, { params }: Ctx) => {
  const { id } = await params;
  const [s] = await db()`select ciphertext, expires_at, stopped_at from shares where id = ${id}`;
  if (!s) return fail("NOT_FOUND", 404);
  if (s.stopped_at) return fail("STOPPED", 410);
  if (new Date(s.expires_at) < new Date()) return fail("EXPIRED", 410);
  return ok({ ciphertext: s.ciphertext, expiresAt: s.expires_at });
});

/** "Stop sharing": the link dies at once. */
export const DELETE = route("share-stop", 30, async (_req, { params }: Ctx) => {
  const wallet = await sessionOf("wallet");
  if (!wallet) return fail("NOT_SIGNED_IN", 401);
  const { id } = await params;
  const r = await db()`update shares set stopped_at = now(), ciphertext = '' where id = ${id} and wallet_id = ${wallet} returning id`;
  if (!r.length) return fail("NOT_FOUND", 404);
  await audit(`wallet:${wallet}`, "share.stopped", id);
  return ok({ stopped: true });
});
