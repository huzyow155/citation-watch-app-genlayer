import fs from "fs";
import path from "path";
import crypto from "crypto";

const EXPECTED_CONTRACTS = [
  {
    name: "SourceDriftLedger.py",
    expectedSha256: "d5598c5e118d8411e87ef03f637950dc147799c94167ab8b0a70dd19c2215c8a",
  },
  {
    name: "ClaimsBoard.py",
    expectedSha256: "4ee7d485bcaf7505514377abfea8f05eb3286447c13752df2847a3de7d0e8569",
  },
];

let hasError = false;

for (const contract of EXPECTED_CONTRACTS) {
  const filePath = path.join(process.cwd(), "contracts-reference", contract.name);

  if (!fs.existsSync(filePath)) {
    console.error(`FAILED: Reference contract not found at ${filePath}`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath);
  const actualSha256 = crypto.createHash("sha256").update(content).digest("hex");

  if (actualSha256 !== contract.expectedSha256) {
    console.error(`FAILED: Reference contract ${contract.name} SHA-256 mismatch!`);
    console.error(`  Expected: ${contract.expectedSha256}`);
    console.error(`  Actual:   ${actualSha256}`);
    hasError = true;
  } else {
    console.log(`PASS: Reference contract ${contract.name} matches canonical SHA-256 (${actualSha256}).`);
  }
}

if (hasError) {
  process.exit(1);
}

process.exit(0);
