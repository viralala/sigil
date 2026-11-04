// Field accuracy of parseResume on the INVENTED fixtures in packages/parser/test/fixtures/resumes.js.
// Run: node bench/ml/claims/eval_parser.mjs [--verbose]   (writes bench/ml/claims/parser_results.json)
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseResume } from '../../../packages/parser/src/index.js';
import { RESUMES } from '../../../packages/parser/test/fixtures/resumes.js';

const here = dirname(fileURLToPath(import.meta.url));
const verbose = process.argv.includes('--verbose');
const norm = (s) => (s == null ? null : String(s).replace(/\s+/g, ' ').trim().toLowerCase());
const FIELDS = ['kind', 'title', 'org', 'from', 'to'];

// A predicted claim is matched to an expected claim when kind and title agree (case/space-insensitive).
let nExp = 0, nPred = 0, nMatch = 0, nExact = 0;
const fieldHits = Object.fromEntries(FIELDS.map((f) => [f, 0]));
const perKind = {};
const perResume = [];

for (const r of RESUMES) {
  const { claims } = parseResume(r.text);
  const used = new Set();
  let match = 0, exact = 0;
  for (const exp of r.expected) {
    nExp++;
    perKind[exp.kind] ??= { expected: 0, found: 0, exact: 0, predicted: 0 };
    perKind[exp.kind].expected++;
    const i = claims.findIndex((c, k) => !used.has(k) && c.kind === exp.kind && norm(c.title) === norm(exp.title));
    if (i < 0) { if (verbose) console.log(`  MISS [${r.name}]`, JSON.stringify(exp)); continue; }
    used.add(i);
    match++; nMatch++; perKind[exp.kind].found++;
    const got = claims[i];
    let all = true;
    for (const f of FIELDS) {
      const ok = norm(got[f]) === norm(exp[f]);
      if (ok) fieldHits[f]++; else { all = false; if (verbose) console.log(`  DIFF [${r.name}] ${f}: expected ${JSON.stringify(exp[f])} got ${JSON.stringify(got[f])}`); }
    }
    if (all) { exact++; nExact++; perKind[exp.kind].exact++; }
  }
  nPred += claims.length;
  for (const [k, c] of claims.entries()) {
    perKind[c.kind] ??= { expected: 0, found: 0, exact: 0, predicted: 0 };
    perKind[c.kind].predicted++;
    if (!used.has(k) && verbose) console.log(`  EXTRA [${r.name}]`, JSON.stringify({ kind: c.kind, title: c.title, org: c.org }));
  }
  perResume.push({ name: r.name, layout: r.layout, hard: !!r.hard, expected: r.expected.length, predicted: claims.length, matched: match, exact });
}

const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : null);
const out = {
  note: 'INVENTED resumes only (packages/parser/test/fixtures/resumes.js). Small and written by the same team as the parser, so treat as a smoke test, not a benchmark.',
  resumes: RESUMES.length,
  claims_expected: nExp, claims_predicted: nPred, claims_matched_on_kind_and_title: nMatch,
  recall_pct: pct(nMatch, nExp), precision_pct: pct(nMatch, nPred),
  all_five_fields_exact_pct_of_expected: pct(nExact, nExp),
  field_accuracy_pct_among_matched: Object.fromEntries(FIELDS.map((f) => [f, pct(fieldHits[f], nMatch)])),
  per_kind: Object.fromEntries(Object.entries(perKind).map(([k, v]) => [k, { ...v, recall_pct: pct(v.found, v.expected), precision_pct: pct(v.found, v.predicted) }])),
  per_resume: perResume,
};
writeFileSync(join(here, 'parser_results.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ ...out, per_resume: undefined, per_kind: undefined }, null, 1));
if (verbose) console.table(perResume);
