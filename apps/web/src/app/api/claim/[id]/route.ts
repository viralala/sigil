import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const UUID = /^[0-9a-f-]{36}$/;

/** Bulk claim link: fetch the ciphertext (useless without the key in the fragment). */
export const GET = route("claim-read", 60, async (_req, { params }: Ctx) => {
  const { id } = await params;
  if (!UUID.test(id)) return fail("NOT_FOUND", 404);
  const [s] = await db()`select s.ciphertext, s.wallet_id, o.name as org_name from seals s join orgs o on o.id = s.org_id where s.id = ${id}`;
  if (!s) return fail("NOT_FOUND", 404);
  if (s.wallet_id) return fail("ALREADY_CLAIMED", 409);
  return ok({ ciphertext: s.ciphertext, orgName: s.org_name });
});

/** Binds the Seal to this wallet so a claim link works only once. */
export const POST = route("claim", 30, async (_req, { params }: Ctx) => {
  const wallet = await sessionOf("wallet");
  if (!wallet) return fail("NOT_SIGNED_IN", 401);
  const { id } = await params;
  if (!UUID.test(id)) return fail("NOT_FOUND", 404);
  const r = await db()`update seals set wallet_id = ${wallet} where id = ${id} and wallet_id is null returning id`;
  if (!r.length) return fail("ALREADY_CLAIMED", 409);
  await audit(`wallet:${wallet}`, "seal.claimed", id);
  return ok({ claimed: true });
});
