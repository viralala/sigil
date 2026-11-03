import { describe, expect, it } from "vitest";
import { parseShareLink } from "@/lib/link";

describe("parseShareLink", () => {
  it("accepts a bare id", () => expect(parseShareLink("asha-degree")).toEqual({ ok: true, id: "asha-degree" }));
  it("accepts a share URL on any host (we never fetch it)", () =>
    expect(parseShareLink("https://sigil.example/s/asha-degree")).toEqual({ ok: true, id: "asha-degree" }));
  it("accepts a /check?s= URL", () =>
    expect(parseShareLink("http://localhost:3000/check?s=kabir-revoked")).toEqual({ ok: true, id: "kabir-revoked" }));
  it("rejects empty", () => expect(parseShareLink("  ")).toEqual({ ok: false, error: "EMPTY" }));
  it("rejects non-strings", () => expect(parseShareLink(42)).toEqual({ ok: false, error: "EMPTY" }));
  it("rejects huge input", () => expect(parseShareLink("a".repeat(501))).toEqual({ ok: false, error: "TOO_LONG" }));
  it("rejects other protocols", () => expect(parseShareLink("javascript:alert(1)").ok).toBe(false));
  it("rejects encoded path tricks", () => expect(parseShareLink("https://x.example/s/..%2Fetc").ok).toBe(false));
  it("rejects uppercase and spaces", () => expect(parseShareLink("Asha Degree").ok).toBe(false));
});
