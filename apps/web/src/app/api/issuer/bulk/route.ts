import { secretBox } from "@/lib/sealbox";
import { db } from "@/lib/server/db";
import { audit, freshHolderKey, getOrg, nextIndexes, signCredential } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = { name?: string; title?: string; year?: string; ref?: string };

/** Bulk issue from CSV rows. Each Seal is sealed with a one-off key that only the claim link carries. */
export const POST = route("bulk", 10, async (req) => {
  const orgId = await sessionOf("issuer");
  if (!orgId) return fail("NOT_SIGNED_IN", 401);
  const b = await readJson<{ rows?: Row[] }>(req, 500_000);
  if (!b || !Array.isArray(b.rows) || b.rows.length === 0 || b.rows.length > 500) return fail("BAD_INPUT", 400);
  const good: { i: number; row: Row & { name: string; title: string } }[] = [];
  const bad: { line: number; problem: string }[] = [];
  b.rows.forEach((row, i) => {
    const name = String(row.name ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (name.length < 2 || name.length > 80) bad.push({ line: i + 1, problem: "name" });
    else if (title.length < 2 || title.length > 120) bad.push({ line: i + 1, problem: "title" });
    else good.push({ i, row: { ...row, name, title } });
  });
  if (!good.length) return ok({ issued: [], bad });

  const org = (await getOrg(orgId))!;
  const idx = await nextIndexes(orgId, good.length);
  const sql = db();
  const issued: { line: number; ref: string | null; id: string; key: string }[] = [];
  for (let n = 0; n < good.length; n++) {
    const { row, i } = good[n];
    const holder = freshHolderKey();
    const fields: Record<string, string> = { name: row.name, title: row.title };
    if (row.year) fields.year = String(row.year).slice(0, 10);
    const { packed, headerId } = signCredential(org, holder.pub, idx[n], "certificate", fields);
    const { box, key } = await secretBox({ credential: packed, holderJwk: holder.jwk });
    const ref = row.ref ? String(row.ref).slice(0, 40) : null;
    const [s] = await sql`insert into seals (org_id, kind, status_idx, header_id, ciphertext, label)
      values (${orgId}, ${"certificate"}, ${idx[n]}, ${headerId}, ${box}, ${ref ?? "bulk"}) returning id`;
    issued.push({ line: i + 1, ref, id: String(s.id), key });
  }
  await audit(`org:${orgId}`, "seal.bulk", String(good.length));
  return ok({ issued, bad });
});
