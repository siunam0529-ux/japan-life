import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/login",
  "/notifications",
  "/life-helper",
  "/life-helper/join",
  "/life-helper/join/business",
  "/life-helper/join/helper",
  "/admin",
  "/admin/community",
  "/admin/community/check",
  "/admin/community/stats",
  "/admin/life-helper",
] as const;

test.describe("Japan Life final smoke test", () => {
  for (const route of routes) {
    test(`${route} opens without obvious errors`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("body")).not.toContainText(/This page could not be found/i);
      await expect(page.locator("body")).not.toContainText(/Application error/i);
      await expect(page.locator("body")).not.toContainText(/Something went wrong/i);
      await expect(page.locator("body")).not.toContainText(/^404$/m);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  test("key mobile pages do not overflow horizontally at 390px", async ({ page }) => {
    const mobileRoutes = [
      "/",
      "/community/all",
      "/community/all/new",
      "/community/me",
      "/community/profile",
      "/notifications",
      "/life-helper",
      "/admin",
      "/admin/community",
      "/admin/life-helper",
    ] as const;

    await page.setViewportSize({ height: 844, width: 390 });

    for (const route of mobileRoutes) {
      await page.goto(route);
      await expect(page.locator("body")).not.toContainText(/This page could not be found/i);
      await expect(page.locator("body")).not.toContainText(/Application error/i);
      await expect(page.locator("body")).not.toContainText(/Something went wrong/i);
      const metrics = await page.evaluate(() => ({
        bodyWidth: document.body.scrollWidth,
        htmlWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(Math.max(metrics.bodyWidth, metrics.htmlWidth), route).toBeLessThanOrEqual(metrics.viewportWidth + 2);
    }
  });
});
