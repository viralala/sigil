import { verifyJSON } from "@sigil/core";
import { db } from "@/lib/server/db";
import { spendChallenge, startSession } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { signPub?: string; ecdhPub?: string; challenge?: string; sig?: string };
const short = (s: unknown): s is string => typeof s === "string" && s.length > 0 && s.length < 2000;

/** A holder proves their device key by signing a one-time challenge. No password, no email. */
export const POST = route("login", 30, async (req) => {
  const b = await readJson<Body>(req, 8000);
  if (!b || !short(b.signPub) || !short(b.ecdhPub) || !short(b.challenge) || !short(b.sig)) return fail("BAD_INPUT", 400);
  if (!verifyJSON({ challenge: b.challenge }, b.sig, b.signPub)) return fail("BAD_SIGNATURE", 401);
  if (!(await spendChallenge(b.challenge))) return fail("BAD_CHALLENGE", 401);
  const [w] = await db()<{ id: string }[]>`
    insert into wallets (sign_pub, ecdh_pub) values (${b.signPub}, ${b.ecdhPub})
    on conflict (sign_pub) do update set ecdh_pub = excluded.ecdh_pub returning id`;
  await startSession("wallet", w.id);
  return ok({ id: w.id });
});
