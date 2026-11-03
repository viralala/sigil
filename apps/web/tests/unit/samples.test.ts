import { describe, expect, it } from "vitest";
import { SAMPLE_CASES } from "@sigil/core";
import { SAMPLE_BUTTONS } from "@/lib/samples";
import { getDict } from "@/lib/i18n";

describe("sample buttons", () => {
  it("cover exactly the core sample pack, with the same people", () => {
    const core = Object.fromEntries(SAMPLE_CASES.map((c) => [c.id, c.person]));
    expect(SAMPLE_BUTTONS.map((b) => b.id).sort()).toEqual(Object.keys(core).sort());
    for (const b of SAMPLE_BUTTONS) expect(b.person).toBe(core[b.id]);
  });
  it("every tag has a label", () => {
    const tags = getDict("en").check.tags;
    for (const b of SAMPLE_BUTTONS) for (const t of b.tags) expect(tags[t]).toBeTruthy();
  });
});
