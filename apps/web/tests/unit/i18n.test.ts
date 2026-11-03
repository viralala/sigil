import { describe, expect, it } from "vitest";
import { getDict, LOCALES, fill } from "@/lib/i18n";

function leaves(o: unknown, p = ""): [string, string][] {
  if (Array.isArray(o)) return o.flatMap((v, i) => leaves(v, `${p}[${i}]`));
  if (o && typeof o === "object") return Object.entries(o).flatMap(([k, v]) => leaves(v, p ? `${p}.${k}` : k));
  return [[p, String(o)]];
}

describe("i18n", () => {
  const base = leaves(getDict("en")).map(([k]) => k).sort();
  for (const l of LOCALES) {
    it(`${l} has every key English has, and no empty strings`, () => {
      const got = leaves(getDict(l));
      expect(got.map(([k]) => k).sort()).toEqual(base);
      for (const [k, v] of got) expect(v.trim().length, k).toBeGreaterThan(0);
    });
    it(`${l} keeps every placeholder English uses`, () => {
      const enMap = new Map(leaves(getDict("en")));
      for (const [k, v] of leaves(getDict(l))) {
        const want = (enMap.get(k)!.match(/\{\w+\}/g) ?? []).sort();
        expect((v.match(/\{\w+\}/g) ?? []).sort(), k).toEqual(want);
      }
    });
  }
  it("English copy has no em dashes and no jargon words", () => {
    const text = leaves(getDict("en")).map(([, v]) => v).join(" ").toLowerCase();
    expect(text).not.toContain("—");
    for (const w of ["hash", "merkle", "credential", "nonce", "jwt", "did:"]) expect(text).not.toContain(w);
  });
  it("English sentences stay short (12 words or fewer)", () => {
    const long = leaves(getDict("en"))
      .map(([, v]) => v)
      .filter((s) => !s.startsWith("Sigil:"))
      .flatMap((s) => s.split(/(?<=[.?!])\s+/))
      .filter((s) => s.replace(/\{\w+\}/g, "X").split(/\s+/).length > 12);
    expect(long).toEqual([]);
  });
  it("fill replaces placeholders and keeps unknown ones visible", () => {
    expect(fill("{a} and {b}", { a: 1 })).toBe("1 and {b}");
  });
});
