import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const STAGE = process.argv[2] || "before"; // "before" or "after"
const PROD_URL = process.env.APP_URL || "https://citation-watch-app-genlayer.vercel.app";
const OUT_DIR = path.resolve(`docs/milestones/m1/fix1/${STAGE}`);
const MATRIX_JSON = path.resolve(`docs/milestones/m1/fix1/matrix_${STAGE}.json`);

fs.mkdirSync(OUT_DIR, { recursive: true });

const WIDTHS = [320, 360, 390, 414, 500, 768, 1024, 1440];
const HEIGHTS = [568, 667, 740, 900];

const SPECIAL_CELLS = [
  { name: "landscape_667x375", width: 667, height: 375, isLandscape: true },
  { name: "zoom_200_reflow_1280x800", width: 1280, height: 800, zoom: 2.0 },
  { name: "zoom_400_reflow_1280x800", width: 1280, height: 800, zoom: 4.0 },
];

async function run() {
  console.log(`Starting matrix capture for stage: ${STAGE}`);
  console.log(`Target: ${PROD_URL}`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  // 1. Standard grid cells
  for (const w of WIDTHS) {
    for (const h of HEIGHTS) {
      const cellName = `w${w}_h${h}`;
      console.log(`Capturing cell ${cellName} (${w}x${h})...`);
      const context = await browser.newContext({
        viewport: { width: w, height: h },
      });
      // Clear localStorage to trigger tour on load
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.removeItem("citationwatch_tour_dismissed");
        } catch {}
      });

      await page.goto(PROD_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);

      // Verify walkthrough modal is open
      const dialogLocator = page.locator('div[role="dialog"]');
      const dialogVisible = await dialogLocator.isVisible().catch(() => false);

      const metrics = await page.evaluate(() => {
        const dialogCard = document.querySelector('div[role="dialog"] > div');
        const allButtons = Array.from(document.querySelectorAll('button'));
        const closeBtn = document.querySelector('button[aria-label="Skip guided tour"], button[aria-label*="close" i], button[aria-label*="skip" i]');
        const nextBtn = allButtons.find((b) => b.textContent.includes("Next") || b.textContent.includes("Finish Tour"));
        const backBtn = allButtons.find((b) => b.textContent.includes("Back"));

        const vpW = window.innerWidth;
        const vpH = window.innerHeight;

        let modalInside = false;
        let closeVisible = false;
        let nextVisible = false;
        let cardRect = null;
        let closeRect = null;

        if (dialogCard) {
          const r = dialogCard.getBoundingClientRect();
          cardRect = { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height };
          modalInside = r.top >= 0 && r.left >= 0 && r.bottom <= vpH && r.right <= vpW;
        }

        if (closeBtn) {
          const cr = closeBtn.getBoundingClientRect();
          closeRect = { top: cr.top, left: cr.left, bottom: cr.bottom, right: cr.right };
          closeVisible = cr.top >= 0 && cr.left >= 0 && cr.bottom <= vpH && cr.right <= vpW;
        }

        if (nextBtn) {
          const nr = nextBtn.getBoundingClientRect();
          nextVisible = nr.top >= 0 && nr.left >= 0 && nr.bottom <= vpH && nr.right <= vpW;
        }

        const docScrollW = document.documentElement.scrollWidth;
        const docClientW = document.documentElement.clientWidth;
        const scrollWidthOk = docScrollW <= docClientW + 1; // 1px threshold for fractional subpixel

        // Find overflowing elements
        const overflowingElements = [];
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const r = el.getBoundingClientRect();
          if (r.right > vpW + 2 && r.width > 0 && r.height > 0) {
            const tag = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : "";
            const identifier = `${tag}${id}${cls ? `.${cls}` : ""}`;
            if (!overflowingElements.includes(identifier) && overflowingElements.length < 8) {
              overflowingElements.push(identifier);
            }
          }
        }

        return {
          modalInside,
          closeVisible,
          nextVisible,
          docScrollW,
          docClientW,
          scrollWidthOk,
          cardRect,
          closeRect,
          overflowingElements,
        };
      });

      const shotPath = path.join(OUT_DIR, `${cellName}.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      results.push({
        cell: cellName,
        width: w,
        height: h,
        dialogPresent: dialogVisible,
        modalBoundingBoxInsideViewport: metrics.modalInside,
        closeSkipControlVisible: metrics.closeVisible,
        nextBackVisible: metrics.nextVisible,
        documentScrollWidthGteClientWidth: metrics.scrollWidthOk,
        docScrollWidth: metrics.docScrollW,
        docClientWidth: metrics.docClientW,
        cardRect: metrics.cardRect,
        closeRect: metrics.closeRect,
        overflowingElements: metrics.overflowingElements,
        screenshot: `docs/milestones/m1/fix1/${STAGE}/${cellName}.png`,
        pass: metrics.modalInside && metrics.closeVisible && metrics.nextVisible && metrics.scrollWidthOk && metrics.overflowingElements.length === 0,
      });

      await context.close();
    }
  }

  // 2. Special cells: landscape and zoom
  for (const s of SPECIAL_CELLS) {
    console.log(`Capturing special cell ${s.name}...`);
    const context = await browser.newContext({
      viewport: { width: s.width, height: s.height },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      try {
        localStorage.removeItem("citationwatch_tour_dismissed");
      } catch {}
    });

    if (s.zoom) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: Math.round(s.width / s.zoom),
        height: Math.round(s.height / s.zoom),
        deviceScaleFactor: s.zoom,
        mobile: false,
      });
    }

    await page.goto(PROD_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const dialogLocator = page.locator('div[role="dialog"]');
    const dialogVisible = await dialogLocator.isVisible().catch(() => false);

    const metrics = await page.evaluate(() => {
      const dialogCard = document.querySelector('div[role="dialog"] > div');
      const allButtons = Array.from(document.querySelectorAll('button'));
      const closeBtn = document.querySelector('button[aria-label="Skip guided tour"], button[aria-label*="close" i], button[aria-label*="skip" i]');
      const nextBtn = allButtons.find((b) => b.textContent.includes("Next") || b.textContent.includes("Finish Tour"));

      const vpW = window.innerWidth;
      const vpH = window.innerHeight;

      let modalInside = false;
      let closeVisible = false;
      let nextVisible = false;
      let cardRect = null;
      let closeRect = null;

      if (dialogCard) {
        const r = dialogCard.getBoundingClientRect();
        cardRect = { top: r.top, left: r.left, bottom: r.bottom, right: r.right, width: r.width, height: r.height };
        modalInside = r.top >= 0 && r.left >= 0 && r.bottom <= vpH && r.right <= vpW;
      }

      if (closeBtn) {
        const cr = closeBtn.getBoundingClientRect();
        closeRect = { top: cr.top, left: cr.left, bottom: cr.bottom, right: cr.right };
        closeVisible = cr.top >= 0 && cr.left >= 0 && cr.bottom <= vpH && cr.right <= vpW;
      }

      if (nextBtn) {
        const nr = nextBtn.getBoundingClientRect();
        nextVisible = nr.top >= 0 && nr.left >= 0 && nr.bottom <= vpH && nr.right <= vpW;
      }

      const docScrollW = document.documentElement.scrollWidth;
      const docClientW = document.documentElement.clientWidth;
      const scrollWidthOk = docScrollW <= docClientW + 1;

      const overflowingElements = [];
      const allElements = document.querySelectorAll("*");
      for (const el of allElements) {
        const r = el.getBoundingClientRect();
        if (r.right > vpW + 2 && r.width > 0 && r.height > 0) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : "";
          const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 3).join(".") : "";
          const identifier = `${tag}${id}${cls ? `.${cls}` : ""}`;
          if (!overflowingElements.includes(identifier) && overflowingElements.length < 8) {
            overflowingElements.push(identifier);
          }
        }
      }

      return {
        modalInside,
        closeVisible,
        nextVisible,
        docScrollW,
        docClientW,
        scrollWidthOk,
        cardRect,
        closeRect,
        overflowingElements,
      };
    });

    const shotPath = path.join(OUT_DIR, `${s.name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    results.push({
      cell: s.name,
      width: s.width,
      height: s.height,
      special: s.isLandscape ? "landscape" : `zoom_${s.zoom * 100}%`,
      dialogPresent: dialogVisible,
      modalBoundingBoxInsideViewport: metrics.modalInside,
      closeSkipControlVisible: metrics.closeVisible,
      nextBackVisible: metrics.nextVisible,
      documentScrollWidthGteClientWidth: metrics.scrollWidthOk,
      docScrollWidth: metrics.docScrollW,
      docClientWidth: metrics.docClientW,
      cardRect: metrics.cardRect,
      closeRect: metrics.closeRect,
      overflowingElements: metrics.overflowingElements,
      screenshot: `docs/milestones/m1/fix1/${STAGE}/${s.name}.png`,
      pass: metrics.modalInside && metrics.closeVisible && metrics.nextVisible && metrics.scrollWidthOk && metrics.overflowingElements.length === 0,
    });

    await context.close();
  }

  await browser.close();

  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  const outputData = {
    capturedAt: new Date().toISOString(),
    stage: STAGE,
    targetUrl: PROD_URL,
    totalCells: total,
    passedCells: passed,
    failedCells: failed,
    cells: results,
  };

  fs.writeFileSync(MATRIX_JSON, JSON.stringify(outputData, null, 2), "utf8");
  console.log(`\nCompleted matrix for ${STAGE}: ${passed}/${total} passed (${failed} failed).`);
  console.log(`Wrote results to ${MATRIX_JSON}`);
}

run().catch((err) => {
  console.error("Matrix capture failed:", err);
  process.exit(1);
});
