// Encryption shared by the server and the browser wallet (WebCrypto only, so the same code runs in both).
// sealTo(): ECDH P-256 + HKDF-SHA256 + AES-256-GCM, so only the holder's device can open a Seal.
// secretBox(): AES-256-GCM with a random key, for share links (the key rides in the URL fragment).
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();

export const toB64 = (b: ArrayBuffer | Uint8Array) => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
export const fromB64 = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
};

const INFO = enc.encode("sigil-seal-v1");

async function wrapKey(priv: CryptoKey, pub: CryptoKey, usage: KeyUsage) {
  const bits = await subtle.deriveBits({ name: "ECDH", public: pub }, priv, 256);
  const hkdf = await subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: INFO },
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

/** Encrypt JSON to a holder's ECDH public key (spki, base64url). */
export async function sealTo(ecdhPub: string, data: unknown): Promise<string> {
  const pub = await subtle.importKey("spki", fromB64(ecdhPub), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const eph = await subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const key = await wrapKey(eph.privateKey, pub, "encrypt");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  const epk = await subtle.exportKey("spki", eph.publicKey);
  return [toB64(epk), toB64(iv), toB64(ct)].join(".");
}

/** Open a sealed box with the holder's ECDH private key. */
export async function openSeal(ecdhPriv: CryptoKey, box: string): Promise<unknown> {
  const [epk, iv, ct] = box.split(".");
  const pub = await subtle.importKey("spki", fromB64(epk), { name: "ECDH", namedCurve: "P-256" }, false, []);
  const key = await wrapKey(ecdhPriv, pub, "decrypt");
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct));
  return JSON.parse(dec.decode(pt));
}

/** Encrypt JSON under a fresh random key. Returns the ciphertext and the key for the link fragment. */
export async function secretBox(data: unknown): Promise<{ box: string; key: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const key = await subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return { box: [toB64(iv), toB64(ct)].join("."), key: toB64(raw) };
}

export async function openSecretBox(box: string, keyB64: string): Promise<unknown> {
  const [iv, ct] = box.split(".");
  const key = await subtle.importKey("raw", fromB64(keyB64), "AES-GCM", false, ["decrypt"]);
  const pt = await subtle.decrypt({ name: "AES-GCM", iv: fromB64(iv) }, key, fromB64(ct));
  return JSON.parse(dec.decode(pt));
}
