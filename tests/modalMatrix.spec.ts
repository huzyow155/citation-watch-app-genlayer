import { test, expect } from "@playwright/test";

const WIDTHS = [320, 360, 390, 414, 500, 768, 1024, 1440];
const HEIGHTS = [568, 667, 740, 900];
const PROD_URL = process.env.APP_URL || "https://citation-watch-app-genlayer.vercel.app";

test.describe("Walkthrough Modal Responsive Viewport Matrix", () => {
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      test(`modal bounding box and controls visible without overflow at ${w}x${h}`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await page.addInitScript(() => {
          try {
            localStorage.removeItem("citationwatch_tour_dismissed");
          } catch {}
        });
        await page.goto(PROD_URL, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);

        const dialog = page.locator('div[role="dialog"]');
        await expect(dialog).toBeVisible();

        const metrics = await page.evaluate(() => {
          const dialogCard = document.querySelector('div[role="dialog"] > div');
          const closeBtn = document.querySelector('button[aria-label="Skip guided tour"], button[aria-label*="close" i], button[aria-label*="skip" i]');
          const nextBtn = Array.from(document.querySelectorAll("button")).find(
            (b) => b.textContent && (b.textContent.includes("Next") || b.textContent.includes("Finish Tour"))
          );

          const vpW = window.innerWidth;
          const vpH = window.innerHeight;

          const cardRect = dialogCard ? dialogCard.getBoundingClientRect() : null;
          const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
          const nextRect = nextBtn ? nextBtn.getBoundingClientRect() : null;

          return {
            modalInside: cardRect ? cardRect.top >= 0 && cardRect.left >= 0 && cardRect.bottom <= vpH && cardRect.right <= vpW : false,
            closeVisible: closeRect ? closeRect.top >= 0 && closeRect.bottom <= vpH && closeRect.left >= 0 && closeRect.right <= vpW : false,
            nextVisible: nextRect ? nextRect.top >= 0 && nextRect.bottom <= vpH && nextRect.left >= 0 && nextRect.right <= vpW : false,
            noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
            docScrollWidth: document.documentElement.scrollWidth,
            docClientWidth: document.documentElement.clientWidth,
          };
        });

        expect(metrics.modalInside).toBe(true);
        expect(metrics.closeVisible).toBe(true);
        expect(metrics.nextVisible).toBe(true);
        expect(metrics.noHorizontalOverflow).toBe(true);
      });
    }
  }

  test("modal and controls visible in landscape 667x375", async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("citationwatch_tour_dismissed");
      } catch {}
    });
    await page.goto(PROD_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const metrics = await page.evaluate(() => {
      const dialogCard = document.querySelector('div[role="dialog"] > div');
      const closeBtn = document.querySelector('button[aria-label="Skip guided tour"], button[aria-label*="close" i], button[aria-label*="skip" i]');
      const nextBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent && (b.textContent.includes("Next") || b.textContent.includes("Finish Tour"))
      );

      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      const cardRect = dialogCard ? dialogCard.getBoundingClientRect() : null;
      const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const nextRect = nextBtn ? nextBtn.getBoundingClientRect() : null;

      return {
        modalInside: cardRect ? cardRect.top >= 0 && cardRect.left >= 0 && cardRect.bottom <= vpH && cardRect.right <= vpW : false,
        closeVisible: closeRect ? closeRect.top >= 0 && closeRect.bottom <= vpH && closeRect.left >= 0 && closeRect.right <= vpW : false,
        nextVisible: nextRect ? nextRect.top >= 0 && nextRect.bottom <= vpH && nextRect.left >= 0 && nextRect.right <= vpW : false,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(metrics.modalInside).toBe(true);
    expect(metrics.closeVisible).toBe(true);
    expect(metrics.nextVisible).toBe(true);
    expect(metrics.noHorizontalOverflow).toBe(true);
  });

  test("modal reflows without overflow at 400% zoom (1280x800 desktop reflow)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 320,
      height: 200,
      deviceScaleFactor: 4,
      mobile: false,
    });
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("citationwatch_tour_dismissed");
      } catch {}
    });
    await page.goto(PROD_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    const metrics = await page.evaluate(() => {
      const dialogCard = document.querySelector('div[role="dialog"] > div');
      const closeBtn = document.querySelector('button[aria-label="Skip guided tour"], button[aria-label*="close" i], button[aria-label*="skip" i]');
      const nextBtn = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent && (b.textContent.includes("Next") || b.textContent.includes("Finish Tour"))
      );

      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      const cardRect = dialogCard ? dialogCard.getBoundingClientRect() : null;
      const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const nextRect = nextBtn ? nextBtn.getBoundingClientRect() : null;

      return {
        modalInside: cardRect ? cardRect.top >= 0 && cardRect.left >= 0 && cardRect.bottom <= vpH && cardRect.right <= vpW : false,
        closeVisible: closeRect ? closeRect.top >= 0 && closeRect.bottom <= vpH && closeRect.left >= 0 && closeRect.right <= vpW : false,
        nextVisible: nextRect ? nextRect.top >= 0 && nextRect.bottom <= vpH && nextRect.left >= 0 && nextRect.right <= vpW : false,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(metrics.modalInside).toBe(true);
    expect(metrics.closeVisible).toBe(true);
    expect(metrics.nextVisible).toBe(true);
    expect(metrics.noHorizontalOverflow).toBe(true);
  });
});
