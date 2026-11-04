// @vitest-environment node
import { webcrypto } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fromB64, openSeal, openSecretBox, sealTo, secretBox, toB64 } from "@/lib/sealbox";
import { parseCsv } from "@/components/sign/sign-app";

async function holder() {
  const k = await webcrypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
  return { priv: k.privateKey as CryptoKey, pub: toB64(await webcrypto.subtle.exportKey("spki", k.publicKey)) };
}

describe("sealbox", () => {
  it("only the holder's key opens a sealed box", async () => {
    const a = await holder();
    const b = await holder();
    const box = await sealTo(a.pub, { name: "Priya" });
    expect(box).not.toContain("Priya");
    expect(await openSeal(a.priv, box)).toEqual({ name: "Priya" });
    await expect(openSeal(b.priv, box)).rejects.toThrow();
  });
  it("a secret box needs its key, and tampering fails", async () => {
    const { box, key } = await secretBox({ a: 1 });
    expect(await openSecretBox(box, key)).toEqual({ a: 1 });
    await expect(openSecretBox(box, toB64(new Uint8Array(32)))).rejects.toThrow();
    const [iv, ct] = box.split(".");
    const bad = fromB64(ct);
    bad[0] ^= 1;
    await expect(openSecretBox(`${iv}.${toB64(bad)}`, key)).rejects.toThrow();
  });
  it("base64url round trips", () => {
    const u = new Uint8Array([0, 255, 62, 63, 1]);
    expect([...fromB64(toB64(u))]).toEqual([...u]);
  });
});

describe("parseCsv", () => {
  it("reads quoted cells and skips blank lines", () => {
    expect(parseCsv('name,title\n"Nair, Priya",B.Tech\n\nRavi,M.Tech')).toEqual([
      { name: "Nair, Priya", title: "B.Tech" },
      { name: "Ravi", title: "M.Tech" },
    ]);
  });
  it("needs a header and a row", () => expect(parseCsv("name")).toEqual([]));
});
