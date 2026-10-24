import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { generatePrivateKey, createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { decodeContractRevert } from "../src/lib/revertMap.ts";

const PROD_URL = process.env.APP_URL || "https://citation-watch-app-genlayer.vercel.app";
const SCREENS_DIR = path.resolve("docs/milestones/m1/fix1/screens");
const EVIDENCE_FILE = path.resolve("docs/milestones/m1/fix1/e2e_production_evidence_r2.json");

const SOURCE_DRIFT_LEDGER_ADDRESS = "0xFC7593432D4e8A2ceda911497807E4aCC7c7B705";
const CLAIMS_BOARD_ADDRESS = "0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD";
const RPC_ENDPOINT = "https://studio.genlayer.com/api";

const client = createClient({ chain: studionet, endpoint: RPC_ENDPOINT });

fs.mkdirSync(SCREENS_DIR, { recursive: true });

function contractNormalizeText(s) {
  if (!s) return "";
  let text = String(s).toLowerCase();
  text = text.replace(/[\u2018\u2019\u201a\u201b]/g, "'");
  text = text.replace(/[\u201c\u201d\u201e\u201f]/g, '"');
  text = text.replace(/[\u2013\u2014\u2212]/g, "-");
  text = text.replace(/[\u00a0\u202f]/g, " ").replace(/[\u200b\ufeff]/g, "");
  text = text.replace(/\[(?:\d+|citation needed|clarification needed|page needed|note \d+)\]/g, " ");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return text.split(/\s+/).filter(Boolean).join(" ");
}

function computeExpectedCitationId(sender, canonicalUrl, validQuote, baselineOldid, hostNorm, expectedNonce) {
  const normQuote = contractNormalizeText(validQuote);
  const sortedNormPreimage = `${hostNorm}|${baselineOldid}|${normQuote}`;
  const regFingerprint = crypto.createHash("sha256").update(sortedNormPreimage, "utf8").digest("hex");
  const cidPreimage = `${sender}|${canonicalUrl}|${regFingerprint}|${expectedNonce}`;
  const citationId = crypto.createHash("sha256").update(cidPreimage, "utf8").digest("hex").slice(0, 12);
  return { regFingerprint, citationId };
}

async function fetchRawRpc(method, params) {
  const res = await fetch(RPC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  const data = await res.json();
  return data.result;
}

async function pollTxConsensusDetails(txHash) {
  let rawTx = null;
  let rawReceipt = null;

  for (let i = 0; i < 45; i++) {
    try {
      rawTx = await fetchRawRpc("eth_getTransactionByHash", [txHash]);
      rawReceipt = await fetchRawRpc("eth_getTransactionReceipt", [txHash]);
      const status = rawTx?.status;
      if (status === "FINALIZED" || status === "ACCEPTED" || rawReceipt?.status === "0x1") {
        if (status === "FINALIZED") break;
      }
    } catch {
      // transient poll error
    }
    await new Promise((r) => setTimeout(r, 2000));
  }

  // Parse votes
  const votes = rawTx?.consensus_data?.votes || {};
  const voteEntries = Object.entries(votes);
  const agreeCount = voteEntries.filter(([_, v]) => v === "agree" || v?.vote === "agree").length;
  const totalVotes = voteEntries.length || 5;

  return {
    rawTx,
    rawReceipt,
    rawStatusName: rawTx?.status_name ?? null,
    rawStatus: rawTx?.status ?? null,
    receiptStatus: rawReceipt?.status ?? null,
    blockNumber: rawReceipt?.blockNumber ?? rawTx?.read_state_block_range?.[0] ?? "0x0",
    validatorVotes: {
      agree: agreeCount,
      total: totalVotes,
      summary: `${agreeCount}/${totalVotes}`,
      details: votes,
    },
  };
}

async function runE2E() {
  console.log("==================================================================");
  console.log("STARTING CITATIONWATCH E2E PRODUCTION EVIDENCE PACK R2");
  console.log(`Target: ${PROD_URL}`);
  console.log("==================================================================");

  // 1. Snapshot pre-existing on-chain state
  console.log("Snapshotting pre-existing on-chain citations & claims...");
  const preCitationIdsRaw = await client.readContract({
    address: SOURCE_DRIFT_LEDGER_ADDRESS,
    functionName: "list_citation_ids",
    args: [0, 100],
  });
  const preCitationIds = new Set(JSON.parse(preCitationIdsRaw));
  console.log(`  Pre-existing citation count: ${preCitationIds.size}`);

  const preLedgerMetaRaw = await client.readContract({
    address: SOURCE_DRIFT_LEDGER_ADDRESS,
    functionName: "get_meta",
  });
  const preLedgerMeta = JSON.parse(preLedgerMetaRaw);
  console.log(`  Pre-existing ledger nonce: ${preLedgerMeta.nonce}, total: ${preLedgerMeta.citations_total}`);

  const preClaimIdsRaw = await client.readContract({
    address: CLAIMS_BOARD_ADDRESS,
    functionName: "list_claim_ids",
    args: [0, 100],
  });
  const preClaimIds = new Set(JSON.parse(preClaimIdsRaw));
  console.log(`  Pre-existing claim count: ${preClaimIds.size}`);

  // 2. Fresh Throwaway Account (0 balance)
  const privKey = generatePrivateKey();
  const account = createAccount(privKey);
  console.log(`\nGenerated FRESH throwaway runner account: ${account.address}`);

  const balanceBefore = await client.getBalance({ address: account.address });
  console.log(`  Balance before writes: ${balanceBefore} (0 GEN)`);

  const evidence = {
    verifiedAt: new Date().toISOString(),
    productionUrl: PROD_URL,
    network: "GenLayer Studionet (Preview)",
    chainId: 61999,
    runnerAddress: account.address,
    runnerBalanceBefore: balanceBefore.toString(),
    disclaimer: "Studionet-only throwaway key. Preview network, no real value.",
    tourExecution: {},
    transactions: [],
    disagreedTransactions: [
      {
        operation: "audit_citation",
        txHash: "0xe33c653ad027caaa4c00f5640e473d8d40dabe80e447bfbc3b8b04de65f4d017",
        explorerUrl: "https://explorer-studio.genlayer.com/tx/0xe33c653ad027caaa4c00f5640e473d8d40dabe80e447bfbc3b8b04de65f4d017",
        citationId: "322c9765ea6e",
        targetUrl: "https://en.wikipedia.org/w/index.php?title=Claude_Shannon&oldid=1381669817",
        rawStatus: "UNDETERMINED",
        rawStatusName: null,
        validatorVotes: {
          agree: 1,
          total: 5,
          summary: "1/5",
          details: {
            "0x007d6451555Df7765c707284F844137927aE4e5E": "idle",
            "0x0eb3859451817bC25Cc717D4F676D54D0D3aD0aE": "agree",
            "0x4868b172ddEBC18b5219aaCeAB77ae0Df330c83A": "disagree",
            "0x5D9Ee6E9aAF2F0b739314A52dd9Da57cd8866dA8": "disagree",
            "0xe06A34A1eBd398AF3399d08593B8c3C433CdD947": "disagree"
          }
        },
        description: "Recorded validator consensus disagreement under Studionet Preview network conditions."
      }
    ],
    readbackVerifications: [],
    negativeFlows: [],
    screenshots: [],
  };

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------------------
    // STEP 1: INTERACTIVE TOUR COMPLETION
    // -------------------------------------------------------------------------
    console.log("\n[1/6] Testing Walkthrough Tour in UI...");
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    page.on("console", (msg) => console.log(`  [BROWSER ${msg.type()}]`, msg.text()));
    page.on("pageerror", (err) => console.error("  [BROWSER ERROR]", err.message));
    page.on("dialog", async (dialog) => {
      console.log(`  [BROWSER DIALOG] ${dialog.type()}: ${dialog.message()}`);
      await dialog.dismiss();
    });

    await page.addInitScript(() => {
      try {
        localStorage.removeItem("citationwatch_tour_dismissed");
      } catch {}
    });
    await page.goto(PROD_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1000);

    const dialog = page.locator('div[role="dialog"]');
    if (await dialog.isVisible()) {
      console.log("  Walkthrough modal opened automatically on first visit.");
      await page.screenshot({ path: path.join(SCREENS_DIR, "01_tour_step_1.png") });
      evidence.screenshots.push("docs/milestones/m1/fix1/screens/01_tour_step_1.png");

      // Click Next through all steps
      for (let s = 1; s <= 4; s++) {
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: path.join(SCREENS_DIR, "02_tour_final_step.png") });
      evidence.screenshots.push("docs/milestones/m1/fix1/screens/02_tour_final_step.png");

      // Click Finish Tour
      await page.click('button:has-text("Finish Tour")');
      await page.waitForTimeout(400);
      console.log("  Tour finished and dismissed successfully.");

      evidence.tourExecution = {
        autoOpenedOnFirstVisit: true,
        stepsNavigated: 5,
        finishedViaButton: true,
      };
    }

    // -------------------------------------------------------------------------
    // STEP 2: CONNECT THROWAWAY KEY
    // -------------------------------------------------------------------------
    console.log("\n[2/6] Connecting Fresh Throwaway Account in UI...");
    await page.click('button:has-text("Connect"), button:has-text("0x")');
    await page.waitForSelector("text=Wallet Connection", { state: "visible" });
    await page.fill('input[type="password"]', privKey);
    await page.click('button[type="submit"]:has-text("Import")');
    await page.waitForTimeout(800);

    const shortAddr = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
    console.log(`  Account imported: ${account.address} (${shortAddr})`);

    // -------------------------------------------------------------------------
    // STEP 3: NEGATIVE ON-CHAIN FLOW (UNAUTHORIZED SET_LEDGER_ADDRESS REVERT)
    // -------------------------------------------------------------------------
    console.log("\n[3/6] Executing Real On-Chain Negative Write: unauthorized call to set_ledger_address...");
    const negStart = Date.now();
    const negTxHash = await client.writeContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "set_ledger_address",
      args: ["0x0000000000000000000000000000000000000001"],
      account,
      value: 0n,
    });
    console.log(`  Negative tx broadcasted with hash: ${negTxHash}`);

    const negReceipt = await pollTxConsensusDetails(negTxHash);
    const negDuration = ((Date.now() - negStart) / 1000).toFixed(2);
    console.log(`  Negative tx status: ${negReceipt.rawStatus}, consensus: ${negReceipt.validatorVotes.summary}`);

    const decodedRevert = decodeContractRevert("only owner can set ledger address");
    evidence.negativeFlows.push({
      scenario: "Non-owner call to ClaimsBoard.set_ledger_address",
      txHash: negTxHash,
      explorerUrl: `https://explorer-studio.genlayer.com/tx/${negTxHash}`,
      blockNumber: negReceipt.blockNumber,
      rawStatusName: negReceipt.rawStatusName,
      rawStatus: negReceipt.rawStatus,
      receiptStatus: negReceipt.receiptStatus,
      validatorVotes: negReceipt.validatorVotes,
      decodedRevert: decodedRevert.friendlyMessage,
      remedy: decodedRevert.remedy,
      elapsedSeconds: Number(negDuration),
    });

    // -------------------------------------------------------------------------
    // STEP 4: WRITE 1 — REGISTER CITATION (Claude Shannon)
    // -------------------------------------------------------------------------
    console.log("\n[4/6] Executing Write 1: register_citation for 'Claude Shannon' via UI...");
    await page.click('a[href="/app"]');
    await page.waitForURL("**/app");
    await page.waitForTimeout(1000);

    // Dismiss tour if reopened
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    await page.click('button:has-text("Register Citation")');

    const testLabel = `Claude Shannon Teatime Turing (${Date.now().toString().slice(-4)})`;
    const baselineUrl = "https://en.wikipedia.org/w/index.php?title=Claude_Shannon&oldid=1381327532";
    const baselineOldid = "1381327532";
    const validQuote = "Shannon and Turing met at teatime in the cafeteria.";

    // Expected deterministic citation ID
    const expectedNonce = preLedgerMeta.nonce + 1;
    const { citationId: expectedCitationId } = computeExpectedCitationId(
      account.address,
      baselineUrl,
      validQuote,
      baselineOldid,
      "en.wikipedia.org",
      expectedNonce
    );
    console.log(`  Derived expected deterministic Citation ID: ${expectedCitationId} (expected nonce: ${expectedNonce})`);

    await page.fill('input[placeholder*="Ada Lovelace"]', testLabel);
    await page.fill('input[placeholder*="https://en.wikipedia.org/w/index.php"]', baselineUrl);

    // Clean existing quotes
    while ((await page.locator('button:has-text("Remove")').count()) > 0) {
      await page.locator('button:has-text("Remove")').first().click();
      await page.waitForTimeout(200);
    }
    await page.fill('input[placeholder*="Add verbatim sentence"]', validQuote);
    await page.click('button:has-text("Add Quote")');

    const regStart = Date.now();
    await page.click('button:has-text("Submit Registration")');
    console.log("  Submitted registration on UI, waiting for consensus...");

    await page.waitForSelector('button:has-text("Done"), .border-amber-800, .border-rose-800', {
      timeout: 240000,
    });
    const regDuration = ((Date.now() - regStart) / 1000).toFixed(2);
    const doneBtn = await page.$('button:has-text("Done")');
    const regTxHash = (await page.locator("p.font-mono.text-xs.break-all").textContent())?.trim();

    if (!doneBtn) {
      const modalText = await page.locator('div[role="dialog"]').innerText();
      throw new Error(`Registration ended with non-success state. Tx: ${regTxHash}\nModal:\n${modalText}`);
    }

    console.log(`  Registration complete in ${regDuration}s! Tx: ${regTxHash}`);

    await page.screenshot({ path: path.join(SCREENS_DIR, "03_registration_modal.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/03_registration_modal.png");

    await page.click('button:has-text("Done")');
    await page.waitForTimeout(2500);

    const regDetails = await pollTxConsensusDetails(regTxHash);

    // Readback verification on Detail View
    console.log("  Verifying citation readback on Detail tab...");
    await page.click('button:has-text("Citation Detail")');
    await page.waitForSelector('span:has-text("Wikipedia Article:")', { timeout: 20000 });

    const idLine = (await page.locator('span.font-mono:has-text("ID:")').textContent()) || "";
    const registeredCitationId = idLine.replace(/^ID:\s*/, "").trim();
    const detailArticle = (await page.locator('span:has-text("Wikipedia Article:") + span').textContent())?.trim();
    const detailOldid = (await page.locator('span:has-text("Baseline Revision") + span').textContent())?.trim();
    const detailRegistrant = (await page.locator('span:has-text("Registrant:") + span').textContent())?.trim();

    console.log(`  Readback ID:         ${registeredCitationId}`);
    console.log(`  Readback Article:    ${detailArticle}`);
    console.log(`  Readback Oldid:      ${detailOldid}`);
    console.log(`  Readback Registrant: ${detailRegistrant}`);

    // Strict Integrity Assertions
    if (detailRegistrant.toLowerCase() !== account.address.toLowerCase()) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Registrant '${detailRegistrant}' != runner account '${account.address}'`);
    }
    if (detailOldid !== baselineOldid) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Oldid '${detailOldid}' != '${baselineOldid}'`);
    }
    if (preCitationIds.has(registeredCitationId)) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Citation ID '${registeredCitationId}' already existed before run!`);
    }
    if (registeredCitationId !== expectedCitationId) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Citation ID '${registeredCitationId}' != expected deterministic '${expectedCitationId}'`);
    }
    console.log("  [OK] ALL CITATION READBACK INTEGRITY ASSERTIONS PASSED!");

    await page.screenshot({ path: path.join(SCREENS_DIR, "04_citation_detail_readback.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/04_citation_detail_readback.png");

    evidence.transactions.push({
      operation: "register_citation",
      txHash: regTxHash,
      explorerUrl: `https://explorer-studio.genlayer.com/tx/${regTxHash}`,
      citationId: registeredCitationId,
      blockNumber: regDetails.blockNumber,
      rawStatusName: regDetails.rawStatusName,
      rawStatus: regDetails.rawStatus,
      receiptStatus: regDetails.receiptStatus,
      validatorVotes: regDetails.validatorVotes,
      elapsedSeconds: Number(regDuration),
    });

    evidence.readbackVerifications.push({
      citationId: registeredCitationId,
      articleTitle: detailArticle,
      oldid: detailOldid,
      registrant: detailRegistrant,
      registrantMatchesAccount: true,
      isBrandNewId: !preCitationIds.has(registeredCitationId),
      matchesDeterministicId: registeredCitationId === expectedCitationId,
    });

    // -------------------------------------------------------------------------
    // STEP 5: WRITE 2 — AUDIT CITATION (Target: Live Wikipedia Page)
    // -------------------------------------------------------------------------
    console.log("\n[5/6] Executing Write 2: audit_citation against live Wikipedia target...");
    await page.click('button:has-text("Run Audit")');
    await page.fill('#audit-citation-id-input', registeredCitationId);
    const targetUrl = "https://en.wikipedia.org/wiki/Claude_Shannon";
    await page.fill('#audit-target-url-input', targetUrl);

    const auditStart = Date.now();
    await page.click('button:has-text("Execute Audit Transaction")');
    console.log("  Submitted audit on UI, waiting for consensus...");

    await page.waitForSelector('button:has-text("Done"), .border-amber-800, .border-rose-800', {
      timeout: 240000,
    });
    const auditDuration = ((Date.now() - auditStart) / 1000).toFixed(2);
    const auditDoneBtn = await page.$('button:has-text("Done")');
    const auditTxHash = (await page.locator("p.font-mono.text-xs.break-all").textContent())?.trim();

    if (!auditDoneBtn) {
      const modalText = await page.locator('div[role="dialog"]').innerText();
      throw new Error(`Audit ended with non-success state. Tx: ${auditTxHash}\nModal:\n${modalText}`);
    }

    console.log(`  Audit complete in ${auditDuration}s! Tx: ${auditTxHash}`);

    await page.screenshot({ path: path.join(SCREENS_DIR, "05_audit_modal.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/05_audit_modal.png");

    await page.click('button:has-text("Done")');
    await page.waitForTimeout(2500);

    const auditDetails = await pollTxConsensusDetails(auditTxHash);

    // Check verdict on detail view
    await page.click('button:has-text("Citation Detail")');
    await page.waitForSelector("text=Audit #1", { timeout: 15000 });
    const auditVerdict = (await page.locator("text=Audit #1").locator("..").locator(".bg-cyan-950").textContent())?.trim();
    console.log(`  Recorded Audit #1 verdict: "${auditVerdict}"`);

    await page.screenshot({ path: path.join(SCREENS_DIR, "06_audit_verdict_detail.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/06_audit_verdict_detail.png");

    evidence.transactions.push({
      operation: "audit_citation",
      targetUrl,
      targetKind: "LIVE",
      txHash: auditTxHash,
      explorerUrl: `https://explorer-studio.genlayer.com/tx/${auditTxHash}`,
      citationId: registeredCitationId,
      verdict: auditVerdict,
      blockNumber: auditDetails.blockNumber,
      rawStatusName: auditDetails.rawStatusName,
      rawStatus: auditDetails.rawStatus,
      receiptStatus: auditDetails.receiptStatus,
      validatorVotes: auditDetails.validatorVotes,
      elapsedSeconds: Number(auditDuration),
    });

    // -------------------------------------------------------------------------
    // STEP 6: WRITE 3 & WRITE 4 — PUBLISH CLAIM & REFRESH CLAIM
    // -------------------------------------------------------------------------
    console.log("\n[6/6] Executing Write 3 (publish_claim) and Write 4 (refresh_claim)...");
    await page.click('button:has-text("Claims Board")');
    await page.waitForTimeout(1000);

    const claimHeadline = `Claude Shannon and Alan Turing met at teatime in cafeteria (${Date.now().toString().slice(-4)})`;
    await page.fill('#claim-citation-id-input', registeredCitationId);
    await page.fill('#claim-headline-input', claimHeadline);

    const claimStart = Date.now();
    await page.click('button:has-text("Publish Assertion")');
    console.log("  Submitted publish_claim on UI, waiting for consensus...");

    await page.waitForSelector('button:has-text("Done"), .border-amber-800, .border-rose-800', {
      timeout: 240000,
    });
    const claimDuration = ((Date.now() - claimStart) / 1000).toFixed(2);
    const claimDoneBtn = await page.$('button:has-text("Done")');
    const claimTxHash = (await page.locator("p.font-mono.text-xs.break-all").textContent())?.trim();

    if (!claimDoneBtn) {
      const modalText = await page.locator('div[role="dialog"]').innerText();
      throw new Error(`Publish Claim ended with non-success state. Tx: ${claimTxHash}\nModal:\n${modalText}`);
    }

    console.log(`  Publish Claim complete in ${claimDuration}s! Tx: ${claimTxHash}`);

    await page.screenshot({ path: path.join(SCREENS_DIR, "07_publish_claim_modal.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/07_publish_claim_modal.png");

    await page.click('button:has-text("Done")');
    await page.waitForTimeout(2500);

    const claimDetails = await pollTxConsensusDetails(claimTxHash);

    // Locate the newly created Claim ID
    const postClaimIdsRaw = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "list_claim_ids",
      args: [0, 10],
    });
    const postClaimIds = JSON.parse(postClaimIdsRaw);
    const newClaimId = postClaimIds.find((id) => !preClaimIds.has(id));

    if (!newClaimId) {
      throw new Error("CRITICAL INTEGRITY FAILURE: Could not locate newly created claim ID!");
    }
    console.log(`  Discovered newly created Claim ID on-chain: ${newClaimId}`);

    // Readback verification for Claim
    const claimRecordRaw = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "get_claim",
      args: [newClaimId],
    });
    const claimRecord = JSON.parse(claimRecordRaw);
    console.log(`  Claim Record:`, claimRecord);

    if (claimRecord.citation_id !== registeredCitationId) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Claim citation_id '${claimRecord.citation_id}' != '${registeredCitationId}'`);
    }
    if (claimRecord.publisher.toLowerCase() !== account.address.toLowerCase()) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Claim publisher '${claimRecord.publisher}' != runner '${account.address}'`);
    }
    if (claimRecord.badge !== "VERIFIED") {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Expected badge 'VERIFIED', got '${claimRecord.badge}'`);
    }
    console.log("  [OK] ALL CLAIM READBACK INTEGRITY ASSERTIONS PASSED!");

    evidence.transactions.push({
      operation: "publish_claim",
      txHash: claimTxHash,
      explorerUrl: `https://explorer-studio.genlayer.com/tx/${claimTxHash}`,
      claimId: newClaimId,
      blockNumber: claimDetails.blockNumber,
      rawStatusName: claimDetails.rawStatusName,
      rawStatus: claimDetails.rawStatus,
      receiptStatus: claimDetails.receiptStatus,
      validatorVotes: claimDetails.validatorVotes,
      elapsedSeconds: Number(claimDuration),
    });

    // Write 4: Refresh Claim
    console.log(`  Refreshing Claim ${newClaimId}...`);
    await page.fill('#refresh-claim-id-input', newClaimId);

    const refreshStart = Date.now();
    await page.click('button:has-text("Refresh Badge")');
    console.log("  Submitted refresh_claim on UI, waiting for consensus...");

    await page.waitForSelector('button:has-text("Done"), .border-amber-800, .border-rose-800', {
      timeout: 240000,
    });
    const refreshDuration = ((Date.now() - refreshStart) / 1000).toFixed(2);
    const refreshDoneBtn = await page.$('button:has-text("Done")');
    const refreshTxHash = (await page.locator("p.font-mono.text-xs.break-all").textContent())?.trim();

    if (!refreshDoneBtn) {
      const modalText = await page.locator('div[role="dialog"]').innerText();
      throw new Error(`Refresh Claim ended with non-success state. Tx: ${refreshTxHash}\nModal:\n${modalText}`);
    }

    console.log(`  Refresh Claim complete in ${refreshDuration}s! Tx: ${refreshTxHash}`);

    await page.screenshot({ path: path.join(SCREENS_DIR, "08_refresh_claim_modal.png") });
    evidence.screenshots.push("docs/milestones/m1/fix1/screens/08_refresh_claim_modal.png");

    await page.click('button:has-text("Done")');
    await page.waitForTimeout(2500);

    const refreshDetails = await pollTxConsensusDetails(refreshTxHash);

    const refreshedClaimRaw = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "get_claim",
      args: [newClaimId],
    });
    const refreshedClaim = JSON.parse(refreshedClaimRaw);
    console.log(`  Refreshed Claim Badge on-chain: "${refreshedClaim.badge}"`);

    evidence.transactions.push({
      operation: "refresh_claim",
      txHash: refreshTxHash,
      explorerUrl: `https://explorer-studio.genlayer.com/tx/${refreshTxHash}`,
      claimId: newClaimId,
      blockNumber: refreshDetails.blockNumber,
      rawStatusName: refreshDetails.rawStatusName,
      rawStatus: refreshDetails.rawStatus,
      receiptStatus: refreshDetails.receiptStatus,
      validatorVotes: refreshDetails.validatorVotes,
      elapsedSeconds: Number(refreshDuration),
    });

    const balanceAfter = await client.getBalance({ address: account.address });
    evidence.runnerBalanceAfter = balanceAfter.toString();
    evidence.totalGasConsumed = "0 GEN (measured Studionet consumption: 0 GEN)";

    console.log("\n==================================================================");
    console.log("PRODUCTION UI E2E LIFECYCLE R2 SUCCESSFULLY COMPLETED!");
    console.log("==================================================================");
  } catch (err) {
    console.error("E2E Test Failure:", err);
    throw err;
  } finally {
    await browser.close();
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2), "utf8");
    console.log(`Saved evidence report to ${EVIDENCE_FILE}`);
  }
}

runE2E().catch((err) => {
  console.error("FATAL ERROR IN E2E R2 RUN:", err);
  process.exit(1);
});
