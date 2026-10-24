import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";

const PROD_URL = process.env.APP_URL || "https://citation-watch-app-genlayer.vercel.app";
const BEFORE_DIR = path.resolve("docs/milestones/m1/before");
const METRICS_FILE = path.resolve("docs/milestones/m1/metrics_before.json");

if (!fs.existsSync(BEFORE_DIR)) {
  fs.mkdirSync(BEFORE_DIR, { recursive: true });
}

async function main() {
  console.log("Launching browser for baseline capture against:", PROD_URL);
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();

  // Landing Desktop
  console.log("Navigating to landing page (desktop)...");
  await page.goto(PROD_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(BEFORE_DIR, "landing_desktop.png"), fullPage: true });

  const axeLandingDesktop = await new AxeBuilder({ page }).analyze();
  console.log("Landing desktop axe violations:", axeLandingDesktop.violations.length);

  // Check interactive elements touch target size desktop/mobile
  const landingTouchAudit = await page.evaluate(() => {
    const interactives = Array.from(document.querySelectorAll("button, a, input, select, textarea"));
    let under44 = 0;
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        under44++;
      }
    });
    return { total: interactives.length, under44 };
  });

  // Open wallet modal
  const connectBtn = page.locator("button:has-text('Connect')").first();
  if (await connectBtn.isVisible()) {
    await connectBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(BEFORE_DIR, "wallet_modal_desktop.png") });
    // close modal
    const closeBtn = page.locator("button:has-text('\u2715'), button:has-text('Cancel')").first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(300);
    }
  }

  // Workbench Desktop
  console.log("Navigating to workbench (desktop)...");
  await page.goto(`${PROD_URL}/workbench`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(BEFORE_DIR, "workbench_desktop.png"), fullPage: true });

  const axeWorkbenchDesktop = await new AxeBuilder({ page }).analyze();
  console.log("Workbench desktop axe violations:", axeWorkbenchDesktop.violations.length);

  const workbenchAudit = await page.evaluate(() => {
    const interactives = Array.from(document.querySelectorAll("button, a, input, select, textarea"));
    let under44 = 0;
    interactives.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        under44++;
      }
    });

    // Check headings
    const h1s = Array.from(document.querySelectorAll("h1")).map(h => h.textContent?.trim());
    const h2s = Array.from(document.querySelectorAll("h2")).map(h => h.textContent?.trim());
    
    // Check write buttons
    const writeButtons = Array.from(document.querySelectorAll("button")).filter(b => {
      const t = b.textContent || "";
      return t.includes("Register") || t.includes("Audit") || t.includes("Publish") || t.includes("Refresh");
    });
    const writeBtnCount = writeButtons.length;

    // Check if write buttons have adjacent funding instructions/guards
    const hasFundingCallout = Array.from(document.querySelectorAll("*")).filter(el => {
      const t = el.textContent || "";
      return t.includes("faucet") || t.includes("Get Test Funds") || t.includes("Insufficient balance");
    }).length;

    return {
      interactivesCount: interactives.length,
      under44,
      h1s,
      h2Count: h2s.length,
      writeBtnCount,
      hasFundingCallout
    };
  });

  // Mobile Context
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();

  console.log("Navigating to landing (mobile)...");
  await mobilePage.goto(PROD_URL, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2000);
  await mobilePage.screenshot({ path: path.join(BEFORE_DIR, "landing_mobile.png"), fullPage: true });
  const axeLandingMobile = await new AxeBuilder({ page: mobilePage }).analyze();

  console.log("Navigating to workbench (mobile)...");
  await mobilePage.goto(`${PROD_URL}/workbench`, { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(2500);
  await mobilePage.screenshot({ path: path.join(BEFORE_DIR, "workbench_mobile.png"), fullPage: true });
  const axeWorkbenchMobile = await new AxeBuilder({ page: mobilePage }).analyze();

  const mobileOverflow = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth;
  });

  await browser.close();

  // Metrics summary
  function summarizeViolations(axeResult) {
    const byImpact = { minor: 0, moderate: 0, serious: 0, critical: 0 };
    axeResult.violations.forEach(v => {
      const imp = v.impact || "minor";
      if (byImpact[imp] !== undefined) byImpact[imp]++;
    });
    return {
      totalViolations: axeResult.violations.length,
      byImpact,
      violations: axeResult.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length }))
    };
  }

  const metrics = {
    capturedAt: new Date().toISOString(),
    targetUrl: PROD_URL,
    headCommit: "9da5734",
    routes: ["/", "/workbench"],
    axeAudits: {
      landingDesktop: summarizeViolations(axeLandingDesktop),
      landingMobile: summarizeViolations(axeLandingMobile),
      workbenchDesktop: summarizeViolations(axeWorkbenchDesktop),
      workbenchMobile: summarizeViolations(axeWorkbenchMobile)
    },
    touchTargets: {
      landingDesktopUnder44px: landingTouchAudit.under44,
      landingDesktopTotal: landingTouchAudit.total,
      workbenchUnder44px: workbenchAudit.under44,
      workbenchTotal: workbenchAudit.interactivesCount
    },
    mobileOverflowFree: mobileOverflow,
    onboarding: {
      hasInteractiveGuidedTour: false,
      hasWalkthroughModalOrPill: false,
      tourStepsCount: 0
    },
    fundingGuide: {
      hasDedicatedFundingGuideViewOrModal: false,
      hasPreWriteBalanceValidationGuard: false,
      writeButtonsWithFundingNotes: 0,
      totalWriteButtons: workbenchAudit.writeBtnCount
    },
    errorHandling: {
      hasErrorBoundaryComponent: false,
      hasSpecificConsensusDisagreementDetail: false,
      skeletonLoadersPresent: false
    },
    testSuite: {
      vitestTestFiles: 5,
      vitestTests: 37
    }
  };

  fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2), "utf8");
  console.log("Baseline metrics written to", METRICS_FILE);
}

main().catch(err => {
  console.error("Baseline capture error:", err);
  process.exit(1);
});
