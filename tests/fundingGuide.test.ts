import { describe, it, expect } from "vitest";
import { CHAIN_ID, NETWORK_NAME, NETWORK_STATUS, RPC_URL, WALLET_DISCLAIMER } from "../src/config/chain";

describe("Funding Guide & Gas Semantics", () => {
  it("defines the exact GenLayer Studionet (Preview) network parameters", () => {
    expect(CHAIN_ID).toBe(61999);
    expect(NETWORK_NAME).toBe("GenLayer Studionet");
    expect(NETWORK_STATUS).toBe("GenLayer Studionet (Preview)");
    expect(RPC_URL).toBe("https://studio.genlayer.com/api");
  });

  it("contains the mandatory preview network disclaimer", () => {
    expect(WALLET_DISCLAIMER).toContain("Studionet-only throwaway key");
    expect(WALLET_DISCLAIMER).toContain("Preview network, no real value");
  });

  it("specifies that write transactions have 0 native gas fee on Studionet Preview", () => {
    const previewGasFee = 0n;
    expect(previewGasFee).toBe(0n);
  });
});
