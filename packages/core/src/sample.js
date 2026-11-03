// Sample data pack (P1). Everything here is fictional and labelled "Sample": invented organisations,
// invented people, keys generated fresh on every start. It drives /check and the attack-round demo.
// The holder's wallet is simulated server side, so a demo check runs the real issue -> present -> verify path.
import { newKey, issue, present, Verifier, StatusList, signTrustList, signJSON, headerId } from './sigil.js';

const DAY = 864e5;

// Codes that mean "nobody we trust vouched for this" (witness rule: unverified, never fake).
const NO_WITNESS = new Set(['ISSUER_NOT_IN_TRUST_LIST', 'ISSUER_TIER_TOO_LOW']);
// Warnings that still need a human look.
const NEEDS_LOOK = new Set(['ISSUER_DERECOGNISED_LATER']);

export function verdictOf(r) {
  if (r.ok) return r.warnings.some((w) => NEEDS_LOOK.has(w)) ? 'yellow' : 'green';
  return r.reasons.every((c) => NO_WITNESS.has(c)) ? 'yellow' : 'red';
}

export const SAMPLE_ORGS = [
  { id: 'did:web:deccan-tech.sample', name: 'Sample Deccan Institute of Technology', kind: 'college', tier: 'A', state: 'active', inTrustList: true },
  { id: 'did:web:konkan-college.sample', name: 'Sample Konkan College of Engineering', kind: 'college', tier: 'A', state: 'closed', inTrustList: true, custodian: 'Sample Western University (records office)' },
  { id: 'did:web:sahyadri-poly.sample', name: 'Sample Sahyadri Polytechnic', kind: 'college', tier: 'A', state: 'derecognised', inTrustList: true },
  { id: 'did:web:kestrel.sample', name: 'Sample Kestrel Systems', kind: 'employer', tier: 'B', state: 'active', inTrustList: true },
  { id: 'did:web:indigo-labs.sample', name: 'Sample Indigo Labs', kind: 'employer', tier: 'B', state: 'active', inTrustList: true },
  { id: 'did:web:tideway.sample', name: 'Sample Tideway Logistics', kind: 'employer', tier: 'B', state: 'active', inTrustList: true },
  { id: 'did:web:global-open-univ.sample', name: 'Sample Global Open University of Excellence', kind: 'college', tier: 'A', state: 'fake', listed: 'fake', inTrustList: true },
  { id: 'did:web:unlisted-academy.sample', name: 'Sample Unlisted Academy', kind: 'college', tier: 'A', state: 'active', inTrustList: false },
];

// Witness metadata per org kind: who vouches and how (docs/PROBLEMS_AND_SOLUTIONS.md, section 0).
const WITNESS = {
  college: { level: 'W1', how: 'signed' },
  employer: { level: 'W3', how: 'email-confirmed' },
};

