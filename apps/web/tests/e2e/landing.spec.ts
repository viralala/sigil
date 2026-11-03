import { expect, test } from "@playwright/test";

test.describe("landing", () => {
  test("three giant tiles, each goes somewhere that works", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/ask who signed it/i);
    const tiles = page.getByRole("navigation", { name: /what do you want to do/i }).getByRole("link");
    await expect(tiles).toHaveCount(3);
    for (const [name, path, heading] of [
      [/get verified/i, "/get-verified", /get verified/i],
      [/check someone/i, "/check", /check someone/i],
      [/sign for my students/i, "/sign", /sign for my students/i],
    ] as const) {
      await page.goto("/");
      await page.getByRole("link", { name }).click();
      await expect(page).toHaveURL(new RegExp(path + "$"));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });

  test("tiles are big enough to tap (56px+)", async ({ page }) => {
    await page.goto("/");
    for (const link of await page.getByRole("navigation", { name: /what do you want to do/i }).getByRole("link").all()) {
      const box = await link.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(56);
    }
  });

  test("explainer can be paused and stepped by hand", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("explainer-toggle");
    await expect(toggle).toHaveText(/pause/i);
    await toggle.click();
    await expect(toggle).toHaveText(/play/i);
    await page.getByRole("button", { name: /they scan/i }).click();
    await expect(page.getByRole("button", { name: /they scan/i })).toHaveAttribute("aria-current", "step");
  });

  test("language switch changes the page to Hindi and back", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("lang").selectOption("hi");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("असली");
    await page.getByTestId("lang").selectOption("mr");
    await expect(page.locator("html")).toHaveAttribute("lang", "mr");
    await page.getByTestId("lang").selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("no console errors on the landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("works at 320px wide without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ["/", "/check", "/get-verified", "/sign"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("PWA manifest and offline page are served", async ({ request, page }) => {
    const m = await request.get("/manifest.webmanifest");
    expect(m.ok()).toBe(true);
    expect((await m.json()).icons.length).toBeGreaterThan(1);
    expect((await request.get("/sw.js")).ok()).toBe(true);
    await page.goto("/offline");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/offline/i);
  });
});
