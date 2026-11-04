// Resume text -> proposed claims. Pure rules + the on-device kind classifier.
// Rules of the road (docs/AI_MODELS.md, PROBLEMS_AND_SOLUTIONS.md section 0):
//  - The text is DATA. Nothing in it can change behaviour; lines that read like instructions are dropped and reported.
//  - Output objects have exactly the Claim fields. There is no verification state anywhere in this file.
//  - Every field is a piece of the input line(s) (whitespace collapsed), a normalised date, or the word "present".
//  - Never score, rank or judge a person. `confidence` is only "how sure the reader is that it read this line correctly".

import { readDates, monthIndex } from './dates.js';
import { classifyClaim } from './classify.js';
import { HEADINGS, BULLET, ROLE, ORG_SUFFIX, INSTITUTION, KNOWN_ORG, ORG_LIKE, isDegree, INJECTION } from './lexicon.js';

export const MAX_INPUT_BYTES = 200 * 1024;
const MAX_LINE = 3000;
const MAX_CLAIMS = 300;
const MAX_SKILLS = 100;
const MAX_TITLE = 200;

export class ResumeInputError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ResumeInputError';
    this.code = code;
  }
}

function checkInput(text) {
  if (typeof text !== 'string') throw new ResumeInputError('NOT_A_STRING', 'Resume text must be a string.');
  if (text.length > MAX_INPUT_BYTES) throw new ResumeInputError('TOO_LARGE', 'Resume text is larger than 200 KB.');
  if (text.length * 3 > MAX_INPUT_BYTES && new TextEncoder().encode(text).length > MAX_INPUT_BYTES) {
    throw new ResumeInputError('TOO_LARGE', 'Resume text is larger than 200 KB.');
  }
}

