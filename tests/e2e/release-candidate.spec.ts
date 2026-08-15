import { expect, test } from "@playwright/test";

const destinations = ["Dashboard", "Playground", "Compare", "History", "Diagnostics", "Saved prompts", "Providers", "Documentation", "Settings"] as const;

test("Release Candidate routes, theme control, and command shortcut remain usable in a fresh browser", async ({ page }) => {
  await page.goto("/");
  for (const label of destinations) {
    if (label !== "Dashboard") await page.locator(".app-sidebar").getByRole("link", { name: label, exact: true }).click();
    await expect(page.locator(".context-bar h1")).toContainText(label === "Saved prompts" ? "Saved prompts" : label);
    if (label === "Saved prompts") await page.getByRole("button", { name: "Close" }).click();
  }
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press(process.platform === "darwin" ? "Meta+K" : "Control+K");
  await expect(page.getByRole("dialog", { name: "Command menu" })).toBeVisible();
});
