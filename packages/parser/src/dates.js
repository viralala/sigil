// Date and date-range reader for resume lines. No lookbehind (older Safari) and no nested quantifiers (ReDoS).
// Output dates are 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD'; the open end of a range is the literal 'present'.
// Numeric day/month dates are read the Indian way (DD/MM/YYYY) unless the numbers can only mean MM/DD.

const MON = 'january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec';
const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
const YEAR = '((?:19|20)\\d{2})';

const monthNum = (s) => MONTHS[s.slice(0, 3).toLowerCase()] || 0;
const yy = (s) => { const n = Number(s); return n <= 69 ? 2000 + n : 1900 + n; };
const dayOk = (d) => d >= 1 && d <= 31;

// Each pattern: [regex, builder]. The first group is a one-character boundary (start of line or a non-digit/letter) so
// we never match inside a longer number or word without needing lookbehind.
const PATTERNS = [
  // 2021-06-15
  [new RegExp('(^|[^\\d])' + YEAR + '[/.\\-](0?[1-9]|1[0-2])[/.\\-](0?[1-9]|[12]\\d|3[01])(?!\\d)', 'g'),
    (m) => ({ type: 'ymd', y: +m[2], m: +m[3], d: +m[4] })],
  // 15/06/2021 (Indian default DD/MM)
  [new RegExp('(^|[^\\d])(\\d{1,2})[/.\\-](\\d{1,2})[/.\\-]' + YEAR + '(?!\\d)', 'g'),
    (m) => {
      let a = +m[2], b = +m[3];
      let d = a, mo = b;
      if (a <= 12 && b > 12) { mo = a; d = b; }
      if (mo < 1 || mo > 12 || !dayOk(d)) return null;
      return { type: 'ymd', y: +m[4], m: mo, d };
    }],
  // 15 June 2021, 15th Jun, 2021, 15 Jun '21
  [new RegExp('(^|[^\\d\\w\'’])(\\d{1,2})(?:st|nd|rd|th)?[\\s,.\\-]{1,3}(' + MON + ')(?![a-z])\\.?[\\s,.\\-]{0,3}(?:[\'’]\\s?(\\d{2})(?!\\d)|' + YEAR + '(?!\\d))', 'gi'),
    (m) => (dayOk(+m[2]) ? { type: 'ymd', y: m[5] ? +m[5] : yy(m[4]), m: monthNum(m[3]), d: +m[2] } : null)],
  // June 15, 2021
  [new RegExp('(^|[^a-z])(' + MON + ')(?![a-z])\\.?\\s{0,2}(\\d{1,2})(?:st|nd|rd|th)?\\s{0,2},\\s{0,2}' + YEAR + '(?!\\d)', 'gi'),
    (m) => (dayOk(+m[3]) ? { type: 'ymd', y: +m[4], m: monthNum(m[2]), d: +m[3] } : null)],
  // June 2021, Jun'21, Jun '21, June, 2021
  [new RegExp('(^|[^a-z])(' + MON + ')(?![a-z])\\.?[\\s,.\\-]{0,3}(?:[\'’]\\s?(\\d{2})(?!\\d)|' + YEAR + '(?!\\d))', 'gi'),
    (m) => ({ type: 'ym', y: m[4] ? +m[4] : yy(m[3]), m: monthNum(m[2]) })],
  // 2019-20 / 2019 - 2020 style academic ranges are handled below as a special case (needs the next-year check)
  [new RegExp('(^|[^\\d])' + YEAR + '\\s{0,2}[\\-–—/]\\s{0,2}(\\d{2})(?!\\d)', 'g'),
    (m) => {
      const a = +m[2] % 100, b = +m[3];
      const diff = (b - a + 100) % 100;
      if (diff < 1 || diff > 8 || (b <= 12 && b <= a && diff > 1)) return null; // "2021-06" is June 2021, "2020-24" is a range
      return { type: 'acad', y: +m[2], y2: +m[2] + diff };
    }],
  // 2021-06 / 2021/06
  [new RegExp('(^|[^\\d])' + YEAR + '[/.\\-](0?[1-9]|1[0-2])(?!\\d)', 'g'),
    (m) => ({ type: 'ym', y: +m[2], m: +m[3] })],
  // 06/2021
  [new RegExp('(^|[^\\d/.\\-])(0?[1-9]|1[0-2])[/.\\-]' + YEAR + '(?!\\d)', 'g'),
    (m) => ({ type: 'ym', y: +m[3], m: +m[2] })],
  // 2021
  [new RegExp('(^|[^\\d.$#])' + YEAR + '(?![\\d%])', 'g'),
    (m) => ({ type: 'y', y: +m[2] })],
  // present, current, till date ...
  [/(^|[^a-z])(present|currently|current|ongoing|till\s+date|to\s+date|till\s+now|continuing|now|today)(?![a-z])/gi,
    () => ({ type: 'present' })],
  // month with no year (only usable as the start of "Jun - Aug 2021")
  [new RegExp('(^|[^a-z])(' + MON + ')(?![a-z])', 'gi'),
    (m) => ({ type: 'mon', m: monthNum(m[2]) })],
];

