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
