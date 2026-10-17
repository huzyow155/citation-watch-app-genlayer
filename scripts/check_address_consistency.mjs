import fs from "fs";
import path from "path";

export const ACTIVE_SOURCE_DRIFT_LEDGER = "0xFC7593432D4e8A2ceda911497807E4aCC7c7B705".toLowerCase();
export const ACTIVE_CLAIMS_BOARD = "0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD".toLowerCase();

export const SUPERSEDED_ADDRESSES = [
  "0x0d24CC10b5396C718c019E239c90c7eE6b17BE57".toLowerCase(),
  "0x76Ef8E906c8Fec113c4Db846e60196E58e6B818D".toLowerCase(),
  "0xc6a8Cfdbbb4CA98637053A0c8529686Ff4C41CaD".toLowerCase(),
  "0xfc454d601DC5300ECf8458610cB1580c9640bE32".toLowerCase(),
  "0x89D9153a738c83e29fF4e0050810793664C9392e".toLowerCase(),
  "0x1f0F2FeFFC7b1F275F36a281e285aE7Ff900bF5C".toLowerCase(),
  "0x2B9d921312384a26127117e335eA241F8C9d123b".toLowerCase(),
];

export function runAddressConsistencyCheck() {
  const rootDir = process.cwd();
  const dirsToCheck = ["src", "scripts", "tests", "docs"];
  let leaks = [];

  function checkFile(filePath) {
    if (filePath.endsWith("check_address_consistency.mjs")) return;
    if (filePath.endsWith("verify_bundle.mjs")) return;
    if (filePath.endsWith("verify_prod.mjs")) return;
    const content = fs.readFileSync(filePath, "utf8").toLowerCase();
    for (const superseded of SUPERSEDED_ADDRESSES) {
      if (content.includes(superseded)) {
        leaks.push({ file: path.relative(rootDir, filePath), superseded });
      }
    }
  }

  function checkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== ".git") {
          checkDir(fullPath);
        }
      } else if (entry.isFile()) {
        checkFile(fullPath);
      }
    }
  }

  for (const d of dirsToCheck) {
    checkDir(path.join(rootDir, d));
  }

  if (fs.existsSync(path.join(rootDir, "index.html"))) {
    checkFile(path.join(rootDir, "index.html"));
  }

  if (leaks.length > 0) {
    console.error("FAILED: Superseded contract addresses found outside README.md:");
    leaks.forEach((l) => console.error(`  ${l.file} contains superseded address ${l.superseded}`));
    return false;
  }

  console.log("PASS: No superseded contract addresses found outside README.md.");
  console.log(`Active SourceDriftLedger: ${ACTIVE_SOURCE_DRIFT_LEDGER}`);
  console.log(`Active ClaimsBoard:       ${ACTIVE_CLAIMS_BOARD}`);
  return true;
}

// Run directly if invoked as main script
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  const ok = runAddressConsistencyCheck();
  process.exit(ok ? 0 : 1);
}
