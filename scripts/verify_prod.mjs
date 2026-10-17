import {
  ACTIVE_SOURCE_DRIFT_LEDGER,
  ACTIVE_CLAIMS_BOARD,
  SUPERSEDED_ADDRESSES,
} from "./check_address_consistency.mjs";

async function verifyProd() {
  const prodBase = "https://citation-watch-app-genlayer.vercel.app";
  console.log(`Verifying production deployment at ${prodBase}...`);

  const res = await fetch(prodBase);
  console.log("Production HTML status:", res.status);
  if (!res.ok) {
    console.error(`FAILED: Non-200 status returned from ${prodBase}`);
    process.exit(1);
  }

  const html = await res.text();
  const match = html.match(/\/assets\/index-[^"]+\.js/);
  if (!match) {
    console.error("FAILED: Failed to locate index bundle script in production HTML.");
    process.exit(1);
  }

  const jsUrl = prodBase + match[0];
  console.log("Fetching production bundle script:", jsUrl);
  const jsRes = await fetch(jsUrl);
  if (!jsRes.ok) {
    console.error(`FAILED: Failed to fetch production bundle script from ${jsUrl}`);
    process.exit(1);
  }

  const js = (await jsRes.text()).toLowerCase();

  const hasLedger = js.includes(ACTIVE_SOURCE_DRIFT_LEDGER);
  const hasClaims = js.includes(ACTIVE_CLAIMS_BOARD);

  console.log(`Active SourceDriftLedger present: ${hasLedger ? "YES" : "NO"}`);
  console.log(`Active ClaimsBoard present:       ${hasClaims ? "YES" : "NO"}`);

  if (!hasLedger || !hasClaims) {
    console.error("FAILED: Production bundle does not contain active contract addresses.");
    process.exit(1);
  }

  let foundSuperseded = [];
  for (const s of SUPERSEDED_ADDRESSES) {
    if (js.includes(s)) {
      foundSuperseded.push(s);
    }
  }

  if (foundSuperseded.length > 0) {
    console.error("FAILED: Production bundle contains superseded addresses:", foundSuperseded);
    process.exit(1);
  }

  console.log("PROD VERIFICATION PASSED: Only active contracts are served in production bundle.");
  process.exit(0);
}

verifyProd().catch((err) => {
  console.error(err);
  process.exit(1);
});
