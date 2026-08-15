import { expect, test } from "@playwright/test";

test("all Phase 2 workspace routes are reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.locator(".app-sidebar").getByRole("link", { name: "Playground", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Playground" })).toBeVisible();
  await page.locator(".app-sidebar").getByRole("link", { name: "Compare", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Compare", exact: true })).toBeVisible();
});
