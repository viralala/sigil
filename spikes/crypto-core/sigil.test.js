import test from 'node:test';
import assert from 'node:assert/strict';
import { newKey, issue, present, Verifier, StatusList, signTrustList, timelineFlags, thumbprint } from './sigil.js';

function world() {
  const roots = [newKey(), newKey(), newKey()];
  const uni = newKey(); const holder = newKey(); const shell = newKey();
  const list = new StatusList('vit-2026');
  const cred = issue({ issuerKey: uni, issuerId: 'did:web:vit.edu', holderPub: holder.pub, statusIndex: 17, statusListId: 'vit-2026',
    fields: { name: 'Asha Verma', degree: 'B.Tech Computer Engineering', year: 2026, grade: 8.7, dob: '2004-02-11' } });
  const trust = signTrustList([{ id: 'did:web:vit.edu', pub: uni.pub, tier: 'A' }], [roots[0], roots[1]]);
  const v = () => new Verifier({ audience: 'https://hr.example.com', rootPubs: roots.map((r) => r.pub), threshold: 2 });
  return { roots, uni, holder, shell, list, cred, trust, v };
}

test('valid: reveal degree only, grade/dob stay hidden', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree', 'year'], nonce: n, aud: 'https://hr.example.com' });
  const r = ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) });
  assert.equal(r.ok, true); assert.deepEqual(Object.keys(r.claims).sort(), ['degree', 'year']); assert.equal(r.claims.grade, undefined);
});
test('tampered field value fails Merkle proof', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['grade'], nonce: n, aud: 'https://hr.example.com' });
  p.disclosures[0].value = 9.9;
  const r = ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) });
  assert.equal(r.ok, false); assert.match(r.reasons[0], /DISCLOSURE_HASH_MISMATCH|MERKLE_PROOF_INVALID/);
});
test('relay to a different verifier is rejected (audience binding)', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://evil.example.com' });
  assert.deepEqual(ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) }).reasons, ['AUDIENCE_MISMATCH']);
});
test('replaying the same presentation is rejected (nonce one-time)', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  const ctx = { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) };
  assert.equal(ver.check(p, ctx).ok, true);
  assert.deepEqual(ver.check(p, ctx).reasons, ['NONCE_REPLAYED']);
});
test('borrowed credential: a second person cannot sign the challenge', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge(); const thief = newKey();
  const p = present({ credential: w.cred, holderKey: thief, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  assert.deepEqual(ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) }).reasons, ['HOLDER_BINDING_INVALID']);
});
test('revoked credential', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge(); w.list.revoke(17);
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  assert.deepEqual(ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) }).reasons, ['REVOKED']);
});
test('stale status list rejected by max-age policy (replayed v7)', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  const old = w.list.publish(w.uni, Date.now() - 3 * 864e5);
  assert.deepEqual(ver.check(p, { nonce: n, trustList: w.trust, statusList: old }).reasons, ['STATUS_LIST_STALE']);
});
test('fake university not in trust list', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const fake = issue({ issuerKey: w.shell, issuerId: 'did:web:fake-univ.xyz', holderPub: w.holder.pub, statusIndex: 1, statusListId: 'x', fields: { degree: 'PhD' } });
  const p = present({ credential: fake, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  assert.deepEqual(ver.check(p, { nonce: n, trustList: w.trust, statusList: w.list.publish(w.uni) }).reasons, ['ISSUER_NOT_IN_TRUST_LIST']);
});
test('trust list needs 2-of-3 root signatures', () => {
  const w = world(); const ver = w.v(); const n = ver.newChallenge();
  const one = signTrustList([{ id: 'did:web:vit.edu', pub: w.uni.pub, tier: 'A' }], [w.roots[0]]);
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  assert.deepEqual(ver.check(p, { nonce: n, trustList: one, statusList: w.list.publish(w.uni) }).reasons, ['TRUST_LIST_BAD_SIGNATURES']);
});
test('decoy padding: 5 real fields live in an 8-leaf tree', () => {
  const w = world(); assert.equal(w.cred.tree.size, 8); assert.equal(w.cred.tree.leaves.length, 5);
});
test('timeline engine flags overlapping full-time roles, not the degree', () => {
  const d = (s) => Date.parse(s);
  const f = timelineFlags([{ label: 'B.Tech', start: d('2022-08-01'), end: d('2026-05-31'), exclusive: false },
    { label: 'Intern A', start: d('2025-06-01'), end: d('2025-08-31'), exclusive: true }, { label: 'Intern B', start: d('2025-07-01'), end: d('2025-09-30'), exclusive: true }]);
  assert.equal(f.length, 1); assert.equal(f[0].type, 'OVERLAP');
});
test('thumbprint is stable', () => { const k = newKey(); assert.equal(thumbprint(k.pub), thumbprint(k.pub)); });

// ---------- lifecycle: closure, derecognition, fake, key retirement ----------
import { headerId, signJSON } from './sigil.js';
function await_sign(h, k) { return signJSON(h, k); }
function oldWorld() { const w = world(); w.cred.header.iat = Date.now() - 900 * 864e5; w.cred.sig = signJSON(w.cred.header, w.uni); return w; }
function lifeWorld(entryPatch, base) {
  const w = base || world();
  const entry = { id: 'did:web:vit.edu', pub: w.uni.pub, tier: 'A', ...entryPatch(w) };
  w.trust = signTrustList([entry], [w.roots[0], w.roots[1]]);
  return w;
}
const run = (w, list) => {
  const ver = w.v(); const n = ver.newChallenge();
  const p = present({ credential: w.cred, holderKey: w.holder, reveal: ['degree'], nonce: n, aud: 'https://hr.example.com' });
  return ver.check(p, { nonce: n, trustList: w.trust, statusList: list ?? w.list.publish(w.uni) });
};
test('closed university: genuine credential still verifies (offline, issuer gone) with ISSUER_CLOSED warning + custodian', () => {
  const w = oldWorld(); w.list.revoke(99); const finalList = w.list.publish(w.uni, Date.now() - 400 * 864e5); // frozen long ago
  const w2 = lifeWorld(() => ({ state: 'closed', closedAt: Date.now() - 300 * 864e5, custodian: 'did:web:state-univ.example',
    manifest: [headerId(w.cred.header)], finalStatusVersion: finalList.body.version }), w);
  const r = run(w2, finalList);
  assert.equal(r.ok, true, JSON.stringify(r)); assert.deepEqual(r.warnings, ['ISSUER_CLOSED']); assert.equal(r.custodian, 'did:web:state-univ.example');
});
test('closed university: back-dated forgery signed with a leaked key is not in the closing manifest', () => {
  const w = lifeWorld(() => ({ state: 'closed', closedAt: Date.now() - 300 * 864e5, manifest: [], finalStatusVersion: 1 }));
  w.cred.header.iat = Date.now() - 500 * 864e5; // attacker back-dates; signature re-made with leaked key
  const re = issue({ issuerKey: w.uni, issuerId: 'did:web:vit.edu', holderPub: w.holder.pub, statusIndex: 5, statusListId: 'vit-2026', fields: { degree: 'MBA' } });
  re.header.iat = Date.now() - 500 * 864e5; re.sig = (await_sign(re.header, w.uni)); w.cred = re;
  assert.deepEqual(run(w, w.list.publish(w.uni)).reasons, ['NOT_IN_CLOSING_MANIFEST']);
});
test('closed university: credential dated after closure is rejected', () => {
  const w = lifeWorld(() => ({ state: 'closed', closedAt: Date.now() - 864e5, manifest: [], finalStatusVersion: 1 }));
  assert.deepEqual(run(w).reasons, ['ISSUED_AFTER_CLOSURE']);
});
test('closed university: revocations frozen at the final status list still apply', () => {
  const w = oldWorld(); w.list.revoke(17); const fin = w.list.publish(w.uni, Date.now() - 400 * 864e5);
  const w2 = lifeWorld(() => ({ state: 'closed', closedAt: Date.now() - 300 * 864e5, manifest: [headerId(w.cred.header)], finalStatusVersion: fin.body.version }), w);
  assert.deepEqual(run(w2, fin).reasons, ['REVOKED']);
});
test('closed university: a different (non-final) status list is refused', () => {
  const w = oldWorld(); const fin = w.list.publish(w.uni, Date.now() - 400 * 864e5); w.list.revoke(3); const later = w.list.publish(w.uni);
  const w2 = lifeWorld(() => ({ state: 'closed', closedAt: Date.now() - 300 * 864e5, manifest: [headerId(w.cred.header)], finalStatusVersion: fin.body.version }), w);
  assert.deepEqual(run(w2, later).reasons, ['STATUS_LIST_NOT_FINAL']);
});
test('derecognised later: old degree verifies with a warning; new one fails', () => {
  const w = lifeWorld(() => ({ state: 'derecognised', since: Date.now() + 1000 }));
  const r = run(w); assert.equal(r.ok, true); assert.deepEqual(r.warnings, ['ISSUER_DERECOGNISED_LATER']);
  const w2 = lifeWorld(() => ({ state: 'derecognised', since: Date.now() - 1000 }));
  assert.deepEqual(run(w2).reasons, ['ISSUED_AFTER_DERECOGNITION']);
});
test('issuer on the fake list fails with a clear reason', () => {
  assert.deepEqual(run(lifeWorld(() => ({ state: 'fake' }))).reasons, ['ISSUER_LISTED_FAKE']);
});
test('key retired: credentials issued before retirement verify; after retirement fail', () => {
  assert.equal(run(lifeWorld(() => ({ retiredAt: Date.now() + 5000 }))).ok, true);
  assert.deepEqual(run(lifeWorld(() => ({ retiredAt: Date.now() - 5000 }))).reasons, ['KEY_RETIRED_BEFORE_ISSUANCE']);
});
