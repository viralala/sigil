import test from 'node:test';
import assert from 'node:assert/strict';
import { parseResume, ResumeInputError, MAX_INPUT_BYTES } from '../src/index.js';
import { RESUMES } from './fixtures/resumes.js';
import { assertClaimInvariants } from './helpers.js';

const pick = (c) => ({ kind: c.kind, title: c.title, org: c.org, from: c.from, to: c.to });

for (const r of RESUMES) {
  test(`fixture ${r.name}: invariants hold (shape, traceability, no instruction false-positives)`, () => {
    const out = parseResume(r.text);
    assertClaimInvariants(out, r.text);
    assert.ok(!out.warnings.some((w) => /instruction/.test(w)), 'no false instruction warnings: ' + out.warnings);
  });
  if (!r.hard) {
    test(`fixture ${r.name}: every expected claim is found with all five fields (${r.layout})`, () => {
      const got = parseResume(r.text).claims.map(pick);
      for (const exp of r.expected) assert.ok(got.some((g) => JSON.stringify(g) === JSON.stringify(exp)), 'missing ' + JSON.stringify(exp) + '\nGOT ' + JSON.stringify(got));
      assert.equal(got.length, r.expected.length, 'no extra claims: ' + JSON.stringify(got));
    });
  }
}

test('known limit: a two-column extract is read poorly but never invents fields', () => {
  const r = RESUMES.find((x) => x.name === 'two-column-collapse');
  assertClaimInvariants(parseResume(r.text), r.text);
});

test('input limit: exactly 200 KB is read, one byte more is a typed error', () => {
  const ok = 'a'.repeat(MAX_INPUT_BYTES);
  assert.doesNotThrow(() => parseResume(ok));
  assert.throws(() => parseResume(ok + 'a'), (e) => e instanceof ResumeInputError && e.code === 'TOO_LARGE' && e.name === 'ResumeInputError');
  // multi-byte characters count as bytes, not characters
  const wide = '€'.repeat(Math.floor(MAX_INPUT_BYTES / 3) + 1);
  assert.ok(wide.length < MAX_INPUT_BYTES);
  assert.throws(() => parseResume(wide), (e) => e.code === 'TOO_LARGE');
  assert.doesNotThrow(() => parseResume('€'.repeat(Math.floor(MAX_INPUT_BYTES / 3))));
});

test('input must be a string', () => {
  for (const bad of [undefined, null, 42, {}, [], Buffer.from('x')]) {
    assert.throws(() => parseResume(bad), (e) => e instanceof ResumeInputError && e.code === 'NOT_A_STRING');
  }
});

test('empty and whitespace-only input give no claims and no crash', () => {
  for (const t of ['', '   ', '\n\n\n', '\t']) assert.deepEqual(parseResume(t).claims, []);
});

test('deterministic: same text, same result', () => {
  const t = RESUMES[0].text;
  assert.deepEqual(parseResume(t), parseResume(t));
});

test('CRLF and lone CR line endings read the same as LF', () => {
  const t = RESUMES[0].text;
  const a = parseResume(t).claims.map(pick);
  assert.deepEqual(parseResume(t.replace(/\n/g, '\r\n')).claims.map(pick), a);
  assert.deepEqual(parseResume(t.replace(/\n/g, '\r')).claims.map(pick), a);
});

test('hidden characters are removed and reported once', () => {
  const r = parseResume('EXPERIENCE\nSoftware\u200b Engineer, Acme Pvt Ltd  2020 - 2022\u202e\n');
  assert.equal(r.claims[0].title, 'Software Engineer');
  assert.ok(r.warnings.some((w) => /hidden/.test(w)));
});

test('sections: headings in several styles are recognised', () => {
  for (const h of ['EDUCATION', 'Education:', '## Education', '— Education —', 'E D U C A T I O N', 'Educational Qualifications']) {
    const r = parseResume(`${h}\nB.Tech in Computer Engineering, Lakeview University 2020 - 2024\n`);
    assert.equal(r.claims.length, 1, h);
    assert.equal(r.claims[0].kind, 'education', h);
  }
});

test('contact details are never turned into claims', () => {
  const t = 'Asha Test\nasha.test@example.com\n+91 00000 00000\nhttps://example.com/in/asha\nlinkedin.com/in/asha\nEDUCATION\nB.Tech, Lakeview University 2020-2024\n';
  const r = parseResume(t);
  assert.equal(r.claims.length, 1);
  assert.ok(!JSON.stringify(r.claims).includes('@'));
  assert.ok(!JSON.stringify(r.claims).includes('00000'));
});

test('personal details and references sections are ignored', () => {
  const r = parseResume('PERSONAL DETAILS\nSoftware Engineer, Acme Pvt Ltd 2020 - 2021\nREFERENCES\nManager, Acme Pvt Ltd 2019 - 2020\n');
  assert.equal(r.claims.length, 0);
});

test('long prose lines are not mistaken for entries', () => {
  const r = parseResume('EXPERIENCE\nSoftware Engineer, Acme Pvt Ltd  2020 - 2022\nLed a group of five engineers and managers to ship the quarterly release on time and under budget.\n');
  assert.equal(r.claims.length, 1);
});

test('skills: labels dropped, brackets kept, duplicates removed, sentences refused', () => {
  const r = parseResume('SKILLS\nLanguages: Python, Java, python\nCloud: AWS (EC2, S3), Docker\nI am a quick learner who enjoys working in teams and shipping code.\n');
  assert.deepEqual(r.claims.map((c) => c.title), ['Python', 'Java', 'AWS (EC2, S3)', 'Docker']);
});

test('skills are capped at 100 with a warning', () => {
  const t = 'SKILLS\n' + Array.from({ length: 150 }, (_, i) => `Skill${String.fromCharCode(97 + (i % 26))}${i}`).join(', ') + '\n';
  const r = parseResume(t);
  assert.equal(r.claims.length, 100);
  assert.ok(r.warnings.some((w) => /skills were kept/.test(w)));
});

test('end before start date is reported to the holder, not corrected', () => {
  const r = parseResume('EXPERIENCE\nAnalyst, Acme Pvt Ltd  Mar 2022 - Jan 2021\n');
  assert.equal(r.claims[0].from, '2022-03');
  assert.equal(r.claims[0].to, '2021-01');
  assert.ok(r.warnings.some((w) => /end date is before/.test(w)));
});

test('confidence is a reading confidence in [0,1], never a score of the person', () => {
  for (const r of RESUMES) for (const c of parseResume(r.text).claims) assert.ok(c.confidence >= 0.05 && c.confidence <= 0.99);
});

test('nothing in the output says verified, and every claim keeps its source line', () => {
  for (const r of RESUMES) {
    const out = parseResume(r.text);
    assert.ok(!/verified/i.test(JSON.stringify(Object.keys(out.claims[0] || {}))));
    for (const c of out.claims) assert.ok(r.text.includes(c.source.split('\n')[0]));
  }
});

test('runs with no Node-only APIs: source files import nothing but relative modules', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../src/', import.meta.url);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)) assert.ok(m[1].startsWith('./'), `${f} imports ${m[1]}`);
    if (f === 'lexicon.js' || f === 'model.js') continue; // word lists: patterns mention words like "fetch" on purpose
    assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|process\.|require\(|readFileSync|node:)/.test(src.replace(/\/\/.*$/gm, '')), `${f} uses a runtime-specific or network API`);
  }
});
