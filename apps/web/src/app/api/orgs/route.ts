import { db } from "@/lib/server/db";
import { ok, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public registry view: no codes, no private material. */
export const GET = route("orgs", 120, async () => {
  const orgs = await db()`select id, slug, name, kind, tier, state, state_since, custodian, sample, public_key,
    (access_code_hash is not null) as can_confirm from orgs order by sample, name`;
  return ok({ orgs });
});
