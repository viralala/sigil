import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// docs/QA.md: zero serious or critical axe issues. Tagged @a11y so `pnpm a11y` runs just these.
async function audit(page: import("@playwright/test").Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  return r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

for (const path of ["/", "/check", "/get-verified", "/sign", "/offline"]) {
  test(`@a11y ${path} has no serious or critical issues`, async ({ page }) => {
    await page.goto(path);
    expect(await audit(page)).toEqual([]);
  });
}

for (const id of ["asha-degree", "kabir-revoked", "arjun-unknown-signer"]) {
  test(`@a11y result screen ${id} has no serious or critical issues`, async ({ page }) => {
    await page.goto(`/check?s=${id}`);
    await expect(page.getByTestId("result")).toBeVisible();
    for (const d of await page.locator("details").all()) await d.locator("summary").click();
    expect(await audit(page)).toEqual([]);
  });
}

test("@a11y keyboard only: check a sample without a mouse", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard path is a desktop concern");
  await page.goto("/check");
  await page.getByLabel(/their sigil link/i).focus();
  await page.keyboard.type("asha-degree");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "green");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});
