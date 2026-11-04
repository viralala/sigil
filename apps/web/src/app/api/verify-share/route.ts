import { verdictOf, type TrustList } from "@sigil/core";
import { db } from "@/lib/server/db";
import { getOrg, statusListFor, trustList, verifierFor } from "@/lib/server/trust";
import { viewerTag } from "@/lib/server/session";
import { fail, ok, readJson, route } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Presentation = { cred?: { header?: { iss?: string; iat?: number; kind?: string; kid?: string } } };
type Body = { shareId?: string; presentations?: Presentation[]; minTier?: string; repeat?: boolean };

async function checkOne(p: Presentation, nonce: string, trust: TrustList, minTier: string) {
  const iss = p?.cred?.header?.iss;
  const org = typeof iss === "string" ? await getOrg(iss) : null;
  const known = org && trust.body.entries.some((e) => e.id === org.id);
  // Unknown signer: run the verifier anyway so the reason code comes from the same place.
  const statusList = org ? await statusListFor(org) : { body: { id: "", version: 0, issuedAt: 0, bits: "" }, sig: "" };
  let r;
  try {
    r = verifierFor(minTier).check(p, { nonce, trustList: trust, statusList });
  } catch {
    r = { ok: false, reasons: ["CREDENTIAL_SIGNATURE_INVALID"], warnings: [] as string[], claims: {}, custodian: null, statusAgeMs: undefined };
  }
  return {
    verdict: verdictOf(r),
    kind: p?.cred?.header?.kind ?? "other",
    claims: r.ok ? r.claims : {},
    reasons: r.reasons,
    warnings: r.warnings,
    custodian: r.custodian ?? null,
    issuer: org && known ? { id: org.id, name: org.name, kind: org.kind, state: org.state, tier: org.tier, sample: org.sample } : null,
    // Witness rule: only a passing check names a witness. Keys are held for the org, so this is W3, not W1.
    witness: r.ok && org ? { level: "W3", how: "console-confirmed", who: org.name, when: new Date(p.cred!.header!.iat!).toISOString() } : null,
    details: { alg: "ES256", kid: p?.cred?.header?.kid ?? "-", statusAgeMs: r.statusAgeMs ?? null, trustListVersion: trust.body.version },
  };
}

/** Checks every proof in a share and writes a consent receipt. Values are checked, then forgotten. */
export const POST = route("verify-share", 40, async (req) => {
  const b = await readJson<Body>(req, 1_500_000);
  if (!b?.shareId || !Array.isArray(b.presentations) || b.presentations.length > 40) return fail("BAD_INPUT", 400);
  const sql = db();
  const [share] = await sql`select id, expires_at, stopped_at from shares where id = ${b.shareId}`;
  if (!share) return fail("NOT_FOUND", 404);
  if (share.stopped_at) return fail("STOPPED", 410);
  if (new Date(share.expires_at) < new Date()) return fail("EXPIRED", 410);
  const minTier = ["A", "B", "C"].includes(b.minTier ?? "") ? b.minTier! : "B";
  const trust = await trustList();
  const results = [];
  for (const p of b.presentations) results.push(await checkOne(p, b.shareId, trust, minTier));
  const worst = results.some((r) => r.verdict === "red") ? "red" : results.some((r) => r.verdict === "yellow") || !results.length ? "yellow" : "green";
  if (!b.repeat) await sql`insert into receipts (share_id, verdict, viewer) values (${b.shareId}, ${worst}, ${viewerTag(req)})`;
  return ok({ verdict: worst, results, checkedAt: new Date().toISOString() });
});
