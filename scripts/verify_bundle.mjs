import fs from "fs";
import path from "path";
import { ACTIVE_SOURCE_DRIFT_LEDGER, ACTIVE_CLAIMS_BOARD, SUPERSEDED_ADDRESSES } from "./check_address_consistency.mjs";

const rootDir = process.cwd();
const distAssetsDir = path.join(rootDir, "dist", "assets");

if (!fs.existsSync(distAssetsDir)) {
  console.error("FAILED: dist/assets directory not found. Please run npm run build first.");
  process.exit(1);
}

const jsFiles = fs.readdirSync(distAssetsDir).filter((f) => f.endsWith(".js"));

let hasActiveLedger = false;
let hasActiveClaims = false;
let foundSuperseded = [];

for (const file of jsFiles) {
  const content = fs.readFileSync(path.join(distAssetsDir, file), "utf8").toLowerCase();
  if (content.includes(ACTIVE_SOURCE_DRIFT_LEDGER)) {
    hasActiveLedger = true;
  }
  if (content.includes(ACTIVE_CLAIMS_BOARD)) {
    hasActiveClaims = true;
  }
  for (const s of SUPERSEDED_ADDRESSES) {
    if (content.includes(s)) {
      foundSuperseded.push({ file, s });
    }
  }
}

console.log(`Audited ${jsFiles.length} production bundle assets.`);
console.log(`Active SourceDriftLedger present: ${hasActiveLedger ? "YES" : "NO"}`);
console.log(`Active ClaimsBoard present:       ${hasActiveClaims ? "YES" : "NO"}`);

if (!hasActiveLedger) {
  console.error("FAILED: Active SourceDriftLedger address not found in production bundle.");
  process.exit(1);
}

if (!hasActiveClaims) {
  console.error("FAILED: Active ClaimsBoard address not found in production bundle.");
  process.exit(1);
}

if (foundSuperseded.length > 0) {
  console.error("FAILED: Superseded contract address found in bundle assets:", foundSuperseded);
  process.exit(1);
}

console.log("PASS: Bundle verified successfully. Only active addresses present.");
process.exit(0);
