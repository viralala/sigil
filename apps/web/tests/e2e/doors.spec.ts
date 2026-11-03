import { expect, test } from "@playwright/test";

test.describe("get verified", () => {
  test("shows a Sample Seal with a QR and a link that checks green", async ({ page }) => {
    await page.goto("/get-verified");
    await expect(page.getByTestId("seal")).toContainText("Asha Verma");
    await expect(page.getByTestId("seal").getByText("Sample", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /QR code/i })).toBeVisible();
    await expect(page.getByTestId("share-url")).toHaveText(/\/s\/asha-degree$/);
    await page.getByTestId("try-seal").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "green");
  });

  test("copy link reports success or tells you what to do", async ({ page, context, browserName }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => undefined);
    await page.goto("/get-verified");
    await page.getByTestId("copy-link").click();
    await expect(page.getByTestId("copy-status")).toHaveText(/Link copied\.|Could not copy/);
    expect(browserName).toBe("chromium");
  });
});

test.describe("sign for my students", () => {
  test("Yes signs a new Seal that then checks green", async ({ page }) => {
    await page.goto("/sign");
    await page.getByTestId("f-name").fill("Ravi Kumar");
    await page.getByTestId("confirm-yes").click();
    await expect(page.getByTestId("confirm-done")).toContainText("Ravi Kumar now has a Seal");
    await page.getByTestId("check-new").click();
    await expect(page.getByTestId("result")).toHaveAttribute("data-verdict", "green");
    await expect(page.getByTestId("sentence")).toContainText("Ravi Kumar");
  });

  test("No signs nothing and says so", async ({ page }) => {
    await page.goto("/sign");
    await page.getByTestId("confirm-no").click();
    await expect(page.getByTestId("confirm-declined")).toContainText(/Nothing was signed/);
    await page.getByRole("button", { name: /try another/i }).click();
    await expect(page.getByTestId("confirm-yes")).toBeVisible();
  });

  test("bad input shows what to fix", async ({ page }) => {
    await page.goto("/sign");
    await page.getByTestId("f-year").fill("12");
    await page.getByTestId("confirm-yes").click();
    await expect(page.getByTestId("confirm-error")).toHaveText(/year from 1950 to 2100/);
  });
});
