// Seeds the registry: org keys, status lists, and the 2-of-3 signed trust list.
// Run: node scripts/seed.mjs <secrets.json> <private-out.json>
// Root private keys are written only to the private file (offline trustees), never to the server env.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";
import { newKey, keyToJwk, keyFromJwk, signTrustList } from "@sigil/core";

const [secretsPath, outPath] = process.argv.slice(2);
const s = JSON.parse(readFileSync(secretsPath, "utf8"));
const master = Buffer.from(s.SIGIL_MASTER_KEY, "base64url");
const sql = postgres(s.SIGIL_DB_URL, { prepare: false, max: 1, ssl: "require" });

const wrap = (key) => {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", master, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(keyToJwk(key))), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
};
const hashCode = (code) => {
  const salt = randomBytes(16);
  return `${salt.toString("base64url")}.${scryptSync(code, salt, 32).toString("base64url")}`;
};

const prior = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : {};
const cesacCode = prior.cesacCode ?? "CESAC-" + randomBytes(9).toString("base64url");
const roots = (prior.roots ?? [keyToJwk(newKey()), keyToJwk(newKey()), keyToJwk(newKey())]).map(keyFromJwk);

const DAY = 864e5;
const ORGS = [
  { id: "did:web:deccan-tech.sample", slug: "deccan", name: "Sample Deccan Institute of Technology", kind: "college", tier: "B", code: "DECCAN-DEMO-2026", sample: true },
  { id: "did:web:kestrel.sample", slug: "kestrel", name: "Sample Kestrel Systems", kind: "employer", tier: "B", code: "KESTREL-DEMO-2026", sample: true },
  { id: "did:web:indigo-labs.sample", slug: "indigo", name: "Sample Indigo Labs", kind: "employer", tier: "B", code: "INDIGO-DEMO-2026", sample: true },
  { id: "did:web:konkan-college.sample", slug: "konkan", name: "Sample Konkan College of Engineering", kind: "college", tier: "B", state: "closed", sinceDays: 400, custodian: "Sample Western University (records office)", sample: true },
  { id: "did:web:sahyadri-poly.sample", slug: "sahyadri", name: "Sample Sahyadri Polytechnic", kind: "college", tier: "B", state: "derecognised", sinceDays: 300, sample: true },
  { id: "did:web:global-open-univ.sample", slug: "global-open", name: "Sample Global Open University of Excellence", kind: "college", tier: "C", state: "fake", sample: true },
  { id: "did:web:cesac.in", slug: "cesac", name: "CESAC, Computer Engineering, VIT Pune", kind: "committee", tier: "B", code: cesacCode, domain: "cesac.in", sample: false },
];

const entries = [];
for (const o of ORGS) {
  const [row] = await sql`select public_key from orgs where id = ${o.id}`;
  let pub = row?.public_key;
  const since = o.sinceDays ? new Date(Date.now() - o.sinceDays * DAY) : null;
  if (!row) {
    const key = newKey();
    pub = key.pub;
    await sql`insert into orgs (id, slug, name, kind, domain, tier, state, state_since, custodian, public_key, enc_private_key, access_code_hash, sample)
      values (${o.id}, ${o.slug}, ${o.name}, ${o.kind}, ${o.domain ?? null}, ${o.tier}, ${o.state ?? "active"}, ${since}, ${o.custodian ?? null}, ${pub}, ${wrap(key)}, ${o.code ? hashCode(o.code) : null}, ${o.sample})`;
    await sql`insert into status_lists (org_id, bits) values (${o.id}, ${Buffer.alloc(131072 / 8)})`;
  }
  const e = { id: o.id, pub, tier: o.tier, state: o.state ?? "active" };
  if (o.state === "closed") Object.assign(e, { closedAt: since.getTime(), manifest: [], custodian: o.custodian, finalStatusVersion: 1 });
  if (o.state === "derecognised") e.since = since.getTime();
  entries.push(e);
}

const version = (prior.version ?? 0) + 1;
const list = signTrustList(entries, [roots[0], roots[1]], version);
await sql`insert into trust_list (id, list) values (1, ${sql.json(list)})
  on conflict (id) do update set list = excluded.list, updated_at = now()`;

writeFileSync(outPath, JSON.stringify({ cesacCode, version, roots: roots.map(keyToJwk), rootPubs: roots.map((r) => r.pub) }, null, 2));
console.log("seeded", ORGS.length, "orgs, trust list v" + version);
await sql.end();
