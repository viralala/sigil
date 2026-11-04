import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { classifyClaim, CLAIM_KINDS } from '../src/index.js';
import { probabilities } from '../src/classify.js';
import model from '../src/model.js';
import { KINDS } from './helpers.js';

const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf8'));

test('JS probabilities equal the Python training pipeline on the golden sentences', () => {
  assert.deepEqual(golden.classes, model.classes);
  for (const g of golden.cases) {
    const p = probabilities(g.text);
    assert.equal(p.length, g.probs.length);
    p.forEach((x, i) => assert.ok(Math.abs(x - g.probs[i]) < 1e-6, `${JSON.stringify(g.text)} class ${golden.classes[i]}: js ${x} py ${g.probs[i]}`));
  }
});

test('model file is compact (< 2 MB) and shaped as documented', () => {
  assert.ok(statSync(new URL('../src/model.js', import.meta.url)).size < 2 * 1024 * 1024);
  assert.equal(model.coef.length, model.classes.length);
  for (const row of model.coef) assert.equal(row.length, model.vocab.length);
  assert.equal(model.idf.length, model.vocab.length);
  assert.deepEqual([...model.classes].sort(), [...KINDS].sort());
  assert.deepEqual([...CLAIM_KINDS].sort(), [...KINDS].sort());
});

test('public vocabulary holds no digits (folded to 0), no @, no URLs', () => {
  for (const f of model.vocab) {
    if (f.startsWith('s:')) continue; // structural features such as s:n5
    const body = f.slice(2);
    assert.ok(!/[1-9@]/.test(body), f);
    assert.ok(!/https?|www\./.test(body), f);
  }
});

test('no long digit runs in any exported string (PRN-like numbers)', () => {
  // cheap structural guard; the real check (names, emails, PRNs vs. the private CSV) is bench/ml/claims/leak_check.py
  for (const f of [...model.vocab, ...model.classes, model.about]) assert.ok(!/\d{4,}/.test(f), f);
});

test('classifyClaim returns { kind, confidence } with a known kind', () => {
  for (const t of ['Machine Learning by Andrew - Coursera', 'zzzz qqqq', 'Software Engineer at Bluepeak Technologies', '12345', '\u{1F600}']) {
    const c = classifyClaim(t);
    assert.deepEqual(Object.keys(c).sort(), ['confidence', 'kind']);
    assert.ok(KINDS.includes(c.kind));
    assert.ok(c.confidence >= 0 && c.confidence <= 1);
  }
});

test('classifyClaim on empty or non-string input is other / 0', () => {
  for (const t of ['', '   ', '!!!', undefined, null, 5]) assert.deepEqual(classifyClaim(t), { kind: 'other', confidence: 0 });
});

test('classifyClaim: obvious invented examples', () => {
  const want = {
    'Machine Learning by Andrew - Coursera': 'certificate',
    'NPTEL Introduction to Machine Learning': 'certificate',
    'Summer Intern Data Analyst Orbitwave Infotech': 'job',
    'B.Tech in Computer Engineering, Lakeview University': 'education',
    'Sparse Attention for Edge Devices IEEE Conference': 'publication',
  };
  for (const [t, k] of Object.entries(want)) assert.equal(classifyClaim(t).kind, k, t);
});

test('only the first 400 characters matter (bounded work)', () => {
  const head = 'Machine Learning Specialization Coursera '.padEnd(400, ' ');
  assert.deepEqual(classifyClaim(head), classifyClaim(head + 'y'.repeat(5000)));
  const t0 = Date.now();
  classifyClaim('a'.repeat(200000));
  assert.ok(Date.now() - t0 < 2000);
});

test('text is folded: case, digits and full-width letters do not change the result', () => {
  assert.deepEqual(classifyClaim('PYTHON FOR EVERYBODY - COURSERA 2023'), classifyClaim('python for everybody - coursera 1999'));
  assert.deepEqual(classifyClaim('Ｐython for everybody - coursera'), classifyClaim('Python for everybody - coursera'));
});
