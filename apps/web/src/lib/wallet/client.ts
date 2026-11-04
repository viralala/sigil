"use client";

// The holder's wallet. Keys are non-extractable WebCrypto keys in IndexedDB; Seals are opened and presented here,
// so names and field values never reach the server except inside ciphertext or the proofs a holder chooses to share.
import { fromB64, openSeal, secretBox, toB64 } from "@/lib/sealbox";

const subtle = globalThis.crypto?.subtle;
const enc = new TextEncoder();

export type Packed = {
  header: { iss: string; kind: string; iat: number; [k: string]: unknown };
  sig: string;
  leaves: { key: string; value: unknown; salt: string }[];
  levels: string[][];
};
export type Card = {
  id: string;
  kind: string;
  title: string;
  org: string | null;
  from: string | null;
  to: string | null;
  requestId?: string;
};
export type StoredSeal = { id: string; orgName: string; credential: Packed; holderJwk?: JsonWebKey };

// ---- tiny IndexedDB key/value store ----
function idb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open("sigil-wallet", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("kv");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
export async function kvGet<T>(k: string): Promise<T | undefined> {
  const d = await idb();
  return new Promise((res, rej) => {
    const q = d.transaction("kv").objectStore("kv").get(k);
    q.onsuccess = () => res(q.result as T | undefined);
    q.onerror = () => rej(q.error);
  });
}
export async function kvSet(k: string, v: unknown) {
  const d = await idb();
  return new Promise<void>((res, rej) => {
    const t = d.transaction("kv", "readwrite");
    t.objectStore("kv").put(v, k);
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
}
export async function wipeLocal() {
  const d = await idb();
  d.close();
  await new Promise<void>((res) => {
    const r = indexedDB.deleteDatabase("sigil-wallet");
    r.onsuccess = r.onerror = r.onblocked = () => res();
  });
}

// ---- keys ----
type Keys = { sign: CryptoKeyPair; ecdh: CryptoKeyPair; signPub: string; ecdhPub: string };

async function keys(): Promise<Keys> {
  const have = await kvGet<Keys>("keys");
  if (have) return have;
  const sign = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const ecdh = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  const k = {
    sign,
    ecdh,
    signPub: toB64(await subtle.exportKey("spki", sign.publicKey)),
    ecdhPub: toB64(await subtle.exportKey("spki", ecdh.publicKey)),
  };
  await kvSet("keys", k);
  return k;
}

// Must match canon() in packages/core: JSON with object keys sorted, recursively.
function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === "object")
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]));
  return v;
}
export const canon = (o: unknown) => JSON.stringify(sortKeys(o));

async function signJSON(obj: unknown, key: CryptoKey) {
  return toB64(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(canon(obj))));
}

export class ApiError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: init?.json === undefined ? init?.headers : { "content-type": "application/json" },
      body: init?.json === undefined ? init?.body : JSON.stringify(init.json),
    });
  } catch {
    throw new ApiError("NETWORK");
  }
  const j = await res.json().catch(() => ({ error: "SERVER" }));
  if (!res.ok) throw new ApiError(j.error ?? "SERVER");
  return j as T;
}

/** Proves this device to the server. Creates the wallet on first use. */
export async function signIn() {
  const k = await keys();
  const { challenge } = await api<{ challenge: string }>("/api/wallet/challenge", { method: "POST" });
  const sig = await signJSON({ challenge }, k.sign.privateKey);
  await api("/api/wallet/login", { method: "POST", json: { signPub: k.signPub, ecdhPub: k.ecdhPub, challenge, sig } });
}

export type Me = {
  id: string;
  seals: { id: string; kind: string; ciphertext: string; org_name: string; request_id: string | null; revoked_at: string | null }[];
  requests: { id: string; kind: string; state: string; org_name: string }[];
  shares: { id: string; shown: string[]; expires_at: string; stopped_at: string | null; created_at: string; receipts: { verdict: string; at: string }[] }[];
};

/** Pulls server state and opens any new Seals on this device. */
export async function sync(): Promise<{ me: Me; seals: StoredSeal[] }> {
  let me: Me;
  try {
    me = await api<Me>("/api/wallet/me");
  } catch (e) {
    if ((e as ApiError).code !== "NOT_SIGNED_IN") throw e;
    await signIn();
    me = await api<Me>("/api/wallet/me");
  }
  const k = await keys();
  const seals = (await kvGet<StoredSeal[]>("seals")) ?? [];
  for (const s of me.seals) {
    if (seals.some((x) => x.id === s.id) || !s.ciphertext.includes(".") || s.ciphertext.split(".").length !== 3) continue;
    try {
      seals.push({ id: s.id, orgName: s.org_name, credential: (await openSeal(k.ecdh.privateKey, s.ciphertext)) as Packed });
    } catch {
      /* not sealed to this device */
    }
  }
  await kvSet("seals", seals);
  return { me, seals };
}

// ---- presenting ----
function proofFor(levels: string[][], index: number) {
  const path: { h: string; left: boolean }[] = [];
  let i = index;
  for (let lv = 0; lv < levels.length - 1; lv++) {
    const sib = i ^ 1;
    path.push({ h: levels[lv][sib], left: sib < i });
    i >>= 1;
  }
  return path;
}

async function holderKey(seal: StoredSeal): Promise<CryptoKey> {
  if (seal.holderJwk)
    return subtle.importKey("jwk", seal.holderJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  return (await keys()).sign.privateKey;
}

/** Selective disclosure: only `reveal` fields leave, with their proofs, bound to this share. */
export async function present(seal: StoredSeal, reveal: string[], shareId: string, days: number) {
  const c = seal.credential;
  const disclosures = reveal.map((k) => {
    const idx = c.leaves.findIndex((l) => l.key === k);
    const l = c.leaves[idx];
    return { key: k, value: l.value, salt: l.salt, path: proofFor(c.levels, idx) };
  });
  const body = { cred: { header: c.header, sig: c.sig }, disclosures };
  const digest = await subtle.digest("SHA-256", enc.encode(canon(body)));
  const kb = { nonce: shareId, aud: "sigil-share", exp: Date.now() + days * 864e5, dh: toB64(digest) };
  return { ...body, kb, kbSig: await signJSON(kb, await holderKey(seal)) };
}

export type SelfClaim = { kind: string; title: string; org: string | null; from: string | null; to: string | null };
export type Bundle = { name: string | null; presentations: unknown[]; self: SelfClaim[] };

export function newShareId() {
  const a = "abcdefghijklmnopqrstuvwxyz0123456789";
  return "sh_" + Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => a[b % a.length]).join("");
}

export async function sealBundle(bundle: Bundle) {
  return secretBox(bundle);
}

export async function sha256Hex(file: Blob) {
  const d = await subtle.digest("SHA-256", await file.arrayBuffer());
  return [...fromB64(toB64(d))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
