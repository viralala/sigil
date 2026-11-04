// Sigil crypto core. ES256 (P-256, raw r||s signatures, as WebCrypto produces) + SHA-256, via node:crypto.
// Models: salted Merkle selective disclosure with decoy padding, bitstring status list with
// freshness policy, threshold-signed trust list, holder-bound + audience-bound presentations.
import { createHash, createPrivateKey, generateKeyPairSync, sign, verify, randomBytes, createPublicKey } from 'node:crypto';

const b64 = (b) => Buffer.from(b).toString('base64url');
const sha = (...parts) => createHash('sha256').update(Buffer.concat(parts.map((p) => Buffer.from(p)))).digest();
export const canon = (o) => JSON.stringify(sortKeys(o));
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}

// ---------- keys ----------
export function newKey() {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const pub = b64(publicKey.export({ type: 'spki', format: 'der' }));
  return { pub, privateKey };
}
/** Private key <-> JWK, for encrypted storage and for handing a bulk-issued holder key to a browser wallet. */
export const keyToJwk = (key) => key.privateKey.export({ format: 'jwk' });
export function keyFromJwk(jwk) {
  const privateKey = createPrivateKey({ key: jwk, format: 'jwk' });
  return { pub: b64(createPublicKey(privateKey).export({ type: 'spki', format: 'der' })), privateKey };
}
const pubObj = (pub) => createPublicKey({ key: Buffer.from(pub, 'base64url'), type: 'spki', format: 'der' });
const P1363 = { dsaEncoding: 'ieee-p1363' }; // fixed-length r||s; DER would fail against WebCrypto
export const signJSON = (obj, key) => b64(sign('sha256', Buffer.from(canon(obj)), { key: key.privateKey, ...P1363 }));
export const verifyJSON = (obj, sig, pub) => {
  try { return verify('sha256', Buffer.from(canon(obj)), { key: pubObj(pub), ...P1363 }, Buffer.from(sig, 'base64url')); } catch { return false; }
};
export const thumbprint = (pub) => b64(sha(pub)).slice(0, 22);

// ---------- Merkle with salted leaves + decoys ----------
const leafHash = (key, value, salt) => sha('leaf:', salt, ':', key, ':', canon(value));
const nodeHash = (l, r) => sha('node:', l, r);
export function buildTree(fields) {
  const keys = Object.keys(fields).sort();
  const leaves = keys.map((k) => { const salt = b64(randomBytes(16)); return { key: k, value: fields[k], salt, hash: leafHash(k, fields[k], salt) }; });
  let size = 1; while (size < leaves.length) size *= 2;
  const level0 = leaves.map((l) => l.hash);
  while (level0.length < size) level0.push(sha('decoy:', randomBytes(16))); // hides how many real fields exist
  const levels = [level0];
  while (levels.at(-1).length > 1) {
    const cur = levels.at(-1); const next = [];
    for (let i = 0; i < cur.length; i += 2) next.push(nodeHash(cur[i], cur[i + 1]));
    levels.push(next);
  }
  return { leaves, levels, root: b64(levels.at(-1)[0]), size };
}
function proofFor(tree, index) {
  const path = []; let i = index;
  for (let lv = 0; lv < tree.levels.length - 1; lv++) {
    const sib = i ^ 1; path.push({ h: b64(tree.levels[lv][sib]), left: sib < i }); i = i >> 1;
  }
  return path;
}
function rootFrom(leafH, path) {
  let h = leafH; for (const s of path) h = s.left ? nodeHash(Buffer.from(s.h, 'base64url'), h) : nodeHash(h, Buffer.from(s.h, 'base64url'));
  return b64(h);
}

// ---------- issuance ----------
export function issue({ issuerKey, issuerId, holderPub, fields, statusIndex, statusListId, ttlDays = 3650, kind = 'degree' }) {
  const tree = buildTree(fields);
  const header = { v: 1, kind, iss: issuerId, kid: thumbprint(issuerKey.pub), sub: thumbprint(holderPub), holder: holderPub,
    iat: Date.now(), exp: Date.now() + ttlDays * 864e5, root: tree.root, status: { list: statusListId, idx: statusIndex } };
  return { header, sig: signJSON(header, issuerKey), tree }; // tree stays with the holder (it holds salts)
}

/** JSON form of a credential for the holder's wallet: salts and tree levels, no Buffers. */
export function packCredential(c) {
  return { header: c.header, sig: c.sig, leaves: c.tree.leaves.map(({ key, value, salt }) => ({ key, value, salt })), levels: c.tree.levels.map((l) => l.map((h) => b64(h))) };
}

export const headerId = (h) => b64(sha(canon(h))); // stable id used in closing manifests

// ---------- holder presents ----------
export function present({ credential, holderKey, reveal, nonce, aud, ttlMs = 120000 }) {
  const { tree } = credential;
  const disclosures = reveal.map((k) => {
    const idx = tree.leaves.findIndex((l) => l.key === k); if (idx < 0) throw new Error('unknown field ' + k);
    const l = tree.leaves[idx]; return { key: k, value: l.value, salt: l.salt, path: proofFor(tree, idx) };
  });
  const body = { cred: { header: credential.header, sig: credential.sig }, disclosures };
  const kb = { nonce, aud, exp: Date.now() + ttlMs, dh: b64(sha(canon(body))) }; // key-binding: nonce + audience + what is shown
  return { ...body, kb, kbSig: signJSON(kb, holderKey) };
}

