import fs from "fs";
import path from "path";
import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

const client = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api" });

async function runFailingAssertionProof() {
  console.log("==================================================================");
  console.log("FAILING ASSERTION PROOF AGAINST OLD EVIDENCE DATA");
  console.log("==================================================================");

  // Historical evidence from commit 9ac126f that contained the audited defects
  const oldEvidence = {
    verifiedAt: "2026-10-17T06:18:22.104Z",
    runnerAddress: "0xcCDbAb11A805C8C20BEd5f7e83a61A7ea443b898",
    readbackVerifications: [
      {
        citationId: "ef59e81d5e56",
        registrant: "0x56415851C3dDc1232807522198fA6Fb07f78A95A",
        registrantMatchesAccount: false
      }
    ],
    transactions: [
      {
        operation: "publish_claim",
        claimId: "56d9663a46e2"
      }
    ]
  };
  console.log(`Loaded historical audited evidence for runner: ${oldEvidence.runnerAddress}`);

  let failedAssertions = 0;

  // 1. Assert Registrant Matches Runner Account
  const readback = oldEvidence.readbackVerifications[0];
  console.log("\n[ASSERTION 1] Check: citation registrant === runner account");
  console.log(`  Citation ID: ${readback.citationId}`);
  console.log(`  On-chain registrant: ${readback.registrant}`);
  console.log(`  Runner account:      ${oldEvidence.runnerAddress}`);
  if (readback.registrant.toLowerCase() !== oldEvidence.runnerAddress.toLowerCase()) {
    console.error("  ❌ FAILED: Registrant does NOT match runner account!");
    failedAssertions++;
  } else {
    console.log("  ✅ PASSED");
  }

  // 2. Assert Claim ID is brand new and not equal to pre-existing 56d9663a46e2
  const publishTx = oldEvidence.transactions.find((t) => t.operation === "publish_claim");
  console.log("\n[ASSERTION 2] Check: claimId !== '56d9663a46e2' (not picking stale/hardcoded ID)");
  console.log(`  Reported claimId: ${publishTx.claimId}`);
  if (publishTx.claimId === "56d9663a46e2") {
    console.error("  ❌ FAILED: Reported claimId is identical to historical claim '56d9663a46e2'!");
    failedAssertions++;
  } else {
    console.log("  ✅ PASSED");
  }

  // 3. Query on-chain claim 56d9663a46e2 to verify its actual binding & publisher
  console.log("\n[ASSERTION 3 & 4] Querying on-chain record for claim 56d9663a46e2...");
  try {
    const claimRaw = await client.readContract({
      address: "0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD",
      functionName: "get_claim",
      args: [publishTx.claimId],
    });
    const claim = typeof claimRaw === "string" ? JSON.parse(claimRaw) : claimRaw;
    console.log(`  Claim citation_id on-chain: ${claim.citation_id} (expected this run's citation: ${readback.citationId})`);
    console.log(`  Claim publisher on-chain:   ${claim.publisher} (expected runner: ${oldEvidence.runnerAddress})`);

    console.log("\n[ASSERTION 3] Check: claim.citation_id === this run's citationId");
    if (claim.citation_id !== readback.citationId) {
      console.error(`  ❌ FAILED: claim is bound to '${claim.citation_id}', NOT '${readback.citationId}'!`);
      failedAssertions++;
    } else {
      console.log("  ✅ PASSED");
    }

    console.log("\n[ASSERTION 4] Check: claim.publisher === runner account");
    if (claim.publisher.toLowerCase() !== oldEvidence.runnerAddress.toLowerCase()) {
      console.error(`  ❌ FAILED: claim publisher is '${claim.publisher}', NOT runner '${oldEvidence.runnerAddress}'!`);
      failedAssertions++;
    } else {
      console.log("  ✅ PASSED");
    }
  } catch (err) {
    console.error("Failed to query on-chain claim:", err.message);
  }

  console.log("\n==================================================================");
  console.log(`PROOF COMPLETE: ${failedAssertions} OF 4 INTEGRITY ASSERTIONS FAILED ON OLD DATA.`);
  console.log("==================================================================");
}

runFailingAssertionProof().catch(console.error);
