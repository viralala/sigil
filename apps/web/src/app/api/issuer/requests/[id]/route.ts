import { sealTo } from "@/lib/sealbox";
import { db } from "@/lib/server/db";
import { audit, getOrg, nextIndexes, signCredential } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** The registrar tap. Yes signs a Seal encrypted to the holder. Either way the claim text is wiped. */
export const POST = route("decide", 60, async (req, { params }: Ctx) => {
  const orgId = await sessionOf("issuer");
  if (!orgId) return fail("NOT_SIGNED_IN", 401);
  const { id } = await params;
  const b = await readJson<{ decision?: string }>(req, 200);
  if (b?.decision !== "yes" && b?.decision !== "no") return fail("BAD_INPUT", 400);
  const sql = db();
  const [r] = await sql`select r.id, r.kind, r.fields, r.wallet_id, w.sign_pub, w.ecdh_pub
    from requests r join wallets w on w.id = r.wallet_id
    where r.id = ${id} and r.org_id = ${orgId} and r.state = 'pending'`;
  if (!r) return fail("NOT_FOUND", 404);

  if (b.decision === "no") {
    await sql`update requests set state = 'declined', fields = null, decided_at = now() where id = ${id}`;
    await audit(`org:${orgId}`, "request.declined", id);
    return ok({ state: "declined" });
  }

  const org = (await getOrg(orgId))!;
  const [idx] = await nextIndexes(orgId, 1);
  const { packed, headerId } = signCredential(org, r.sign_pub, idx, r.kind, r.fields);
  const ciphertext = await sealTo(r.ecdh_pub, packed);
  await sql.begin(async (tx) => {
    await tx`insert into seals (wallet_id, org_id, request_id, kind, status_idx, header_id, ciphertext, label)
      values (${r.wallet_id}, ${orgId}, ${id}, ${r.kind}, ${idx}, ${headerId}, ${ciphertext}, ${"request"})`;
    await tx`update requests set state = 'approved', fields = null, decided_at = now() where id = ${id}`;
  });
  await audit(`org:${orgId}`, "seal.issued", id);
  return ok({ state: "approved" });
});
