import { expect, test } from "@playwright/test";

test.describe("Release Candidate responsive and keyboard baseline", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("core workspaces avoid page-level horizontal overflow on mobile", async ({ page }) => {
    for (const path of ["/", "/playground", "/compare", "/diagnostics", "/settings"]) {
      await page.goto(path);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test("keyboard navigation exposes a visible focus target", async ({ page }) => {
    await page.goto("/settings");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });
});
