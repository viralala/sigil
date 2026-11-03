import { expect, test, type Page } from "@playwright/test";

async function runSample(page: Page, id: string) {
  await page.goto("/check");
  await page.locator(`[data-sample="${id}"]`).click();
  await expect(page.getByTestId("result")).toBeVisible();
  return page.getByTestId("result");
}

test.describe("/check", () => {
  test("green: names the witness, shows a plain sentence, is labelled Sample", async ({ page }) => {
    const r = await runSample(page, "asha-degree");
    await expect(r).toHaveAttribute("data-verdict", "green");
    await expect(r.getByRole("heading", { name: /real/i })).toBeVisible();
    await expect(page.getByTestId("sentence")).toHaveText(/Asha Verma finished B\.Tech Computer Engineering at Sample Deccan/);
    await expect(page.getByTestId("witness")).toContainText(/signed it themselves/);
    await expect(r.getByTestId("sample-tag")).toBeVisible();
    // the hidden grade never reaches the page
    await expect(page.locator("body")).not.toContainText("8.7");
  });

  test("Why? and Details for nerds open", async ({ page }) => {
    await runSample(page, "asha-degree");
    await page.getByTestId("why").locator("summary").click();
    await expect(page.getByTestId("why")).toContainText(/signature matches/i);
    await page.getByTestId("nerds").locator("summary").click();
    await expect(page.getByTestId("nerds")).toContainText("did:web:deccan-tech.sample");
  });

  test("employer claim is witnessed by email, not a signature from a college", async ({ page }) => {
    await runSample(page, "rohan-internship");
    await expect(page.getByTestId("witness")).toContainText(/confirmed it by official email/);
  });

  test("closed college still checks, and says who keeps its records", async ({ page }) => {
    const r = await runSample(page, "meera-closed-college");
    await expect(r).toHaveAttribute("data-verdict", "green");
    await expect(r).toContainText(/has closed\. Its records are kept by Sample Western University/);
  });

  for (const [id, reason] of [
    ["kabir-revoked", /cancelled this record/],
    ["dev-edited-grade", /changed after it was shared/],
    ["zoya-fake-college", /list of fake colleges/],
    ["neel-relayed", /made for someone else/],
    ["tara-backdated", /not on its final list/],
  ] as const) {
    test(`attack ${id} is red with a plain reason`, async ({ page }) => {
      const r = await runSample(page, id);
      await expect(r).toHaveAttribute("data-verdict", "red");
      await expect(r.getByRole("heading", { name: /not real/i })).toBeVisible();
      await page.getByTestId("why").locator("summary").click();
      await expect(page.getByTestId("why")).toContainText(reason);
    });
  }

  test("unknown signer is yellow Not verified, never called fake", async ({ page }) => {
    const r = await runSample(page, "arjun-unknown-signer");
    await expect(r).toHaveAttribute("data-verdict", "yellow");
    await expect(r.getByRole("heading", { name: /not verified/i })).toBeVisible();
    await expect(page.getByTestId("witness")).toHaveText(/No one has vouched for this yet/);
    await expect(page.getByTestId("sentence")).toContainText(/does not mean it is fake/);
  });

  test("derecognised later is yellow Check this", async ({ page }) => {
    const r = await runSample(page, "isha-derecognised");
    await expect(r).toHaveAttribute("data-verdict", "yellow");
    await expect(r.getByRole("heading", { name: /check this/i })).toBeVisible();
  });

  test("pasting a share link works", async ({ page, baseURL }) => {
    await page.goto("/check");
    await page.getByLabel(/their sigil link/i).fill(`${baseURL}/s/asha-degree`);
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "green");
  });

  test("a scanned /s/ link opens and checks straight away", async ({ page }) => {
    await page.goto("/s/kabir-revoked");
    await expect(page).toHaveURL(/\/check\?s=kabir-revoked$/);
    await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "red");
  });

  test("empty and bad input show an error with the next step", async ({ page }) => {
    await page.goto("/check");
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("check-error")).toHaveText(/empty\. Paste a link first/);
    await page.getByLabel(/their sigil link/i).fill("javascript:alert(1)");
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("check-error")).toHaveText(/not a Sigil link\. Ask them to send it again/);
    await page.getByLabel(/their sigil link/i).fill("nobody-here");
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("check-error")).toHaveText(/could not find that link/);
  });

  test("loading state says what is happening", async ({ page }) => {
    await page.route("**/api/verify", async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.continue();
    });
    await page.goto("/check");
    await page.getByLabel(/their sigil link/i).fill("asha-degree");
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("check-loading")).toHaveText(/Checking the signature/);
    await expect(page.getByTestId("result")).toBeVisible();
  });

  test("network failure shows a retry message", async ({ page }) => {
    await page.route("**/api/verify", (route) => route.abort());
    await page.goto("/check");
    await page.getByLabel(/their sigil link/i).fill("asha-degree");
    await page.getByTestId("check-submit").click();
    await expect(page.getByTestId("check-error")).toHaveText(/could not reach Sigil/);
  });

  test("camera blocked: scan explains and offers the paste box", async ({ page, context }) => {
    await context.clearPermissions();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
      });
    });
    await page.goto("/check");
    await page.getByTestId("scan").click();
    await expect(page.getByTestId("check-error")).toHaveText(/camera is blocked/);
  });

  test("Check another resets to an empty box", async ({ page }) => {
    await runSample(page, "asha-degree");
    await page.getByTestId("again").click();
    await expect(page.getByLabel(/their sigil link/i)).toHaveValue("");
    await expect(page.getByLabel(/their sigil link/i)).toBeFocused();
  });

  test("Read aloud toggles when the browser can speak", async ({ page }) => {
    await page.addInitScript(() => {
      const fake = { speak: () => undefined, cancel: () => undefined };
      Object.defineProperty(window, "speechSynthesis", { value: fake });
      (window as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = class {
        text: string;
        constructor(t: string) {
          this.text = t;
        }
      };
    });
    await runSample(page, "asha-degree");
    const b = page.getByTestId("read-aloud");
    await b.click();
    await expect(b).toHaveAttribute("aria-pressed", "true");
    await b.click();
    await expect(b).toHaveAttribute("aria-pressed", "false");
  });
});
