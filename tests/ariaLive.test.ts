import { describe, it, expect } from "vitest";
import { getAriaLiveAnnouncement } from "../src/components/TxPipelineModal";
import type { PipelineStage } from "../src/lib/txLifecycle";

describe("ARIA Live Region Transaction Announcements", () => {
  it("announces signing state", () => {
    const text = getAriaLiveAnnouncement("signing");
    expect(text).toContain("signing in progress");
  });

  it("announces submitting state", () => {
    const text = getAriaLiveAnnouncement("submitting");
    expect(text).toContain("Submitting transaction to GenLayer Studionet (Preview)");
  });

  it("announces consensus pending state with and without vote counts", () => {
    const textWithout = getAriaLiveAnnouncement("consensus");
    expect(textWithout).toContain("Validator consensus pending");

    const textWith = getAriaLiveAnnouncement("consensus", 3, 5);
    expect(textWith).toContain("Validator consensus pending: 3 of 5 votes agreed");
  });

  it("announces accepted state", () => {
    const text = getAriaLiveAnnouncement("accepted");
    expect(text).toBe("Transaction accepted by validators");
  });

  it("announces state confirmed and complete states", () => {
    expect(getAriaLiveAnnouncement("state_confirmed")).toBe("Transaction state confirmed on-chain");
    expect(getAriaLiveAnnouncement("complete")).toBe("Transaction state confirmed on-chain");
  });

  it("announces consensus disagreement state", () => {
    const text = getAriaLiveAnnouncement("disagreed");
    expect(text).toContain("Consensus disagreement");
  });

  it("announces reverted state", () => {
    const text = getAriaLiveAnnouncement("reverted");
    expect(text).toBe("Contract execution reverted");
  });

  it("announces timed out state", () => {
    const text = getAriaLiveAnnouncement("timed_out");
    expect(text).toBe("Transaction timed out waiting for consensus");
  });

  it("handles idle or undefined state safely", () => {
    expect(getAriaLiveAnnouncement("idle")).toBe("Transaction idle");
    expect(getAriaLiveAnnouncement(undefined)).toBe("Transaction idle");
  });
});
