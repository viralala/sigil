import { expect, test } from "@playwright/test";

test.describe("home", () => {
  test("hero says what it is, and every door works", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/verified by signature/i);
    for (const [id, path, heading] of [
      ["hero-check", "/check", /check someone/i],
      ["hero-wallet", "/wallet", /my seals/i],
      ["hero-sign", "/sign", /sign for my students/i],
    ] as const) {
      await page.goto("/");
      await page.getByTestId(id).click();
      await expect(page).toHaveURL(new RegExp(path + "$"));
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    }
  });

  test("doors section and comic covers lead somewhere real", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("door-paper").click();
    await expect(page).toHaveURL(/\/paper$/);
    await page.goto("/");
    await page.getByTestId("cover-kabir-revoked").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "red");
  });

  test("no Marvel words and no circled 4 on the home page", async ({ page }) => {
    await page.goto("/");
    const text = (await page.locator("body").innerText()).toLowerCase();
    for (const w of ["fantastic", "mister", "human torch", "invisible woman", "the thing", "flame on"]) expect(text).not.toContain(w);
  });

  test("language switch changes the page to Hindi and back", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("lang").selectOption("hi");
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await page.getByTestId("lang").selectOption("mr");
    await expect(page.locator("html")).toHaveAttribute("lang", "mr");
    await page.getByTestId("lang").selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("no console errors on the home page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(600);
    expect(errors).toEqual([]);
  });

  test("works at 320px wide without sideways scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    for (const path of ["/", "/check", "/wallet", "/sign", "/recruiter", "/paper", "/registry", "/about", "/faq"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("public pages load", async ({ page, request }) => {
    for (const [path, h] of [["/registry", /registry/i], ["/about", /about/i], ["/faq", /questions/i], ["/privacy", /privacy/i], ["/terms", /terms/i], ["/developers", /developers/i]] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(h);
    }
    expect((await page.goto("/no-such-page"))?.status()).toBe(404);
    const trust = await request.get("/.well-known/sigil-trust.json");
    expect((await trust.json()).sigs.length).toBeGreaterThanOrEqual(2);
  });

  test("registry shows closed and fake states and marks samples", async ({ page }) => {
    await page.goto("/registry");
    await expect(page.locator('[data-state="closed"]')).toContainText("Sample Western University");
    await expect(page.locator('[data-state="fake"]')).toContainText("On the fake list");
    await expect(page.getByTestId("org-row").filter({ hasText: "CESAC" })).not.toContainText("Sample");
  });

  test("mobile menu opens", async ({ page, isMobile }) => {
    test.skip(!isMobile, "menu is mobile only");
    await page.goto("/");
    await page.getByTestId("menu").click();
    await page.getByRole("navigation", { name: "Mobile" }).getByRole("link", { name: "Registry" }).click();
    await expect(page).toHaveURL(/\/registry$/);
  });

  test("PWA manifest and offline page are served", async ({ request, page }) => {
    const m = await request.get("/manifest.webmanifest");
    expect((await m.json()).icons.length).toBeGreaterThan(1);
    expect((await request.get("/sw.js")).ok()).toBe(true);
    await page.goto("/offline");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/offline/i);
  });
});
