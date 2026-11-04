import { db } from "@/lib/server/db";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Does this exact file match a fingerprint an org registered? The file itself never reaches us. */
export const POST = route("paper-hash", 60, async (req) => {
  const b = await readJson<{ sha256?: string }>(req, 300);
  if (!b?.sha256 || !/^[0-9a-f]{64}$/.test(b.sha256)) return fail("BAD_INPUT", 400);
  const [m] = await db()`select c.code, c.kind, c.added_at, o.name as org_name from cert_index c join orgs o on o.id = c.org_id where c.sha256 = ${b.sha256}`;
  return ok(m ? { match: true, code: m.code, kind: m.kind, orgName: m.org_name, addedAt: m.added_at } : { match: false });
});
