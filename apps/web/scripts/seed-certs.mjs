// Loads CESAC certificate fingerprints into cert_index. Input is the private index ([{sha256, code, kind}]):
// hashes and reference codes only, no names. Run: node scripts/seed-certs.mjs <secrets.json> <index.json>
import { readFileSync } from "node:fs";
import postgres from "postgres";

const [secretsPath, indexPath] = process.argv.slice(2);
const s = JSON.parse(readFileSync(secretsPath, "utf8"));
const rows = JSON.parse(readFileSync(indexPath, "utf8"));
const bad = rows.filter((r) => !/^[0-9a-f]{64}$/.test(r.sha256) || (r.code && !/^CESAC-\d{4}-\d{5}$/.test(r.code)));
if (bad.length) throw new Error(`${bad.length} rows are not hash + code only; refusing`);

const sql = postgres(s.SIGIL_DB_URL, { prepare: false, max: 1, ssl: "require" });
const org = "did:web:cesac.in";
for (let i = 0; i < rows.length; i += 200) {
  const part = rows.slice(i, i + 200).map((r) => ({ sha256: r.sha256, org_id: org, code: r.code ?? null, kind: r.kind }));
  await sql`insert into cert_index ${sql(part, "sha256", "org_id", "code", "kind")} on conflict (sha256) do nothing`;
}
const [{ n }] = await sql`select count(*)::int as n from cert_index`;
console.log("fingerprints on file:", n);
await sql.end();