/** The ten sample credentials. `attack` says how the demo breaks it. */
export const SAMPLE_CASES = [
  { id: 'asha-degree', person: 'Asha Verma', org: 'did:web:deccan-tech.sample', kind: 'degree', fields: { name: 'Asha Verma', degree: 'B.Tech Computer Engineering', year: 2026, grade: 8.7, dob: '2004-02-11' }, reveal: ['name', 'degree', 'year'] },
  { id: 'rohan-internship', person: 'Rohan Iyer', org: 'did:web:kestrel.sample', kind: 'job', fields: { name: 'Rohan Iyer', role: 'Software Intern', from: '2025-06', to: '2025-08', stipend: 15000 }, reveal: ['name', 'role', 'from', 'to'] },
  { id: 'meera-closed-college', person: 'Meera Joshi', org: 'did:web:konkan-college.sample', kind: 'degree', fields: { name: 'Meera Joshi', degree: 'B.E. Electronics', year: 2022, grade: 7.9 }, reveal: ['name', 'degree', 'year'], issuedDaysAgo: 1400 },
  { id: 'kabir-revoked', person: 'Kabir Shah', org: 'did:web:deccan-tech.sample', kind: 'degree', fields: { name: 'Kabir Shah', degree: 'B.Tech Mechanical Engineering', year: 2025 }, reveal: ['name', 'degree', 'year'], attack: 'revoked' },
  { id: 'dev-edited-grade', person: 'Dev Kulkarni', org: 'did:web:deccan-tech.sample', kind: 'degree', fields: { name: 'Dev Kulkarni', degree: 'B.Tech Civil Engineering', year: 2026, grade: 6.1 }, reveal: ['name', 'degree', 'grade'], attack: 'edited' },
  { id: 'zoya-fake-college', person: 'Zoya Khan', org: 'did:web:global-open-univ.sample', kind: 'degree', fields: { name: 'Zoya Khan', degree: 'MBA', year: 2024 }, reveal: ['name', 'degree', 'year'] },
  { id: 'arjun-unknown-signer', person: 'Arjun Rao', org: 'did:web:unlisted-academy.sample', kind: 'certificate', fields: { name: 'Arjun Rao', course: 'Cloud Fundamentals', year: 2025 }, reveal: ['name', 'course', 'year'] },
  { id: 'isha-derecognised', person: 'Isha Pawar', org: 'did:web:sahyadri-poly.sample', kind: 'degree', fields: { name: 'Isha Pawar', degree: 'Diploma in Computer Technology', year: 2023 }, reveal: ['name', 'degree', 'year'], issuedDaysAgo: 1100 },
  { id: 'neel-relayed', person: 'Neel Desai', org: 'did:web:indigo-labs.sample', kind: 'job', fields: { name: 'Neel Desai', role: 'Data Analyst', from: '2024-01', to: '2025-12' }, reveal: ['name', 'role', 'from', 'to'], attack: 'relayed' },
  { id: 'tara-backdated', person: 'Tara Menon', org: 'did:web:konkan-college.sample', kind: 'degree', fields: { name: 'Tara Menon', degree: 'B.E. Computer Engineering', year: 2021 }, reveal: ['name', 'degree', 'year'], issuedDaysAgo: 1500, attack: 'backdated' },
].map((c) => ({ sample: true, ...c }));

/** Builds the whole fictional world: keys, trust list, status lists, credentials. */
export function buildSampleWorld({ audience, now = Date.now() }) {
  const roots = [newKey(), newKey(), newKey()];
  const keys = Object.fromEntries(SAMPLE_ORGS.map((o) => [o.id, newKey()]));
  const lists = Object.fromEntries(SAMPLE_ORGS.map((o) => [o.id, new StatusList(o.id + '#status')]));
  const closedAt = now - 400 * DAY;
  const derecognisedSince = now - 300 * DAY;

  const creds = {};
  SAMPLE_CASES.forEach((c, i) => {
    const holder = newKey();
    const cred = issue({ issuerKey: keys[c.org], issuerId: c.org, holderPub: holder.pub, fields: c.fields,
      statusIndex: 100 + i, statusListId: lists[c.org].id, kind: c.kind });
    if (c.issuedDaysAgo) { cred.header.iat = now - c.issuedDaysAgo * DAY; cred.sig = signJSON(cred.header, keys[c.org]); }
    if (c.attack === 'revoked') lists[c.org].revoke(100 + i);
    creds[c.id] = { cred, holder };
  });

  // Closed college: genuine credentials go in the closing manifest; the back-dated forgery does not.
  const konkan = 'did:web:konkan-college.sample';
  const manifest = SAMPLE_CASES.filter((c) => c.org === konkan && c.attack !== 'backdated').map((c) => headerId(creds[c.id].cred.header));
  const finalStatus = lists[konkan].publish(keys[konkan], closedAt);

  const entries = SAMPLE_ORGS.filter((o) => o.inTrustList).map((o) => {
    const e = { id: o.id, pub: keys[o.id].pub, tier: o.tier, state: o.state };
    if (o.state === 'closed') Object.assign(e, { closedAt, manifest, custodian: o.custodian, finalStatusVersion: finalStatus.body.version });
    if (o.state === 'derecognised') e.since = derecognisedSince;
    return e;
  });
  const trust = signTrustList(entries, [roots[0], roots[1]]);
  const verifier = new Verifier({ audience, rootPubs: roots.map((r) => r.pub), threshold: 2 });

  return { audience, orgs: SAMPLE_ORGS, keys, lists, creds, trust, verifier, finalStatus, lastNonce: {}, extra: {}, nextIndex: 1000 };
}

