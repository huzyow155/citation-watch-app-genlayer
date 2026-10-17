import { describe, it, expect } from "vitest";
import { mapVerdict } from "../src/lib/outcome";

describe("outcome mapVerdict", () => {
  it("maps UNCHANGED to HEALTHY and VERIFIED with on-chain accepted flag", () => {
    const res = mapVerdict("UNCHANGED");
    expect(res.verdictClass).toBe("UNCHANGED");
    expect(res.statusLabel).toBe("HEALTHY");
    expect(res.badgeLabel).toBe("VERIFIED");
    expect(res.isObservedOnChain).toBe(true);
    expect(res.honestyNote).toContain("accepted by validators");
  });

  it("maps SAME alias to UNCHANGED verdict", () => {
    const res = mapVerdict("SAME");
    expect(res.verdictClass).toBe("UNCHANGED");
    expect(res.statusLabel).toBe("HEALTHY");
    expect(res.isObservedOnChain).toBe(true);
  });

  it("maps COSMETIC to HEALTHY and REPHRASED with on-chain accepted flag", () => {
    const res = mapVerdict("COSMETIC");
    expect(res.verdictClass).toBe("COSMETIC");
    expect(res.statusLabel).toBe("HEALTHY");
    expect(res.badgeLabel).toBe("REPHRASED");
    expect(res.isObservedOnChain).toBe(true);
  });

  it("maps MATERIAL to DRIFTED with on-chain accepted flag", () => {
    const res = mapVerdict("MATERIAL");
    expect(res.verdictClass).toBe("MATERIAL");
    expect(res.statusLabel).toBe("DRIFTED");
    expect(res.badgeLabel).toBe("DRIFTED");
    expect(res.isObservedOnChain).toBe(true);
  });

  it("maps REMOVED with explicit honesty note that it is unit-tested only and not yet observed on-chain", () => {
    const res = mapVerdict("REMOVED");
    expect(res.verdictClass).toBe("REMOVED");
    expect(res.statusLabel).toBe("REMOVED");
    expect(res.badgeLabel).toBe("REMOVED");
    expect(res.isObservedOnChain).toBe(false);
    expect(res.honestyNote).toBe("unit-tested only, not yet observed on-chain");
    expect(res.explanation).toContain("0.1630");
  });

  it("handles case-insensitivity and leading/trailing whitespace", () => {
    const res = mapVerdict("   cosmetic  ");
    expect(res.verdictClass).toBe("COSMETIC");
    expect(res.statusLabel).toBe("HEALTHY");
  });

  it("handles null and undefined gracefully as UNAUDITED", () => {
    const res1 = mapVerdict(null);
    expect(res1.verdictClass).toBe("UNAUDITED");
    expect(res1.statusLabel).toBe("UNAUDITED");

    const res2 = mapVerdict(undefined);
    expect(res2.verdictClass).toBe("UNAUDITED");
  });
});
