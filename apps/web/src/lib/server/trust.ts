import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import {
  headerId,
  issue,
  keyFromJwk,
  newKey,
  keyToJwk,
  packCredential,
  signJSON,
  Verifier,
  type Key,
  type TrustList,
} from "@sigil/core";
import { db } from "./db";

export const STATUS_BITS = 131072; // herd privacy size from docs/research/standards.md
const MAX_STATUS_AGE = 864e5;

// ---- org keys, encrypted at rest under SIGIL_MASTER_KEY ----
function master() {
  const k = process.env.SIGIL_MASTER_KEY;
  if (!k) throw new Error("SIGIL_MASTER_KEY missing");
  return Buffer.from(k, "base64url");
}
export function wrapPrivate(key: Key) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", master(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(keyToJwk(key))), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}
function unwrapPrivate(s: string): Key {
  const [iv, tag, ct] = s.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", master(), iv);
  d.setAuthTag(tag);
  return keyFromJwk(JSON.parse(Buffer.concat([d.update(ct), d.final()]).toString()));
}

export type Org = {
  id: string;
  slug: string;
  name: string;
  kind: "college" | "employer" | "committee";
  tier: string;
  state: string;
  custodian: string | null;
  sample: boolean;
  public_key: string;
  enc_private_key: string;
  access_code_hash: string | null;
};

export async function getOrg(id: string): Promise<Org | null> {
  const r = await db()<Org[]>`select * from orgs where id = ${id}`;
  return r[0] ?? null;
}

// ---- status list: publish on demand, re-sign when stale ----
async function publish(org: Org, bits: Buffer, version: number) {
  const body = { id: org.id + "#status", version, issuedAt: Date.now(), bits: bits.toString("base64") };
  const signed = { body, sig: signJSON(body, unwrapPrivate(org.enc_private_key)) };
  await db()`update status_lists set published = ${db().json(signed)}, published_at = now() where org_id = ${org.id}`;
  return signed;
}

export async function statusListFor(org: Org) {
  const [row] = await db()<{ bits: Buffer; version: number; published: { body: { issuedAt: number; version: number } } | null }[]>`
    select bits, version, published from status_lists where org_id = ${org.id}`;
  if (!row) throw new Error("no status list");
  const fresh = row.published && row.published.body.version === row.version && Date.now() - row.published.body.issuedAt < MAX_STATUS_AGE / 2;
  return fresh ? row.published : publish(org, Buffer.from(row.bits), row.version);
}

export async function revokeIndex(org: Org, idx: number) {
  const sql = db();
  await sql.begin(async (tx) => {
    const [row] = await tx<{ bits: Buffer; version: number }[]>`select bits, version from status_lists where org_id = ${org.id} for update`;
    const bits = Buffer.from(row.bits);
    bits[idx >> 3] |= 1 << (idx & 7);
    await tx`update status_lists set bits = ${bits}, version = ${row.version + 1} where org_id = ${org.id}`;
  });
}

export async function nextIndexes(orgId: string, n: number): Promise<number[]> {
  const [row] = await db()<{ next_index: number }[]>`
    update status_lists set next_index = next_index + ${n} where org_id = ${orgId} returning next_index`;
  if (row.next_index > STATUS_BITS) throw new Error("status list full");
  return Array.from({ length: n }, (_, i) => row.next_index - n + i);
}

// ---- issuing ----
export function signCredential(org: Org, holderPub: string, statusIndex: number, kind: string, fields: Record<string, unknown>) {
  const issuerKey = unwrapPrivate(org.enc_private_key);
  const c = issue({ issuerKey, issuerId: org.id, holderPub, fields, statusIndex, statusListId: org.id + "#status", kind });
  return { packed: packCredential(c), headerId: headerId(c.header) };
}
export const freshHolderKey = () => {
  const k = newKey();
  return { pub: k.pub, jwk: keyToJwk(k) };
};

// ---- trust list + verifying a presentation ----
export async function trustList(): Promise<TrustList> {
  const [row] = await db()<{ list: TrustList }[]>`select list from trust_list where id = 1`;
  if (!row) throw new Error("trust list not seeded");
  return row.list;
}

export function verifierFor(minTier: string) {
  const rootPubs = (process.env.SIGIL_ROOT_PUBS ?? "").split(",").filter(Boolean);
  return new Verifier({ audience: "sigil-share", rootPubs, threshold: 2, minTier, maxStatusAgeMs: MAX_STATUS_AGE });
}

// ---- hash-chained audit log (no personal fields: actors are ids, targets are ids) ----
export async function audit(actor: string, action: string, target: string | null) {
  await db().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(71)`;
    const [last] = await tx<{ hash: string }[]>`select hash from audit_log order by seq desc limit 1`;
    const prev = last?.hash ?? "genesis";
    const hash = createHash("sha256").update(`${prev}|${actor}|${action}|${target ?? ""}`).digest("base64url");
    await tx`insert into audit_log (actor, action, target, prev_hash, hash) values (${actor}, ${action}, ${target}, ${prev}, ${hash})`;
  });
}
