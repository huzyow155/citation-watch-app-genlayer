import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { decodeContractRevert, REVERT_MAP } from "../src/lib/revertMap";

describe("decodeContractRevert", () => {
  it("decodes live cooldown revert", () => {
    const res = decodeContractRevert("live audit cooldown active");
    expect(res.code).toBe("LIVE_COOLDOWN_ACTIVE");
    expect(res.category).toBe("COOLDOWN");
    expect(res.friendlyMessage).toContain("300-second cooldown");
  });

  it("decodes invalid url scheme", () => {
    const res = decodeContractRevert("source url scheme must be https");
    expect(res.code).toBe("INVALID_URL_SCHEME");
    expect(res.remedy).toContain("https://");
  });

  it("decodes target oldid ordering error", () => {
    const res = decodeContractRevert("target revision must be later than baseline");
    expect(res.code).toBe("TARGET_NOT_LATER");
  });

  it("decodes claimsboard unauthorized owner", () => {
    const res = decodeContractRevert("only owner can set ledger address");
    expect(res.code).toBe("UNAUTHORIZED_OWNER");
    expect(res.category).toBe("PERMISSION");
  });

  it("decodes unknown error gracefully to GENERIC_REVERT", () => {
    const res = decodeContractRevert("some arbitrary unexpected python error");
    expect(res.code).toBe("GENERIC_REVERT");
    expect(res.friendlyMessage).toContain("Transaction reverted:");
  });

  it("decodes empty error to UNKNOWN_ERROR", () => {
    const res = decodeContractRevert("");
    expect(res.code).toBe("UNKNOWN_ERROR");
  });
});

describe("revertMap Contract Completeness Suite", () => {
  it("covers 100% of gl.vm.UserError instances across both reference contracts", () => {
    const ledgerPath = path.resolve(process.cwd(), "contracts-reference/SourceDriftLedger.py");
    const claimsPath = path.resolve(process.cwd(), "contracts-reference/ClaimsBoard.py");

    expect(fs.existsSync(ledgerPath)).toBe(true);
    expect(fs.existsSync(claimsPath)).toBe(true);

    const ledgerSource = fs.readFileSync(ledgerPath, "utf8");
    const claimsSource = fs.readFileSync(claimsPath, "utf8");

    // Extract all gl.vm.UserError arguments
    const userErrorRegex = /gl\.vm\.UserError\(\s*(["'f])([^)]+)\)/g;
    const errorsToTest: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = userErrorRegex.exec(ledgerSource)) !== null) {
      let rawArg = match[2].trim();
      // Clean string quotes
      if (rawArg.startsWith('"') && rawArg.endsWith('"')) {
        rawArg = rawArg.slice(1, -1);
      } else if (rawArg.startsWith("'") && rawArg.endsWith("'")) {
        rawArg = rawArg.slice(1, -1);
      } else if (rawArg.includes("{")) {
        // For f-strings, take the prefix before {
        rawArg = rawArg.split("{")[0].replace(/^["']/, "").trim();
      }
      if (rawArg && !errorsToTest.includes(rawArg)) {
        errorsToTest.push(rawArg);
      }
    }

    while ((match = userErrorRegex.exec(claimsSource)) !== null) {
      let rawArg = match[2].trim();
      if (rawArg.startsWith('"') && rawArg.endsWith('"')) {
        rawArg = rawArg.slice(1, -1);
      } else if (rawArg.startsWith("'") && rawArg.endsWith("'")) {
        rawArg = rawArg.slice(1, -1);
      } else if (rawArg.includes("{")) {
        rawArg = rawArg.split("{")[0].replace(/^["']/, "").trim();
      }
      if (rawArg && !errorsToTest.includes(rawArg)) {
        errorsToTest.push(rawArg);
      }
    }

    console.log(`Auditing ${errorsToTest.length} contract UserErrors against revertMap...`);
    expect(errorsToTest.length).toBeGreaterThan(40);

    const unmapped: string[] = [];
    for (const errText of errorsToTest) {
      const decoded = decodeContractRevert(errText);
      if (decoded.code === "GENERIC_REVERT") {
        unmapped.push(errText);
      }
    }

    if (unmapped.length > 0) {
      console.error("Unmapped contract UserErrors found:", unmapped);
    }

    expect(unmapped).toEqual([]);
  });
});