const RANGE_SEP = /^\s{0,3}(?:[-–—~]+|to|until|till|through|thru|upto|up\s+to|\/)\s{0,3}$/i;
const LEAD_WORD = /(?:expected|anticipated|graduating|batch\s+of|since|from|duration|w\.e\.f\.?)\s{0,3}[:\-]?\s{0,3}\(?$/i;

function find(line) {
  const taken = [];
  const atoms = [];
  for (const [re, build] of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (m[0].length === 0) { re.lastIndex++; continue; }
      const start = m.index + m[1].length;
      const end = m.index + m[0].length;
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      const a = build(m);
      if (!a) continue;
      a.start = start; a.end = end;
      taken.push([start, end]);
      atoms.push(a);
      if (atoms.length > 24) break;
    }
  }
  atoms.sort((a, b) => a.start - b.start);
  return atoms;
}

const pad = (n) => String(n).padStart(2, '0');
function fmt(a) {
  if (a.type === 'present') return 'present';
  if (a.type === 'ymd') return a.y + '-' + pad(a.m) + '-' + pad(a.d);
  if (a.type === 'ym') return a.y + '-' + pad(a.m);
  return String(a.y);
}

/**
 * Read the first date or date range on a line.
 * @returns {null | {from: string|null, to: string|null, start: number, end: number, range: boolean}}
 *   `start`/`end` are the character span in `line` (so callers can cut it out).
 */
export function readDates(line) {
  const s = String(line).slice(0, 1500);
  const atoms = find(s);
  if (!atoms.length) return null;
  for (let i = 0; i < atoms.length; i++) {
    const a = atoms[i];
    if (a.type === 'acad') {
      return withLead(s, { from: String(a.y), to: String(a.y2), start: a.start, end: a.end, range: true });
    }
    const b = atoms[i + 1];
    if (b && a.type !== 'present' && b.type !== 'acad' && (RANGE_SEP.test(s.slice(a.end, b.start)) || (b.type === 'present' && /^\s{0,3}$/.test(s.slice(a.end, b.start))))) {
      if (a.type === 'mon') {
        if (b.type === 'ym' || b.type === 'ymd') {
          const y = a.m > b.m ? b.y - 1 : b.y;
          return withLead(s, { from: y + '-' + pad(a.m), to: fmt(b), start: a.start, end: b.end, range: true });
        }
        continue;
      }
      if (b.type === 'mon') continue;
      return withLead(s, { from: fmt(a), to: fmt(b), start: a.start, end: b.end, range: true });
    }
    if (a.type === 'mon' || a.type === 'present') continue;
    return withLead(s, { from: fmt(a), to: null, start: a.start, end: a.end, range: false });
  }
  return null;
}

function withLead(s, r) {
  const m = LEAD_WORD.exec(s.slice(Math.max(0, r.start - 24), r.start));
  if (m) r.start = r.start - m[0].length;
  // swallow one opening bracket before and one closing bracket after
  if (/[([]\s{0,2}$/.test(s.slice(Math.max(0, r.start - 3), r.start))) r.start = s.slice(0, r.start).search(/[([]\s{0,2}$/);
  if (/^\s{0,2}[)\]]/.test(s.slice(r.end, r.end + 3))) r.end = r.end + s.slice(r.end, r.end + 3).search(/[)\]]/) + 1;
  return r;
}

/** Months since year 0 for ordering. `kind` 'start' takes Jan for a bare year; 'end' takes Jan too (lenient: only clear overlaps are flagged). */
export function monthIndex(date) {
  if (date === 'present') return Infinity;
  const m = /^(\d{4})(?:-(\d{2}))?/.exec(date || '');
  if (!m) return null;
  return +m[1] * 12 + (m[2] ? +m[2] - 1 : 0);
}
