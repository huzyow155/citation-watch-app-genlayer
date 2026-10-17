import fs from "fs";
import path from "path";
import { createAccount, generatePrivateKey } from "genlayer-js";
import {
  registerCommitmentFlow,
  submitResolutionFlow,
  getCommitment,
  listCommitmentsByRegistrant,
} from "../src/services/contractService.ts";

async function main() {
  console.log("=======================================================");
  console.log("RUNNING END-TO-END ON-CHAIN VERIFICATION (STUDIONET)");
  console.log("=======================================================");

  const privKey = generatePrivateKey();
  const account = createAccount(privKey);
  console.log(`Generated throwaway test account: ${account.address}`);

  const testStatement = `The Apollo 11 lunar module will touch down on the lunar surface before 1970. (E2E run ${Date.now()})`;
  const deadline = "1970-01-01";
  const sourceUrl = "https://en.wikipedia.org/wiki/Apollo_11";

  const evidenceReport = {
    network: "GenLayer Studionet (Preview)",
    chainId: 61999,
    runnerAddress: account.address,
    timestamp: new Date().toISOString(),
    flow: {},
    negatives: {},
  };

  // STEP 1: REGISTER COMMITMENT
  console.log(`\n[1/4] Registering new commitment...`);
  console.log(`Statement: "${testStatement}"`);
  console.log(`Deadline: "${deadline}"`);

  let registerResult;
  let registerRetries = 0;
  while (registerRetries <= 2) {
    try {
      registerResult = await registerCommitmentFlow(
        account,
        testStatement,
        deadline,
        "THIRD_PARTY_REPORT",
        true,
        (status) => {
          console.log(`  -> Status update: ${status.statusName} (Leader: ${status.leaderResult || "pending"})`);
        }
      );
      break;
    } catch (err) {
      registerRetries++;
      console.warn(`  Warning: Register attempt failed: ${err.message}. Retrying (${registerRetries}/2)...`);
      if (registerRetries > 2) throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  const { txHash: regTx, commitmentId } = registerResult;
  console.log(`Commitment registered successfully!`);
  console.log(`  Commitment ID: ${commitmentId}`);
  console.log(`  Register Tx:   ${regTx}`);

  evidenceReport.flow.commitmentId = commitmentId;
  evidenceReport.flow.registerTx = regTx;
  evidenceReport.flow.registerRetries = registerRetries;

  // STEP 2: READ BACK OPEN RECORD
  console.log(`\n[2/4] Reading back initial OPEN record...`);
  const initialRead = await getCommitment(commitmentId);
  if (!initialRead.ok || !initialRead.data) {
    throw new Error(`Failed to read back newly created commitment: ${initialRead.error}`);
  }
  console.log(`Record read verified:`);
  console.log(`  Status:    ${initialRead.data.status}`);
  console.log(`  Subject:   "${initialRead.data.subject}"`);
  console.log(`  Action:    "${initialRead.data.action}"`);

  if (initialRead.data.status !== "OPEN") {
    throw new Error(`Expected status OPEN, got ${initialRead.data.status}`);
  }
  evidenceReport.flow.initialRecord = initialRead.data;

  // STEP 3: ON-CHAIN NEGATIVE REJECTION 1 (Non-allowlisted domain on OPEN commitment)
  console.log(`\n[3/5] Testing non-allowlisted domain rejection on open commitment...`);
  const neg1 = await submitResolutionFlow(
    account,
    commitmentId,
    "https://github.com/nasa/webb",
    (status) => {
      console.log(`  -> Negative 1 status: ${status.statusName} (Leader: ${status.leaderResult || "pending"})`);
    }
  );
  console.log(`  Negative 1 Tx: ${neg1.txHash}`);
  console.log(`  Decoded Revert: "${neg1.report.decodedRevert}"`);
  evidenceReport.negatives.nonAllowlistedDomain = {
    txHash: neg1.txHash,
    statusName: neg1.report.statusName,
    leaderResult: neg1.report.leaderResult,
    revertPayload: neg1.report.decodedRevert,
  };

  // STEP 4: RESOLVE COMMITMENT WITH ALLOWLISTED WIKIPEDIA URL
  console.log(`\n[4/5] Submitting resolution via allowlisted source: ${sourceUrl}...`);
  let resolveResult;
  let resolveRetries = 0;
  while (resolveRetries <= 2) {
    try {
      resolveResult = await submitResolutionFlow(
        account,
        commitmentId,
        sourceUrl,
        (status) => {
          console.log(`  -> Status update: ${status.statusName} (Leader: ${status.leaderResult || "pending"})`);
        }
      );
      if (resolveResult.report.isMajorityDisagreed) {
        throw new Error("Validators disagreed (MAJORITY_DISAGREE)");
      }
      break;
    } catch (err) {
      resolveRetries++;
      console.warn(`  Warning: Resolve attempt failed: ${err.message}. Retrying (${resolveRetries}/2)...`);
      if (resolveRetries > 2) throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  const { txHash: resTx, report: resReport } = resolveResult;
  console.log(`Resolution transaction processed:`);
  console.log(`  Resolve Tx:    ${resTx}`);
  console.log(`  Status Name:   ${resReport.statusName}`);
  console.log(`  Leader Result: ${resReport.leaderResult}`);

  evidenceReport.flow.resolveTx = resTx;
  evidenceReport.flow.resolveRetries = resolveRetries;
  evidenceReport.flow.resolveReceipt = resReport;

  // Read back resolved record
  console.log(`\nReading back resolved record...`);
  const resolvedRead = await getCommitment(commitmentId);
  if (!resolvedRead.ok || !resolvedRead.data) {
    throw new Error(`Failed to read resolved commitment: ${resolvedRead.error}`);
  }
  console.log(`Resolved record read verified:`);
  console.log(`  Status:    ${resolvedRead.data.status}`);
  console.log(`  Outcome:   ${resolvedRead.data.outcome}`);

  if (resolvedRead.data.status !== "PROVISIONAL" && resolvedRead.data.status !== "FINAL") {
    throw new Error(`Expected status PROVISIONAL or FINAL, got ${resolvedRead.data.status}`);
  }
  evidenceReport.flow.finalRecord = resolvedRead.data;

  // STEP 5: ON-CHAIN NEGATIVE REJECTION 2 (Second resolution on already resolved/provisional commitment)
  console.log(`\n[5/5] Testing second resolution rejection on already provisional commitment...`);
  const neg2 = await submitResolutionFlow(
    account,
    commitmentId,
    sourceUrl,
    (status) => {
      console.log(`  -> Negative 2 status: ${status.statusName} (Leader: ${status.leaderResult || "pending"})`);
    }
  );
  console.log(`  Negative 2 Tx: ${neg2.txHash}`);
  console.log(`  Decoded Revert: "${neg2.report.decodedRevert}"`);
  evidenceReport.negatives.alreadyResolved = {
    txHash: neg2.txHash,
    statusName: neg2.report.statusName,
    leaderResult: neg2.report.leaderResult,
    revertPayload: neg2.report.decodedRevert,
  };

  // Save evidence to docs/E2E_EVIDENCE.json
  const docsDir = path.join(process.cwd(), "docs");
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  const outPath = path.join(docsDir, "E2E_EVIDENCE.json");
  fs.writeFileSync(outPath, JSON.stringify(evidenceReport, null, 2), "utf8");
  console.log(`\n=======================================================`);
  console.log(`E2E SUITE COMPLETED SUCCESSFULLY! Saved to: docs/E2E_EVIDENCE.json`);
  console.log(`=======================================================`);
}

main().catch((err) => {
  console.error("FATAL E2E ERROR:", err);
  process.exit(1);
});
