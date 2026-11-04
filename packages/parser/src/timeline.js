// Timeline hints for the holder. Same sweep-line idea as packages/core/src/sigil.js (timelineFlags), applied to
// parsed claims. A flag is a question for the holder ("did these two jobs really overlap?"), never a verdict.
import { monthIndex } from './dates.js';
import { NOT_FULL_TIME } from './lexicon.js';

/**
 * Flags overlapping full-time jobs and end-before-start dates.
 * Interns, trainees, part-time, freelance and volunteer roles may overlap with others, so they are not flagged.
 * Dates are compared by month. A job that ends in month M and another that starts in month M do not overlap.
 * A bare year end ("2022") is read as January of that year so only clear overlaps are flagged.
 * A job with no end date is skipped (we cannot tell when it stopped); 'present' is open-ended.
 */
export function timelineFlags(claims) {
  const flags = [];
  if (!Array.isArray(claims)) return flags;
  const items = [];
  for (const c of claims) {
    if (!c || c.kind !== 'job' || typeof c.from !== 'string') continue;
    const start = monthIndex(c.from);
    if (start === null) continue;
    if (typeof c.to !== 'string') continue;
    const end = monthIndex(c.to);
    if (end === null) continue;
    if (end < start) { flags.push({ type: 'END_BEFORE_START', a: String(c.id) }); continue; }
    const exclusive = !NOT_FULL_TIME.test(`${c.title} ${c.source || ''}`);
    items.push({ id: String(c.id), start, end, exclusive });
  }
  const ev = [];
  for (const x of items) { ev.push({ t: x.start, d: 1, x }); ev.push({ t: x.end, d: -1, x }); }
  ev.sort((p, q) => (p.t === q.t ? p.d - q.d : p.t < q.t ? -1 : 1));
  const active = new Set();
  for (const { d, x } of ev) {
    if (d === 1) {
      for (const o of active) if (o.exclusive && x.exclusive) flags.push({ type: 'OVERLAP', a: o.id, b: x.id });
      active.add(x);
    } else active.delete(x);
  }
  return flags;
}
