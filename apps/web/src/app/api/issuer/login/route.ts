import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { checkCode, startSession } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route("issuer-login", 10, async (req) => {
  const b = await readJson<{ slug?: string; code?: string }>(req, 1000);
  if (!b?.slug || !b.code) return fail("BAD_INPUT", 400);
  const [o] = await db()`select id, access_code_hash from orgs where slug = ${b.slug}`;
  if (!o || !checkCode(b.code, o.access_code_hash)) return fail("BAD_CODE", 401);
  await startSession("issuer", o.id);
  await audit(`org:${o.id}`, "issuer.login", null);
  return ok({ id: o.id });
});