// ---------- status list (bitstring) ----------
export class StatusList {
  constructor(id, size = 131072) { this.id = id; this.bits = Buffer.alloc(size / 8); this.version = 1; }
  revoke(i) { this.bits[i >> 3] |= 1 << (i & 7); this.version++; }
  get(i) { return (this.bits[i >> 3] >> (i & 7)) & 1; }
  publish(issuerKey, now = Date.now()) {
    const body = { id: this.id, version: this.version, issuedAt: now, bits: this.bits.toString('base64') };
    return { body, sig: signJSON(body, issuerKey) };
  }
}
export const readBit = (list, i) => (Buffer.from(list.body.bits, 'base64')[i >> 3] >> (i & 7)) & 1;

// ---------- trust list: t-of-n signed ----------
export function signTrustList(entries, signers, version = 1) {
  const body = { version, issuedAt: Date.now(), entries }; // entries: { id, pub, tier }
  return { body, sigs: signers.map((k) => ({ by: k.pub, sig: signJSON(body, k) })) };
}
export function trustListOk(list, rootPubs, threshold) {
  const good = new Set(list.sigs.filter((s) => rootPubs.includes(s.by) && verifyJSON(list.body, s.sig, s.by)).map((s) => s.by));
  return good.size >= threshold;
}

// ---------- verifier ----------
export class Verifier {
  constructor({ audience, rootPubs, threshold = 2, minTier = 'B', maxStatusAgeMs = 864e5 }) {
    Object.assign(this, { audience, rootPubs, threshold, minTier, maxStatusAgeMs }); this.seen = new Set();
  }
  newChallenge() { return b64(randomBytes(16)); }
  check(p, { nonce, trustList, statusList, now = Date.now() }) {
    const out = { ok: false, reasons: [], warnings: [], claims: {} };
    const fail = (r) => { out.reasons.push(r); return out; };
    if (!trustListOk(trustList, this.rootPubs, this.threshold)) return fail('TRUST_LIST_BAD_SIGNATURES');
    const h = p.cred.header;
    const issuer = trustList.body.entries.find((e) => e.id === h.iss && thumbprint(e.pub) === h.kid);
    if (!issuer) return fail('ISSUER_NOT_IN_TRUST_LIST');
    const tiers = { A: 3, B: 2, C: 1 };
    if (tiers[issuer.tier] < tiers[this.minTier]) return fail('ISSUER_TIER_TOO_LOW');
    if (!verifyJSON(h, p.cred.sig, issuer.pub)) return fail('CREDENTIAL_SIGNATURE_INVALID');
    // issuer lifecycle (closure, derecognition, fake listing, key retirement): see docs/PROBLEMS_AND_SOLUTIONS.md
    const state = issuer.state || 'active';
    if (state === 'fake') return fail('ISSUER_LISTED_FAKE');
    if (issuer.retiredAt && h.iat > issuer.retiredAt) return fail('KEY_RETIRED_BEFORE_ISSUANCE');
    if (state === 'derecognised') {
      if (h.iat >= issuer.since) return fail('ISSUED_AFTER_DERECOGNITION');
      out.warnings.push('ISSUER_DERECOGNISED_LATER');
    }
    if (state === 'closed') {
      if (h.iat > issuer.closedAt) return fail('ISSUED_AFTER_CLOSURE');
      if (!(issuer.manifest || []).includes(headerId(h))) return fail('NOT_IN_CLOSING_MANIFEST'); // stops back-dated forgeries with a leaked key
      out.warnings.push('ISSUER_CLOSED'); out.custodian = issuer.custodian || null;
    }
    if (now > h.exp) return fail('CREDENTIAL_EXPIRED');
    // holder binding + freshness + audience
    if (!verifyJSON(p.kb, p.kbSig, h.holder)) return fail('HOLDER_BINDING_INVALID');
    if (p.kb.nonce !== nonce) return fail('NONCE_MISMATCH');
    if (this.seen.has(nonce)) return fail('NONCE_REPLAYED');
    if (p.kb.aud !== this.audience) return fail('AUDIENCE_MISMATCH');
    if (now > p.kb.exp) return fail('PRESENTATION_EXPIRED');
    const body = { cred: p.cred, disclosures: p.disclosures };
    if (p.kb.dh !== b64(sha(canon(body)))) return fail('DISCLOSURE_HASH_MISMATCH');
    // merkle proofs
    for (const d of p.disclosures) {
      const root = rootFrom(leafHash(d.key, d.value, d.salt), d.path);
      if (root !== h.root) return fail('MERKLE_PROOF_INVALID:' + d.key);
      out.claims[d.key] = d.value;
    }
    // status
    if (statusList.body.id !== h.status.list) return fail('STATUS_LIST_MISMATCH');
    if (!verifyJSON(statusList.body, statusList.sig, issuer.finalStatusSigner || issuer.pub)) return fail('STATUS_LIST_SIGNATURE_INVALID');
    if (state === 'closed') { if (statusList.body.version !== issuer.finalStatusVersion) return fail('STATUS_LIST_NOT_FINAL'); } // frozen at closure, so no max-age
    else if (now - statusList.body.issuedAt > this.maxStatusAgeMs) return fail('STATUS_LIST_STALE');
    if (readBit(statusList, h.status.idx)) return fail('REVOKED');
    this.seen.add(nonce); out.ok = true; out.issuer = h.iss; out.tier = issuer.tier; out.statusAgeMs = now - statusList.body.issuedAt;
    return out;
  }
}

// ---------- timeline engine (sweep-line overlap) ----------
export function timelineFlags(items) {
  const ev = items.flatMap((x) => [[x.start, 1, x], [x.end, -1, x]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const active = new Set(); const flags = [];
  for (const [, d, x] of ev) {
    if (d === 1) { for (const o of active) if (o.exclusive && x.exclusive) flags.push({ a: o.label, b: x.label, type: 'OVERLAP' }); active.add(x); }
    else active.delete(x);
  }
  for (const x of items) if (x.end < x.start) flags.push({ a: x.label, type: 'END_BEFORE_START' });
  return flags;
}
