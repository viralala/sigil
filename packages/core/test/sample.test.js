// Sample data pack contract: every sample is labelled, and each case lands on the verdict the
// demo promises. The verdicts follow the witness rule: no trusted witness = "unverified", never "fake".
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSampleWorld, checkSample, SAMPLE_CASES, verdictOf } from '../src/index.js';

const AUD = 'http://localhost:3000';
const world = buildSampleWorld({ audience: AUD });

test('pack size: 3 colleges, 3 employers, 10 credentials, all labelled Sample', () => {
  const orgs = world.orgs;
  assert.equal(orgs.filter((o) => o.kind === 'college' && o.listed !== 'fake' && o.inTrustList).length, 3);
  assert.equal(orgs.filter((o) => o.kind === 'employer').length, 3);
  assert.equal(SAMPLE_CASES.length, 10);
  for (const o of orgs) assert.match(o.name, /^Sample /);
  for (const c of SAMPLE_CASES) assert.equal(c.sample, true);
});

const expected = {
  'asha-degree': 'green',
  'rohan-internship': 'green',
  'meera-closed-college': 'green',
  'kabir-revoked': 'red',
  'dev-edited-grade': 'red',
  'zoya-fake-college': 'red',
  'arjun-unknown-signer': 'yellow',
  'isha-derecognised': 'yellow',
  'neel-relayed': 'red',
  'tara-backdated': 'red',
};
for (const [id, verdict] of Object.entries(expected)) {
  test(`case ${id} -> ${verdict}`, () => {
    const r = checkSample(world, id);
    assert.equal(r.verdict, verdict, JSON.stringify(r.reasons));
    assert.equal(r.sample, true);
  });
}

test('green result names its witness: who, how, when', () => {
  const r = checkSample(world, 'asha-degree');
  assert.equal(r.witness.level, 'W1');
  assert.ok(r.witness.who && r.witness.how && r.witness.when);
  assert.deepEqual(Object.keys(r.claims).sort(), ['degree', 'name', 'year']);
  assert.equal('grade' in r.claims, false); // hidden by the holder
});

test('employer claim is witnessed by an HR email confirmation (W3), not a college signature', () => {
  assert.equal(checkSample(world, 'rohan-internship').witness.level, 'W3');
});

test('unknown signer has no witness and is never called fake', () => {
  const r = checkSample(world, 'arjun-unknown-signer');
  assert.equal(r.witness, null);
  assert.deepEqual(r.reasons, ['ISSUER_NOT_IN_TRUST_LIST']);
});

test('closed college keeps a custodian note', () => {
  const r = checkSample(world, 'meera-closed-college');
  assert.ok(r.warnings.includes('ISSUER_CLOSED'));
  assert.match(r.custodian, /^Sample /);
});

test('each check uses a fresh one-time challenge (checking twice works, replay does not)', () => {
  assert.equal(checkSample(world, 'asha-degree').verdict, 'green');
  assert.equal(checkSample(world, 'asha-degree').verdict, 'green');
  assert.equal(checkSample(world, 'asha-degree', { replay: true }).reasons[0], 'NONCE_REPLAYED');
});

test('unknown sample id throws a typed error', () => {
  assert.throws(() => checkSample(world, 'nope'), /UNKNOWN_SAMPLE/);
});

test('verdictOf: failures are red except a missing witness, which is yellow', () => {
  assert.equal(verdictOf({ ok: true, reasons: [], warnings: [] }), 'green');
  assert.equal(verdictOf({ ok: true, reasons: [], warnings: ['ISSUER_CLOSED'] }), 'green');
  assert.equal(verdictOf({ ok: true, reasons: [], warnings: ['ISSUER_DERECOGNISED_LATER'] }), 'yellow');
  assert.equal(verdictOf({ ok: false, reasons: ['ISSUER_NOT_IN_TRUST_LIST'], warnings: [] }), 'yellow');
  assert.equal(verdictOf({ ok: false, reasons: ['REVOKED'], warnings: [] }), 'red');
});

// One-tap confirm (issuer tile): "Yes, that is right" really signs a new sample credential.
import { confirmSample } from '../src/index.js';
test('confirmSample signs a new credential that then checks green, witnessed by the college', () => {
  const id = confirmSample(world, { name: 'Priya Nair', degree: 'B.Tech Information Technology', year: 2026 });
  const r = checkSample(world, id);
  assert.equal(r.verdict, 'green');
  assert.equal(r.claims.name, 'Priya Nair');
  assert.equal(r.witness.level, 'W1');
  assert.match(r.witness.who, /^Sample Deccan/);
});
test('confirmSample rejects bad input', () => {
  assert.throws(() => confirmSample(world, { name: '', degree: 'B.Tech', year: 2026 }), /BAD_INPUT/);
  assert.throws(() => confirmSample(world, { name: 'A'.repeat(81), degree: 'B.Tech', year: 2026 }), /BAD_INPUT/);
  assert.throws(() => confirmSample(world, { name: 'Ok Name', degree: 'B.Tech', year: 1800 }), /BAD_INPUT/);
});

// Browser wallet compatibility: WebCrypto ES256 signatures must verify in the core.
import { webcrypto } from 'node:crypto';
import { verifyJSON, canon, packCredential, issue, newKey, keyToJwk, keyFromJwk, signJSON } from '../src/index.js';
test('a WebCrypto P-256 signature over canon() verifies with verifyJSON', async () => {
  const k = await webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const spki = await webcrypto.subtle.exportKey('spki', k.publicKey);
  const pub = Buffer.from(spki).toString('base64url');
  const obj = { nonce: 'n', aud: 'a' };
  const sig = await webcrypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, k.privateKey, Buffer.from(canon(obj)));
  assert.equal(verifyJSON(obj, Buffer.from(sig).toString('base64url'), pub), true);
  assert.equal(verifyJSON({ ...obj, aud: 'b' }, Buffer.from(sig).toString('base64url'), pub), false);
});
test('keys survive a JWK round trip; packed credentials are plain JSON', () => {
  const k = newKey(); const k2 = keyFromJwk(keyToJwk(k));
  assert.equal(k2.pub, k.pub);
  assert.equal(verifyJSON({ a: 1 }, signJSON({ a: 1 }, k2), k.pub), true);
  const c = issue({ issuerKey: k, issuerId: 'x', holderPub: newKey().pub, fields: { a: 1 }, statusIndex: 0, statusListId: 'l' });
  const p = JSON.parse(JSON.stringify(packCredential(c)));
  assert.equal(p.leaves[0].key, 'a'); assert.ok(typeof p.levels[0][0] === 'string');
});
