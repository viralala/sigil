// Types for the parts of @sigil/core the web app uses. The JS in sigil.js is the source of truth.

export type Verdict = "green" | "yellow" | "red";
export type WitnessLevel = "W1" | "W2" | "W3" | "W4" | "W5";
export type OrgState = "active" | "suspended" | "merged" | "renamed" | "closed" | "derecognised" | "fake";

export interface SampleOrg {
  id: string;
  name: string;
  kind: "college" | "employer";
  tier: "A" | "B" | "C";
  state: OrgState;
  inTrustList: boolean;
  custodian?: string;
  listed?: "fake";
}

export interface SampleCase {
  id: string;
  sample: true;
  person: string;
  org: string;
  kind: "degree" | "job" | "certificate";
  fields: Record<string, string | number>;
  reveal: string[];
  attack?: "revoked" | "edited" | "relayed" | "backdated";
  issuedDaysAgo?: number;
}

export interface Witness {
  level: WitnessLevel;
  how: "signed" | "email-confirmed";
  who: string;
  when: string;
}

export interface CheckResult {
  sample: true;
  id: string;
  verdict: Verdict;
  kind: SampleCase["kind"];
  person: string;
  claims: Record<string, string | number>;
  shownCount: number;
  reasons: string[];
  warnings: string[];
  custodian: string | null;
  issuer: { id: string; name: string; kind: SampleOrg["kind"]; state: OrgState; tier: string | null };
  witness: Witness | null;
  details: { alg: string; kid: string; statusAgeMs: number | null; trustListVersion: number };
  checkedAt: string;
}

export interface SampleWorld {
  audience: string;
  orgs: SampleOrg[];
  [key: string]: unknown;
}

export const SAMPLE_ORGS: SampleOrg[];
export const SAMPLE_CASES: SampleCase[];
export function buildSampleWorld(opts: { audience: string; now?: number }): SampleWorld;
export function checkSample(world: SampleWorld, id: string, opts?: { replay?: boolean }): CheckResult;
export function verdictOf(r: { ok: boolean; reasons: string[]; warnings: string[] }): Verdict;
export function confirmSample(world: SampleWorld, input: { name: string; degree: string; year: number }): string;

// Trust engine (used by server routes)
export interface Key { pub: string; privateKey: unknown }
export interface PackedCredential {
  header: Record<string, unknown> & { iat: number; kid: string; iss: string; holder: string; status: { list: string; idx: number } };
  sig: string;
  leaves: { key: string; value: unknown; salt: string }[];
  levels: string[][];
}
export interface SignedList<B> { body: B; sig: string }
export interface TrustList { body: { version: number; issuedAt: number; entries: Record<string, unknown>[] }; sigs: { by: string; sig: string }[] }
export function newKey(): Key;
export function keyToJwk(key: Key): Record<string, unknown>;
export function keyFromJwk(jwk: Record<string, unknown>): Key;
export function signJSON(obj: unknown, key: Key): string;
export function verifyJSON(obj: unknown, sig: string, pub: string): boolean;
export function thumbprint(pub: string): string;
export function canon(o: unknown): string;
export function headerId(h: unknown): string;
export function issue(o: { issuerKey: Key; issuerId: string; holderPub: string; fields: Record<string, unknown>; statusIndex: number; statusListId: string; ttlDays?: number; kind?: string }): { header: PackedCredential["header"]; sig: string; tree: unknown };
export function packCredential(c: unknown): PackedCredential;
export function signTrustList(entries: Record<string, unknown>[], signers: Key[], version?: number): TrustList;
export function trustListOk(list: TrustList, rootPubs: string[], threshold: number): boolean;
export function timelineFlags(items: unknown[]): { a: string; b?: string; type: string }[];
export class Verifier {
  constructor(o: { audience: string; rootPubs: string[]; threshold?: number; minTier?: string; maxStatusAgeMs?: number });
  newChallenge(): string;
  check(p: unknown, o: { nonce: string; trustList: TrustList; statusList: unknown; now?: number }): { ok: boolean; reasons: string[]; warnings: string[]; claims: Record<string, unknown>; custodian?: string | null; issuer?: string; tier?: string; statusAgeMs?: number };
}
