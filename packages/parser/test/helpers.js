import assert from 'node:assert/strict';

export const CLAIM_KEYS = ['confidence', 'from', 'id', 'kind', 'org', 'source', 'title', 'to'];
export const KINDS = ['education', 'job', 'certificate', 'skill', 'publication', 'patent', 'award', 'event', 'other'];
export const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const HIDDEN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f­​-‏‪-‮⁠-⁤⁦-⁩﻿￹-￻]/g;

/** What the parser sees: CRLF folded, invisible characters removed. Every field must trace back to this. */
export const seen = (text) => collapse(text.replace(/\r\n?/g, '\n').replace(HIDDEN, ''));

/** Shape + traceability invariants that must hold for ANY input. */
export function assertClaimInvariants(result, input) {
  assert.deepEqual(Object.keys(result).sort(), ['claims', 'warnings']);
  assert.ok(Array.isArray(result.claims) && Array.isArray(result.warnings));
  for (const w of result.warnings) assert.equal(typeof w, 'string');
  const hay = seen(input);
  const ids = new Set();
  for (const c of result.claims) {
    assert.deepEqual(Object.keys(c).sort(), CLAIM_KEYS, 'a claim has exactly the Claim fields');
    assert.match(c.id, /^c\d+$/);
    assert.ok(!ids.has(c.id), 'unique ids');
    ids.add(c.id);
    assert.ok(KINDS.includes(c.kind), 'kind is one of the product kinds: ' + c.kind);
    assert.equal(typeof c.title, 'string');
    assert.ok(c.title.length > 0);
    assert.ok(c.org === null || (typeof c.org === 'string' && c.org.length > 0));
    for (const d of [c.from, c.to]) assert.ok(d === null || /^(?:\d{4}(?:-\d{2}(?:-\d{2})?)?|present)$/.test(d), 'date format ' + d);
    assert.ok(c.from !== 'present', 'present only closes a range');
    assert.equal(typeof c.confidence, 'number');
    assert.ok(c.confidence >= 0 && c.confidence <= 1);
    assert.equal(typeof c.source, 'string');
    assert.ok(c.source.length > 0);
    // traceability: source lines come from the input; title and org are pieces of the source
    for (const line of c.source.split('\n')) assert.ok(hay.includes(collapse(line)), 'source line is in the input');
    const src = collapse(c.source);
    assert.ok(src.includes(collapse(c.title)), `title is in the source: ${c.title}`);
    if (c.org) assert.ok(src.includes(collapse(c.org)), `org is in the source: ${c.org}`);
    // dates: the year we output is written in the source (4 digits, or its last 2 digits as in 2019-20 or Jun'21)
    for (const d of [c.from, c.to]) if (d && d !== 'present') assert.ok(c.source.includes(d.slice(0, 4)) || c.source.includes(d.slice(2, 4)), 'date traces to source: ' + d);
    for (const key of Object.keys(c)) assert.ok(!/verif|state|witness|trust|score|rank|tier/i.test(key), 'no verification-like key: ' + key);
  }
  assert.ok(Object.getPrototypeOf(result) === Object.prototype);
}