/** Runs one real check of a sample: fresh challenge, simulated wallet presents, verifier decides. */
export function checkSample(world, id, { replay = false } = {}) {
  const c = SAMPLE_CASES.find((x) => x.id === id) ?? world.extra[id];
  if (!c) throw Object.assign(new Error('UNKNOWN_SAMPLE'), { code: 'UNKNOWN_SAMPLE' });
  const { cred, holder } = world.creds[id];
  const org = world.orgs.find((o) => o.id === c.org);
  const nonce = replay && world.lastNonce[id] ? world.lastNonce[id] : world.verifier.newChallenge();
  world.lastNonce[id] = nonce;
  const aud = c.attack === 'relayed' ? 'https://some-other-recruiter.example' : world.audience;
  const p = present({ credential: cred, holderKey: holder, reveal: c.reveal, nonce, aud });
  if (c.attack === 'edited') p.disclosures.find((d) => d.key === 'grade').value = 9.6;
  const statusList = org.state === 'closed' ? world.finalStatus : world.lists[c.org].publish(world.keys[c.org]);
  const r = world.verifier.check(p, { nonce, trustList: world.trust, statusList });
  return {
    sample: true,
    id,
    verdict: verdictOf(r),
    kind: c.kind,
    person: c.person,
    claims: r.ok ? r.claims : {},
    shownCount: c.reveal.length,
    reasons: r.reasons,
    warnings: r.warnings,
    custodian: r.custodian ?? null,
    issuer: { id: org.id, name: org.name, kind: org.kind, state: org.state, tier: org.inTrustList ? org.tier : null },
    // Witness rule: only a passing check names a witness.
    witness: r.ok ? { ...WITNESS[org.kind], who: org.name, when: new Date(cred.header.iat).toISOString() } : null,
    details: { alg: 'Ed25519 (spike; ES256 planned)', kid: cred.header.kid, statusAgeMs: r.statusAgeMs ?? null, trustListVersion: world.trust.body.version },
    checkedAt: new Date().toISOString(),
  };
}

const CONFIRMING_ORG = 'did:web:deccan-tech.sample';
const MAX_EXTRA = 500; // memory guard for the in-memory demo world

/** The registrar taps "Yes, that is right": the sample college signs a new degree credential. */
export function confirmSample(world, { name, degree, year }) {
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');
  const n = clean(name); const d = clean(degree); const y = Number(year);
  if (n.length < 2 || n.length > 80 || d.length < 2 || d.length > 80 || !Number.isInteger(y) || y < 1950 || y > 2100) {
    throw Object.assign(new Error('BAD_INPUT'), { code: 'BAD_INPUT' });
  }
  if (Object.keys(world.extra).length >= MAX_EXTRA) { world.extra = {}; }
  const id = 'confirmed-' + newKey().pub.slice(-10).toLowerCase().replace(/[^a-z0-9]/g, 'x');
  const holder = newKey();
  const cred = issue({ issuerKey: world.keys[CONFIRMING_ORG], issuerId: CONFIRMING_ORG, holderPub: holder.pub,
    fields: { name: n, degree: d, year: y }, statusIndex: world.nextIndex++, statusListId: world.lists[CONFIRMING_ORG].id, kind: 'degree' });
  world.creds[id] = { cred, holder };
  world.extra[id] = { id, sample: true, person: n, org: CONFIRMING_ORG, kind: 'degree', fields: { name: n, degree: d, year: y }, reveal: ['name', 'degree', 'year'] };
  return id;
}