// ---------- small helpers ----------
const HIDDEN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f­​-‏‪-‮⁠-⁤⁦-⁩﻿￹-￻]/g;
const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const tidy = (s) => collapse(s).replace(/^[\s,;:|\-–—•·()[\]"'*#>]+/, '').replace(/[\s,;:|\-–—•·"'*#]+$/, '').replace(/\s*\($/, '');
const letters = (s) => (s.match(/\p{L}/gu) || []).length;
const words = (s) => (s.match(/\S+/g) || []).length;
const blank = (s, from, to) => s.slice(0, from) + ' '.repeat(to - from) + s.slice(to);
const round2 = (x) => Math.round(x * 100) / 100;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

function stripContact(body) {
  return body
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, (m) => ' '.repeat(m.length))
    .replace(/(?:https?:\/\/|www\.)\S+/g, (m) => ' '.repeat(m.length))
    .replace(/\b(?:linkedin|github|gitlab|twitter|instagram|facebook)\.com\S*/gi, (m) => ' '.repeat(m.length))
    .replace(/\+?\d[\d\s\-()]{8,16}\d/g, (m) => ((m.match(/\d/g) || []).length >= 10 ? ' '.repeat(m.length) : m));
}

function despace(s) {
  const toks = s.split(/\s+/);
  if (toks.length >= 4 && toks.filter((t) => t.length === 1).length / toks.length >= 0.75) {
    return s.split(/\s{2,}/).map((w) => w.replace(/\s/g, '')).join(' ');
  }
  return s;
}

function headingOf(t) {
  if (t.length > 48) return null;
  let s = t.replace(/^[\s#*_=~|•·\-–—>]+/, '').replace(/[\s:：#*_=~|•·\-–—]+$/, '');
  if (!s || s.length > 40 || /\d/.test(s)) return null;
  s = despace(s).toLowerCase().replace(/\s+/g, ' ');
  if (words(s) > 6) return null;
  for (const [key, re] of HEADINGS) if (re.test(s)) return key;
  return null;
}

/** Split a body into pieces with offsets. `comma` also splits on ", " and "; ". */
function pieces(body, comma, lineNo) {
  const re = comma
    ? /\s{2,}|\s*[|•·]\s*|\s[-–—]+\s|\s@\s|\s(?:at|by|from|via)\s(?=[A-Z0-9(])|\s*[,;]\s+|\s*[()]\s*|\t/g
    : /\s{2,}|\s*[|•·]\s*|\s[-–—]+\s|\s@\s|\s(?:at|by|from|via)\s(?=[A-Z0-9(])|:\s+|\s*[()]\s*|\t/g;
  const out = [];
  let last = 0;
  let m;
  const push = (a, b) => {
    const raw = body.slice(a, b);
    const lead = raw.length - raw.trimStart().length;
    const t = tidy(raw);
    if (t && letters(t) > 0) out.push({ text: t, start: a + lead, end: b - (raw.length - raw.trimEnd().length), line: lineNo });
  };
  while ((m = re.exec(body)) !== null && out.length < 14) {
    if (m[0].length === 0) { re.lastIndex++; continue; }
    push(last, m.index);
    last = m.index + m[0].length;
  }
  push(last, body.length);
  return out.slice(0, 14);
}

const PAGE_NOISE = /^(?:page\s{0,2}\d{1,3}(?:\s{0,2}(?:of|\/)\s{0,2}\d{1,3})?|\d{1,3}\s{0,2}\/\s{0,2}\d{1,3}|[-–—]\s{0,2}\d{1,3}\s{0,2}[-–—])$/i;
const SCORE = /\b(?:cgpa|gpa|sgpa|percentage|percent|grade|marks|score|aggregate|rank)\b|%|^\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?$/i;

// ---------- line preparation ----------
function prep(l) {
  const bullet = BULLET.test(l.t);
  let body = l.t.replace(BULLET, '');
  body = stripContact(body);
  const d = readDates(body);
  let text = body;
  if (d) text = blank(body, d.start, d.end);
  return { n: l.n, t: l.t, indent: l.indent, bullet, body, text, date: d, plain: letters(text) };
}

const isDescription = (p) => !p.date && (words(p.body) > 14 || p.body.length > 120) || (p.body.endsWith('.') && words(p.body) > 7 && !p.date);
const scoreLine = (p) => /^(?:cgpa|gpa|sgpa|percentage|percent|grade|marks|score|aggregate|result|rank)/i.test(p.body);
const dateOnly = (p) => p.date && p.plain < 2;

// ---------- skills ----------
const SKILL_LABEL = /^[A-Za-z][A-Za-z &/+\-]{1,28}\s*[:：]\s*(?=\S)/;
function splitTop(s) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
    const sep = depth === 0 && (',;|•·●▪\t'.includes(c) || (c === ' ' && s[i + 1] === ' ') || (c === '/' && s[i - 1] === ' ' && s[i + 1] === ' '));
    if (sep) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out;
}

function skillItems(body) {
  const m = SKILL_LABEL.exec(body);
  const rest = m ? body.slice(m[0].length) : body;
  const items = [];
  for (const raw of splitTop(rest)) {
    const t = tidy(raw).replace(/\.$/, '');
    if (!t || t.length > 40 || words(t) > 4 || letters(t) === 0) continue;
    items.push(t);
  }
  return items;
}

// ---------- entry building ----------
const CONNECT = /^[\s,;:|\-–—()]*$/;

function joinLiteral(line, a, b) {
  let end = b.end;
  const s = line.slice(a.start, end);
  if ((s.match(/\(/g) || []).length > (s.match(/\)/g) || []).length && line[end] === ')') end++;
  return line.slice(a.start, end);
}

function buildJob(lines) {
  const pcs = lines.flatMap((p) => pieces(blankDate(p), true, p.n));
  if (!pcs.length) return null;
  let ti = pcs.findIndex((p) => ROLE.test(p.text) && !ORG_SUFFIX.test(p.text) && p.text.length <= 90);
  if (ti < 0) ti = pcs.findIndex((p) => ROLE.test(p.text) && p.text.length <= 90);
  let oi = pcs.findIndex((p, i) => i !== ti && (ORG_SUFFIX.test(p.text) || KNOWN_ORG.test(p.text)) && !ROLE.test(p.text));
  if (oi < 0) oi = pcs.findIndex((p, i) => i !== ti && (ORG_SUFFIX.test(p.text) || KNOWN_ORG.test(p.text)));
  if (ti < 0) {
    if (oi < 0) return null;
    ti = pcs.findIndex((p, i) => i !== oi);
    if (ti < 0) return null;
  }
  if (oi < 0) {
    oi = pcs.findIndex((p, i) => i !== ti && /^[A-Z0-9]/.test(p.text) && words(p.text) <= 5 && !ROLE.test(p.text) && !/\d{3,}/.test(p.text));
  }
  return { title: pcs[ti].text, org: oi >= 0 ? pcs[oi].text : null };
}

function buildEducation(lines) {
  const all = lines.flatMap((p) => pieces(blankDate(p), true, p.n));
  const pcs = all.filter((p) => !SCORE.test(p.text));
  const di = pcs.findIndex((p) => isDegree(p.text));
  const ii = pcs.findIndex((p, i) => i !== di && (INSTITUTION.test(p.text) || ORG_SUFFIX.test(p.text)));
  if (di < 0 && ii < 0) return null;
  if (di < 0) return { title: pcs[ii].text, org: null };
  let title = pcs[di].text;
  const next = pcs[di + 1];
  if (next && next.line === pcs[di].line && di + 1 !== ii && !ORG_LIKE(next.text)) {
    const src = lines.find((p) => p.n === pcs[di].line);
    const gap = src.body.slice(pcs[di].end, next.start);
    if (CONNECT.test(gap) && (!isDegree(next.text) || gap.includes('('))) title = tidy(joinLiteral(src.body, pcs[di], next));
  }
  return { title, org: ii >= 0 ? pcs[ii].text : null };
}

const LABEL = /^(?:patent|patent title|patent no\.?|certificate|certification|publication|paper|award|workshop|course|project|conference|hackathon|achievement)s?$/i;
const VENUE = /\b(?:journal|conference|proceedings|ieee|acm|springer|elsevier|symposium|transactions|letters|workshop|magazine|review|iccc|icc\w*)\b/i;

function buildGeneric(lines, kind) {
  const first = lines[0];
  const body = lines.map(blankDate).join(' ');
  if (kind === 'publication') {
    const pcs = pieces(body, true, first.n);
    let vi = -1;
    for (let i = pcs.length - 1; i > 0; i--) if (VENUE.test(pcs[i].text)) { vi = i; break; }
    if (vi > 0) {
      const title = tidy(body.slice(pcs[0].start, pcs[vi].start).replace(/(?:published in|presented at|appeared in|in:?)\s*$/i, ''));
      if (letters(title) >= 3) return { title, org: pcs[vi].text };
    }
  }
  const cps = pieces(body, true, first.n);
  if (cps.length >= 2) {
    const lastP = cps[cps.length - 1];
    if (ORG_LIKE(lastP.text)) {
      const title = tidy(body.slice(cps[0].start, cps[cps.length - 2].end));
      if (letters(title) >= 3 && title.length < MAX_TITLE) return { title, org: lastP.text };
    }
  }
  let pcs = pieces(body, false, first.n);
  if (pcs.length > 1 && LABEL.test(pcs[0].text)) pcs = pcs.slice(1);
  if (!pcs.length) return null;
  let oi = pcs.findIndex((p, i) => i > 0 && ORG_LIKE(p.text));
  if (oi < 0 && pcs.length >= 2 && KNOWN_ORG.test(pcs[0].text) && !ORG_LIKE(pcs[1].text)) oi = 0;
  const ti = pcs.findIndex((p, i) => i !== oi);
  if (ti < 0) return null;
  let title = pcs[ti].text;
  if (oi < 0 && pcs.length === 2 && kind !== 'other' && !/[()]/.test(body.slice(pcs[0].end, pcs[1].start))) {
    // "Winner - Some Hackathon": keep both halves in the title, there is no organiser we can name
    title = tidy(body.slice(pcs[0].start, pcs[1].end));
  }
  return { title, org: oi >= 0 ? pcs[oi].text : null };
}

function blankDate(p) { return p.text; }

function firstDate(lines) {
  for (const p of lines) if (p.date) return p.date;
  return null;
}

function applyDate(kind, d) {
  if (!d) return { from: null, to: null };
  if (kind === 'education' && !d.range) return { from: null, to: d.from };
  return { from: d.from, to: d.to };
}

function looksLikeInstruction(t) {
  const flat = t.normalize('NFKC');
  return INJECTION.some((re) => re.test(flat));
}

// ---------- main ----------
export function parseResume(text) {
  checkInput(text);
  const warnings = [];
  let clean = text.replace(/\r\n?/g, '\n');
  const hidden = (clean.match(HIDDEN) || []).length;
  if (hidden) { clean = clean.replace(HIDDEN, ''); warnings.push(`Removed ${hidden} hidden or control character${hidden === 1 ? '' : 's'} from the text.`); }

  const lines = clean.split('\n').map((raw, i) => ({ n: i + 1, t: raw.trim(), indent: raw.length - raw.trimStart().length, skip: null }));
  let injected = 0;
  let tooLong = 0;
  for (const l of lines) {
    if (!l.t) continue;
    if (l.t.length > MAX_LINE) { l.skip = 'long'; tooLong++; continue; }
    if (PAGE_NOISE.test(l.t)) { l.skip = 'noise'; continue; }
    if (l.t.length >= 12 && looksLikeInstruction(l.t)) {
      l.skip = 'instruction';
      injected++;
      if (injected <= 10) warnings.push(`Line ${l.n} reads like an instruction to software, so it was ignored.`);
    }
  }
  if (injected > 10) warnings.push(`${injected - 10} more lines that read like instructions were ignored.`);
  if (tooLong) warnings.push(`${tooLong} very long line${tooLong === 1 ? ' was' : 's were'} too long to read as a list item and skipped.`);

  // sections
  const sections = [{ key: 'none', lines: [] }];
  for (const l of lines) {
    if (l.skip) continue;
    const h = l.t ? headingOf(l.t) : null;
    if (h) sections.push({ key: h, lines: [] });
    else sections[sections.length - 1].lines.push(l);
  }
  const hasHeadings = sections.length > 1;
  if (!hasHeadings) warnings.push('No section headings found, so each line was read on its own.');

  const raw = []; // {kind, title, org, from, to, base, source, fromModel, n}
  const push = (c) => { if (raw.length < MAX_CLAIMS) raw.push(c); };
  let capped = false;

  const mk = (kind, built, group, base, modelKind) => {
    if (!built || !built.title || letters(built.title) < 2 || built.title.length > MAX_TITLE) return;
    const d = firstDate(group);
    const { from, to } = applyDate(kind, d);
    push({
      kind, title: built.title, org: built.org || null, from, to, base, modelKind,
      source: group.map((p) => p.t).join('\n'), n: group[0].n,
    });
  };

  const sectionKinds = { education: 'education', experience: 'job', certificates: 'certificate', projects: 'other', patents: 'patent', publications: 'publication', awards: 'award', events: 'event' };

  for (const sec of sections) {
    if (sec.key === 'ignore') continue;
    if (sec.key === 'none' && hasHeadings) continue;
    const P = sec.lines.map((l) => (l.t ? prep(l) : null));

    if (sec.key === 'skills') {
      for (const p of P) if (p && p.plain >= 1) {
        for (const item of skillItems(p.body)) {
          push({ kind: 'skill', title: item, org: null, from: null, to: null, base: words(item) > 3 ? 0.75 : 0.85, modelKind: null, source: p.t, n: p.n });
        }
      }
      continue;
    }

    if (sec.key === 'none') { guess(P, push, mk, warnings); continue; }

    if (sec.key === 'experience' || sec.key === 'education') {
      const kind = sectionKinds[sec.key];
      const builder = kind === 'job' ? buildJob : buildEducation;
      let cur = null;
      const flush = () => { if (cur) { mk(kind, builder(cur.lines), cur.lines, 0.9, null); cur = null; } };
      const complete = (g) => {
        const b = builder(g.lines);
        if (!b || !(g.hasDate || g.lines.length >= 2)) return false;
        return b.org !== null;
      };
      for (const p of P) {
        if (!p) { if (cur && cur.hasDate && complete(cur)) flush(); continue; }
        if (p.bullet) { if (cur) cur.closed = true; continue; }
        if (isDescription(p) || scoreLine(p)) { if (cur) cur.closed = true; continue; }
        if (dateOnly(p) && cur && !cur.hasDate) { cur.lines.push(p); cur.hasDate = true; continue; }
        if (cur && kind === 'education' && cur.hasDate && !cur.closed && !complete(cur) && builder(cur.lines) && !(INSTITUTION.test(p.text) || ORG_SUFFIX.test(p.text))) flush();
        if (cur && (cur.closed || complete(cur) || cur.lines.length >= 4)) flush();
        if (!cur) cur = { lines: [], hasDate: false, closed: false };
        cur.lines.push(p);
        if (p.date) cur.hasDate = true;
      }
      flush();
      continue;
    }

    // list sections
    const listed = [];
    const planeExists = P.some((p) => p && !p.bullet);
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (!p) continue;
      if (sec.key === 'projects' && p.bullet && planeExists) continue;
      if (dateOnly(p) && listed.length && !listed[listed.length - 1].some((q) => q.date) && P[i - 1]) { listed[listed.length - 1].push(p); continue; }
      const prev = listed[listed.length - 1];
      const last = prev && prev[prev.length - 1];
      if (prev && last && P[i - 1] && !p.bullet && prev.length < 3 && last.body.length >= 30 && (!p.date || (last.bullet && p.indent > last.indent)) &&
          (/^[a-z]/.test(p.body) || (last.bullet && p.indent > last.indent) || /(?:[,\-–]|(?:and|of|for|in|on|with|using|the|a|an|to|by|via|based))$/i.test(last.body))) {
        prev.push(p); continue; // wrapped line
      }
      if (p.plain < 3) continue;
      if (p.body.length > 200 && !p.date) continue;
      listed.push([p]);
    }
    for (const g of listed) {
      const head = g.map((p) => p.body).join(' ');
      let kind = sectionKinds[sec.key];
      let modelKind = null;
      if (sec.key === 'activities' || !kind) {
        const m = classifyClaim(head);
        kind = ['event', 'other', 'award', 'certificate'].includes(m.kind) ? m.kind : 'other';
        modelKind = m;
      }
      if (sec.key === 'publications' && /\bpatent/i.test(head)) kind = 'patent';
      const built = buildGeneric(g, kind);
      mk(kind, built, g, sec.key === 'activities' ? 0 : 0.85, modelKind);
    }
  }

  // dedupe
  const seen = new Set();
  const claims = [];
  for (const c of raw) {
    const key = [c.kind, c.title.toLowerCase(), (c.org || '').toLowerCase(), c.from, c.to].join('\u0001');
    if (seen.has(key)) continue;
    seen.add(key);
    claims.push(c);
  }
  if (raw.length >= MAX_CLAIMS) { warnings.push(`Only the first ${MAX_CLAIMS} claims were kept.`); capped = true; }

  let skills = 0;
  const out = [];
  for (const c of claims) {
    if (c.kind === 'skill') { skills++; if (skills > MAX_SKILLS) continue; }
    out.push(c);
  }
  if (skills > MAX_SKILLS && !capped) warnings.push(`Only the first ${MAX_SKILLS} skills were kept.`);

  const final = out.map((c, i) => {
    const m = c.kind === 'skill' ? null : classifyClaim(`${c.title} ${c.org || ''}`);
    let conf = c.base;
    if (c.kind !== 'skill') {
      if (c.modelKind) conf = clamp(c.modelKind.confidence, 0, 1) * 0.9;
      else conf = c.base + (m.kind === c.kind ? 0.08 * m.confidence : -0.12);
      if (!c.org && (c.kind === 'job' || c.kind === 'education')) conf -= 0.08;
      if (!c.from && !c.to && (c.kind === 'job' || c.kind === 'education')) conf -= 0.1;
      if (c.title.length < 4) conf -= 0.2;
    }
    if (c.from && c.to && c.to !== 'present' && monthIndex(c.to) < monthIndex(c.from)) {
      warnings.push(`Line ${c.n}: the end date is before the start date. Please check it.`);
      conf -= 0.1;
    }
    return {
      id: 'c' + (i + 1), kind: c.kind, title: c.title, org: c.org, from: c.from, to: c.to,
      confidence: round2(clamp(conf, 0.05, 0.99)), source: c.source,
    };
  });
  return { claims: final, warnings };
}

// No headings at all (messy paste or PDF extraction): read each line alone, and only keep lines with real evidence.
function guess(P, push, mk, warnings) {
  const SKILL_LINE = /^(?:(?:technical|key|core|soft|programming) )?(?:skills?|tools|technologies|languages|frameworks|libraries)\s*[:\-–]\s*\S/i;
  for (const p of P) {
    if (!p || p.plain < 3 || isDescription(p) || p.date && dateOnly(p)) continue;
    if (SKILL_LINE.test(p.body)) {
      for (const item of skillItems(p.body)) push({ kind: 'skill', title: item, org: null, from: null, to: null, base: 0.8, modelKind: null, source: p.t, n: p.n });
      continue;
    }
    const g = [p];
    if (isDegree(p.text) && (INSTITUTION.test(p.text) || p.date)) { mk('education', buildEducation(g), g, 0.8, null); continue; }
    if (ROLE.test(p.text) && (p.date || ORG_LIKE(p.text)) && !isDegree(p.text)) { const b = buildJob(g); if (b && b.org) { mk('job', b, g, 0.8, null); continue; } }
    const m = classifyClaim(p.text);
    const evidence = p.date || KNOWN_ORG.test(p.text) || ['patent', 'publication'].includes(m.kind) && m.confidence >= 0.8;
    if (!evidence || m.confidence < 0.55) continue;
    if (m.kind === 'skill') continue;
    mk(m.kind, buildGeneric(g, m.kind), g, 0, m);
  }
}
