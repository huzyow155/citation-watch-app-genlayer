import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.APP_URL || "https://citation-watch-app-genlayer.vercel.app";
const OUT_FILE = path.resolve("docs/milestones/m1/fix1/accessibility_audit.json");

const WIDTHS = [1440, 500, 390];
const HEIGHT = 800;

async function runAudit() {
  console.log(`Starting Axe accessibility audit against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const w of WIDTHS) {
    // 1. Landing page (tour dismissed)
    {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem("citationwatch_tour_dismissed", "true");
        } catch {}
      });
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const axeResults = await new AxeBuilder({ page }).analyze();
      results.push({
        target: "Landing page",
        url: "/",
        width: w,
        violationsCount: axeResults.violations.length,
        violations: axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
        passesCount: axeResults.passes.length,
      });
      await context.close();
    }

    // 2. Workbench page /app
    {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem("citationwatch_tour_dismissed", "true");
        } catch {}
      });
      await page.goto(`${BASE_URL}/app`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);

      const axeResults = await new AxeBuilder({ page }).analyze();
      results.push({
        target: "Workbench page",
        url: "/app",
        width: w,
        violationsCount: axeResults.violations.length,
        violations: axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
        passesCount: axeResults.passes.length,
      });
      await context.close();
    }

    // 3. Landing page with Tour modal open
    {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.removeItem("citationwatch_tour_dismissed");
        } catch {}
      });
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForSelector('div[role="dialog"]');
      await page.waitForTimeout(400);

      const axeResults = await new AxeBuilder({ page }).analyze();
      results.push({
        target: "Walkthrough modal",
        url: "/ (tour open)",
        width: w,
        violationsCount: axeResults.violations.length,
        violations: axeResults.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
        passesCount: axeResults.passes.length,
      });
      await context.close();
    }

    // 4. Funding modal
    {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem("citationwatch_tour_dismissed", "true");
        } catch {}
      });
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const btn = page.locator('button[aria-label="Get Test Funds & Gas Guide"]');
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForSelector('div[role="dialog"]');
        await page.waitForTimeout(400);
        const axeResults = await new AxeBuilder({ page }).analyze();
        results.push({
          target: "Funding modal",
          url: "/ (funding open)",
          width: w,
          violationsCount: axeResults.violations.length,
          violations: axeResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          passesCount: axeResults.passes.length,
        });
      }
      await context.close();
    }

    // 5. Wallet modal
    {
      const context = await browser.newContext({ viewport: { width: w, height: HEIGHT } });
      const page = await context.newPage();
      await page.addInitScript(() => {
        try {
          localStorage.setItem("citationwatch_tour_dismissed", "true");
        } catch {}
      });
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      const walletBtn = page.locator('button:has-text("Connect"), button:has-text("0x")').first();
      if (await walletBtn.isVisible()) {
        await walletBtn.click();
        await page.waitForSelector('div[role="dialog"]');
        await page.waitForTimeout(400);
        const axeResults = await new AxeBuilder({ page }).analyze();
        results.push({
          target: "Wallet modal",
          url: "/ (wallet open)",
          width: w,
          violationsCount: axeResults.violations.length,
          violations: axeResults.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          })),
          passesCount: axeResults.passes.length,
        });
      }
      await context.close();
    }
  }

  await browser.close();

  const auditOutput = {
    auditedAt: new Date().toISOString(),
    tool: "@axe-core/playwright",
    targetUrl: BASE_URL,
    totalScenarios: results.length,
    scenarios: results,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(auditOutput, null, 2));
  console.log(`Axe audit completed. Results written to ${OUT_FILE}`);
  console.log(`Total scenarios: ${results.length}, Summary:`);
  for (const r of results) {
    console.log(`- [${r.width}px] ${r.target}: ${r.violationsCount} violations, ${r.passesCount} passes`);
  }
}

runAudit().catch(console.error);
