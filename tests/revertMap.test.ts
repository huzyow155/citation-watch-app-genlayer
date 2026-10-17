import { describe, it, expect } from "vitest";
import { decodeContractRevert, REVERT_MAP } from "../src/lib/revertMap";

describe("decodeContractRevert", () => {
  it("decodes live cooldown revert", () => {
    const res = decodeContractRevert("live audit cooldown in progress");
    expect(res.code).toBe("LIVE_COOLDOWN_ACTIVE");
    expect(res.category).toBe("COOLDOWN");
    expect(res.friendlyMessage).toContain("300-second cooldown");
  });

  it("decodes invalid url scheme", () => {
    const res = decodeContractRevert("invalid url scheme: only https is permitted");
    expect(res.code).toBe("INVALID_URL_SCHEME");
    expect(res.remedy).toContain("https://");
  });

  it("decodes target oldid ordering error", () => {
    const res = decodeContractRevert("target oldid must be greater than baseline oldid");
    expect(res.code).toBe("TARGET_OLDID_ORDER");
  });

  it("decodes claimsboard unauthorized owner", () => {
    const res = decodeContractRevert("only owner can update ledger");
    expect(res.code).toBe("UNAUTHORIZED_OWNER");
    expect(res.category).toBe("PERMISSION");
  });

  it("covers all registered revert map definitions", () => {
    for (const [key, def] of Object.entries(REVERT_MAP)) {
      const decoded = decodeContractRevert(key);
      expect(decoded.code).toBe(def.code);
    }
  });
});
