// Tests use only synthetic fixtures generated here, with invented names. No real certificates.
import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { analyzeImage, ForensicsError, MAX_BYTES, modelInfo, scoreFeatures, levelOf } from '../src/index.js';
import { extractFeatures } from '../src/features.js';
import model from '../src/model.js';

const W = 1100, H = 780;

async function sampleCertificate({ name = 'Sample Person', grade = 'A+' } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="none" stroke="#7a5c1e" stroke-width="6"/>
    <text x="${W / 2}" y="170" font-size="64" text-anchor="middle" fill="#222">CERTIFICATE</text>
    <text x="${W / 2}" y="330" font-size="52" text-anchor="middle" fill="#1b2a5c">${name}</text>
    <text x="${W / 2}" y="440" font-size="30" text-anchor="middle" fill="#333">Grade ${grade} (Sample)</text>
    <circle cx="${W / 2}" cy="620" r="60" fill="#9b1c1c"/></svg>`;
  return sharp({ create: { width: W, height: H, channels: 3, background: '#f3ecd9', noise: { type: 'gaussian', mean: 0, sigma: 3 } } })
    .composite([{ input: Buffer.from(svg) }])
    .png()
    .toBuffer();
}

async function tamperedCertificate() {
  const base = await sampleCertificate();
  const jpg = await sharp(base).jpeg({ quality: 70 }).toBuffer();
  // paste a flat, noise-free patch over the name line, then save again at another quality
  const patch = await sharp({ create: { width: 520, height: 90, channels: 3, background: '#f3ecd9' } }).png().toBuffer();
  return sharp(jpg).composite([{ input: patch, left: 290, top: 285 }]).jpeg({ quality: 92 }).toBuffer();
}

const LEVELS = ['no_signs', 'some_signs', 'strong_signs'];

function wordCount(s) {
  return s.trim().split(/\s+/).length;
}

test('result has the documented shape', async () => {
  const r = await analyzeImage(await sampleCertificate());
  assert.equal(typeof r.score, 'number');
  assert.ok(r.score >= 0 && r.score <= 1);
  assert.ok(LEVELS.includes(r.level));
  assert.ok(Array.isArray(r.signals));
  assert.equal(typeof r.modelVersion, 'string');
  assert.equal(r.modelVersion, modelInfo.version);
  for (const s of r.signals) {
    assert.equal(typeof s.id, 'string');
    assert.ok(wordCount(s.plain) <= 12, s.plain);
  }
});

test('signals appear only when something was found, and are plain', async () => {
  const r = await analyzeImage(await tamperedCertificate());
  if (r.level === 'no_signs') assert.equal(r.signals.length, 0);
  else assert.ok(r.signals.length >= 1 && r.signals.length <= 3);
  const text = JSON.stringify(r).toLowerCase();
  assert.ok(!text.includes('verified'), 'machine checks never say verified');
  assert.ok(!text.includes('fake'), 'no signs of editing is not "fake"');
});

test('deterministic for the same bytes', async () => {
  const buf = await tamperedCertificate();
  assert.deepEqual(await analyzeImage(buf), await analyzeImage(buf));
});

test('same code paths for png, jpeg, webp, greyscale and transparent input', async () => {
  const png = await sampleCertificate();
  const inputs = [
    png,
    await sharp(png).jpeg({ quality: 80 }).toBuffer(),
    await sharp(png).webp({ quality: 80 }).toBuffer(),
    await sharp(png).greyscale().png().toBuffer(),
    await sharp(png).ensureAlpha(0.9).png().toBuffer(),
  ];
  for (const b of inputs) {
    const r = await analyzeImage(b);
    assert.ok(LEVELS.includes(r.level));
  }
});

test('rejects things that are not images with a typed error', async () => {
  const bad = [
    Buffer.from('hello, this is plain text'),
    Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n'),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400"/></svg>'),
    Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]),
    Buffer.alloc(0),
  ];
  for (const b of bad) {
    await assert.rejects(analyzeImage(b), (e) => e instanceof ForensicsError && e.code === 'not_an_image');
  }
});

test('rejects anything over 10 MB and anything that is not bytes', async () => {
  assert.equal(MAX_BYTES, 10 * 1024 * 1024);
  await assert.rejects(analyzeImage(Buffer.alloc(MAX_BYTES + 1)), (e) => e instanceof ForensicsError && e.code === 'too_large');
  await assert.rejects(analyzeImage('not bytes'), (e) => e instanceof ForensicsError && e.code === 'bad_input');
  await assert.rejects(analyzeImage(null), (e) => e instanceof ForensicsError && e.code === 'bad_input');
});

test('rejects tiny images', async () => {
  const tiny = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#ffffff' } }).png().toBuffer();
  await assert.rejects(analyzeImage(tiny), (e) => e instanceof ForensicsError && e.code === 'too_small');
});

test('feature code and model file agree (same names, same order, finite numbers)', async () => {
  const { names, values } = await extractFeatures(await sampleCertificate());
  assert.deepEqual(names, model.featureNames);
  assert.equal(values.length, model.mean.length);
  assert.ok(values.every(Number.isFinite));
  const s = scoreFeatures(values);
  assert.ok(s >= 0 && s <= 1);
  assert.equal(levelOf(s), (await analyzeImage(await sampleCertificate())).level);
});

test('every explanation sentence is short and jargon-free', () => {
  const banned = /\b(ela|jpeg|jpg|compression|pixel|artifact|artefact|forensic|noise|quantis|luma|chroma|dct)\b/i;
  for (const g of model.groups) {
    assert.ok(wordCount(g.plain) <= 12, g.plain);
    assert.ok(!banned.test(g.plain), g.plain);
  }
});

test('thresholds are ordered', () => {
  assert.ok(model.thresholds.some < model.thresholds.strong);
  assert.equal(levelOf(0), 'no_signs');
  assert.equal(levelOf(1), 'strong_signs');
});
