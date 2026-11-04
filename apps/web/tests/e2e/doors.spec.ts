import { expect, test, type Page } from "@playwright/test";

// The real path, against the real database: resume -> ask -> registrar taps yes -> share -> recruiter checks.
const RESUME = `Asha Tester
asha@example.com

Education
B.Tech Computer Engineering, Sample Deccan Institute of Technology, 2022 - 2026

Experience
Software Intern, Sample Kestrel Systems, Jun 2025 - Aug 2025

Skills
Python, TypeScript`;

async function holderWithCard(page: Page) {
  await page.goto("/wallet");
  await expect(page.getByTestId("wallet")).toBeVisible();
  await page.getByTestId("name").fill("Asha Tester");
  await page.getByTestId("save-name").click();
  await page.getByTestId("to-resume").click();
  await page.getByTestId("resume-text").fill(RESUME);
  await page.getByTestId("read").click();
  await expect(page.getByTestId("found")).toBeVisible();
  await page.getByTestId("keep").click();
  await expect(page.getByTestId("claim-card").first()).toBeVisible();
}

async function issuerSignIn(page: Page) {
  await page.goto("/sign");
  await page.getByTestId("use-demo").click();
  await page.getByTestId("enter").click();
  await expect(page.getByTestId("console")).toBeVisible();
}

test.describe("full journey", () => {
  test.describe.configure({ timeout: 90_000 });

  test("resume to Seal to share to check, then stop sharing", async ({ page, browser }) => {
    await holderWithCard(page);
    const card = page.getByTestId("claim-card").first();
    await card.getByTestId("ask").click();
    await card.getByTestId("org-pick").selectOption({ label: "Sample Deccan Institute of Technology" });
    await card.getByTestId("send-ask").click();
    await expect(card).toHaveAttribute("data-state", "pending");

    const reg = await (await browser.newContext()).newPage();
    await issuerSignIn(reg);
    const mine = reg.getByTestId("request").filter({ hasText: "Asha Tester" }).first();
    await mine.getByTestId("yes").click();
    await expect(reg.getByTestId("sign-note")).toContainText("Signed");

    await page.getByTestId("refresh").click();
    await expect(card).toHaveAttribute("data-state", "sealed");

    await page.getByTestId("to-share").click();
    await expect(page.getByTestId("consent")).toBeVisible();
    await page.getByTestId("create-share").click();
    await expect(page.getByTestId("share-done")).toBeVisible();
    const link = await page.getByTestId("share-link").inputValue();
    expect(link).toMatch(/\/s\/sh_[a-z0-9]{16}#k=/);

    const hr = await (await browser.newContext()).newPage();
    await hr.goto(link);
    await expect(hr.getByTestId("share-view")).toHaveAttribute("data-verdict", "green");
    await expect(hr.getByTestId("view-witness").first()).toContainText("confirmed it in their Sigil console");
    // Strict needs a stronger witness than console confirmation.
    await hr.getByTestId("strict").selectOption("A");
    await expect(hr.getByTestId("share-view")).toHaveAttribute("data-verdict", "yellow");

    await page.goto("/wallet/activity");
    await expect(page.getByTestId("view-count").first()).toContainText("1");
    await page.getByTestId("stop-share").first().click();
    await hr.reload();
    await expect(hr.getByTestId("view-error")).toContainText("stopped sharing");

    // Cleans up after itself.
    await page.goto("/wallet");
    await page.getByTestId("danger").locator("summary").click();
    await page.getByTestId("erase").click();
    await page.getByTestId("erase-confirm").click();
    await expect(page.getByTestId("wallet-gone")).toBeVisible();
  });

  test("a cancelled Seal goes red on an existing link", async ({ page, browser }) => {
    await issuerSignIn(page);
    await page.getByTestId("tab-bulk").click();
    await page.getByTestId("csv").fill("name,title,year,ref\nTest Holder,B.Tech Test,2026,E2E-CANCEL\n,no name,2026,E2E-BAD");
    await page.getByTestId("bulk-run").click();
    await expect(page.getByTestId("bulk-bad")).toContainText("Line 2");
    const path = await page.getByTestId("bulk-links").locator("li").first().textContent();

    const holder = await (await browser.newContext()).newPage();
    await holder.goto(path!);
    await holder.getByTestId("claim-add").click();
    await expect(holder.getByTestId("claim-done")).toBeVisible();
    await holder.goto("/wallet/share");
    await holder.getByTestId("create-share").click();
    const link = await holder.getByTestId("share-link").inputValue();

    const hr = await (await browser.newContext()).newPage();
    await hr.goto(link);
    await expect(hr.getByTestId("share-view")).toHaveAttribute("data-verdict", "green");

    await page.getByTestId("tab-issued").click();
    await page.getByTestId("issued").filter({ hasText: "E2E-CANCEL" }).first().getByTestId("cancel").click();
    await expect(page.getByTestId("issued").filter({ hasText: "E2E-CANCEL" }).first()).toContainText("Cancelled");

    await hr.reload();
    await expect(hr.getByTestId("share-view")).toHaveAttribute("data-verdict", "red");
    await expect(hr.getByTestId("view-claim").first()).toContainText("cancelled this record");

    const again = await (await browser.newContext()).newPage();
    await again.goto(path!);
    await expect(again.getByTestId("claim-error")).toContainText("already used");
  });

  test("a link with a wrong key says it is broken", async ({ page }) => {
    await page.goto("/s/sh_0000000000000000#k=abc");
    await expect(page.getByTestId("view-error")).toContainText("does not exist");
  });
});

test.describe("sign console", () => {
  test("wrong code is refused with the next step", async ({ page }) => {
    await page.goto("/sign");
    await page.getByTestId("org").selectOption("deccan");
    await page.getByTestId("code").fill("wrong-code");
    await page.getByTestId("enter").click();
    await expect(page.getByTestId("sign-error")).toContainText("not right");
  });
});

test.describe("recruiter", () => {
  test("bulk check filters and exports", async ({ page }) => {
    await page.goto("/recruiter");
    await page.getByTestId("run").click();
    await expect(page.getByTestId("bulk-error")).toContainText("at least one");
    await page.getByTestId("add-samples").click();
    await page.getByTestId("run").click();
    await expect(page.getByTestId("row")).toHaveCount(10, { timeout: 30_000 });
    await page.getByTestId("filter-red").click();
    await expect(page.getByTestId("row")).toHaveCount(5);
    const dl = page.waitForEvent("download");
    await page.getByTestId("download").click();
    expect((await dl).suggestedFilename()).toBe("sigil-check-report.csv");
  });
});

test.describe("paper check", () => {
  test("an unknown image says not verified, never fake, and gives a machine guess", async ({ page }) => {
    await page.goto("/paper");
    await page.getByTestId("paper-file").setInputFiles("public/icon-512.png");
    await page.getByTestId("paper-run").click();
    await expect(page.getByTestId("paper-hash")).toHaveAttribute("data-match", "false");
    await expect(page.getByTestId("paper-hash")).toContainText("does not mean it is fake");
    await expect(page.getByTestId("paper-scan")).toContainText("machine guess");
  });
  test("a non-image is refused", async ({ page }) => {
    await page.goto("/paper");
    await page.getByTestId("paper-file").setInputFiles({ name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await page.getByTestId("paper-run").click();
    await expect(page.getByTestId("paper-error")).toContainText("could not read");
  });
});
