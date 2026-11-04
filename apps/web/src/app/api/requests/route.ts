import { db } from "@/lib/server/db";
import { audit } from "@/lib/server/trust";
import { sessionOf } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { orgId?: string; kind?: string; fields?: Record<string, unknown> };
const KINDS = ["education", "job", "certificate", "skill", "publication", "patent", "award", "event", "other"];

/** The holder asks an org to confirm a claim. The fields live here only until the org decides. */
export const POST = route("request", 20, async (req) => {
  const id = await sessionOf("wallet");
  if (!id) return fail("NOT_SIGNED_IN", 401);
  const b = await readJson<Body>(req, 4000);
  if (!b?.orgId || !b.kind || !KINDS.includes(b.kind) || !b.fields) return fail("BAD_INPUT", 400);
  const fields: Record<string, string> = {};
  for (const k of ["name", "title", "from", "to"]) {
    const v = b.fields[k];
    if (typeof v === "string" && v.trim()) fields[k] = v.trim().slice(0, 120);
  }
  if (!fields.name || !fields.title) return fail("BAD_INPUT", 400);
  const sql = db();
  const [org] = await sql`select id, state from orgs where id = ${b.orgId} and access_code_hash is not null`;
  if (!org) return fail("ORG_CANNOT_CONFIRM", 400);
  if (org.state !== "active") return fail("ORG_NOT_ACTIVE", 400);
  const [{ n }] = await sql`select count(*)::int as n from requests where wallet_id = ${id} and state = 'pending'`;
  if (n >= 30) return fail("TOO_MANY", 429);
  const [r] = await sql`insert into requests (wallet_id, org_id, kind, fields)
    values (${id}, ${b.orgId}, ${b.kind}, ${sql.json(fields)}) returning id`;
  await audit(`wallet:${id}`, "request.created", String(r.id));
  return ok({ id: r.id });
});
