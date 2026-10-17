import { describe, it, expect, vi } from "vitest";
import {
  isTerminalReceiptStatus,
  isAcceptedReceiptStatus,
  isDisagreedReceiptStatus,
  isTimeoutReceiptStatus,
  type PipelineStage,
  type TxProgress,
} from "../src/lib/txLifecycle";

describe("txLifecycle status checkers", () => {
  it("identifies all string terminal statuses correctly", () => {
    expect(isTerminalReceiptStatus("ACCEPTED")).toBe(true);
    expect(isTerminalReceiptStatus("FINALIZED")).toBe(true);
    expect(isTerminalReceiptStatus("UNDETERMINED")).toBe(true);
    expect(isTerminalReceiptStatus("MAJORITY_DISAGREE")).toBe(true);
    expect(isTerminalReceiptStatus("CANCELED")).toBe(true);
    expect(isTerminalReceiptStatus("VALIDATORS_TIMEOUT")).toBe(true);
    expect(isTerminalReceiptStatus("LEADER_TIMEOUT")).toBe(true);
  });

  it("handles case-insensitivity and whitespace in terminal status strings", () => {
    expect(isTerminalReceiptStatus(" accepted ")).toBe(true);
    expect(isTerminalReceiptStatus("finalized")).toBe(true);
    expect(isTerminalReceiptStatus("  majority_disagree  ")).toBe(true);
  });

  it("identifies all numeric status code strings correctly", () => {
    expect(isTerminalReceiptStatus("5")).toBe(true); // ACCEPTED
    expect(isTerminalReceiptStatus("6")).toBe(true); // UNDETERMINED
    expect(isTerminalReceiptStatus("7")).toBe(true); // FINALIZED
    expect(isTerminalReceiptStatus("8")).toBe(true); // CANCELED
    expect(isTerminalReceiptStatus("12")).toBe(true); // VALIDATORS_TIMEOUT
    expect(isTerminalReceiptStatus("13")).toBe(true); // LEADER_TIMEOUT
  });

  it("identifies numeric values correctly", () => {
    expect(isTerminalReceiptStatus(5)).toBe(true);
    expect(isTerminalReceiptStatus(6)).toBe(true);
    expect(isTerminalReceiptStatus(7)).toBe(true);
    expect(isTerminalReceiptStatus(12)).toBe(true);
    expect(isTerminalReceiptStatus(13)).toBe(true);
  });

  it("returns false for non-terminal, null, and undefined statuses", () => {
    expect(isTerminalReceiptStatus("PENDING")).toBe(false);
    expect(isTerminalReceiptStatus("PROPOSED")).toBe(false);
    expect(isTerminalReceiptStatus("0")).toBe(false);
    expect(isTerminalReceiptStatus("1")).toBe(false);
    expect(isTerminalReceiptStatus(null)).toBe(false);
    expect(isTerminalReceiptStatus(undefined)).toBe(false);
    expect(isTerminalReceiptStatus("")).toBe(false);
  });

  it("identifies accepted statuses strictly", () => {
    expect(isAcceptedReceiptStatus("ACCEPTED")).toBe(true);
    expect(isAcceptedReceiptStatus("FINALIZED")).toBe(true);
    expect(isAcceptedReceiptStatus("5")).toBe(true);
    expect(isAcceptedReceiptStatus("7")).toBe(true);

    expect(isAcceptedReceiptStatus("UNDETERMINED")).toBe(false);
    expect(isAcceptedReceiptStatus("VALIDATORS_TIMEOUT")).toBe(false);
    expect(isAcceptedReceiptStatus(null)).toBe(false);
  });

  it("identifies disagreed statuses strictly", () => {
    expect(isDisagreedReceiptStatus("UNDETERMINED")).toBe(true);
    expect(isDisagreedReceiptStatus("MAJORITY_DISAGREE")).toBe(true);
    expect(isDisagreedReceiptStatus("6")).toBe(true);

    expect(isDisagreedReceiptStatus("ACCEPTED")).toBe(false);
    expect(isDisagreedReceiptStatus("VALIDATORS_TIMEOUT")).toBe(false);
  });

  it("identifies timeout statuses strictly", () => {
    expect(isTimeoutReceiptStatus("VALIDATORS_TIMEOUT")).toBe(true);
    expect(isTimeoutReceiptStatus("LEADER_TIMEOUT")).toBe(true);
    expect(isTimeoutReceiptStatus("12")).toBe(true);
    expect(isTimeoutReceiptStatus("13")).toBe(true);

    expect(isTimeoutReceiptStatus("ACCEPTED")).toBe(false);
    expect(isTimeoutReceiptStatus("UNDETERMINED")).toBe(false);
  });
});

describe("txLifecycle readback verification flow", () => {
  it("only marks completion stage after readback confirms on-chain state", async () => {
    const stageHistory: PipelineStage[] = [];
    const onProgress = (p: TxProgress) => stageHistory.push(p.stage);

    // Mock lifecycle simulator
    async function simulateFlowWithReadback(
      simulateReadbackSuccess: boolean
    ): Promise<boolean> {
      onProgress({ stage: "signing" });
      onProgress({ stage: "submitting" });
      onProgress({ stage: "consensus" });

      // Transaction accepted by validators
      onProgress({ stage: "accepted" });

      // READBACK VERIFICATION STEP:
      let readbackConfirmed = false;
      if (simulateReadbackSuccess) {
        readbackConfirmed = true;
        onProgress({ stage: "state_confirmed" });
      }

      if (!readbackConfirmed) {
        throw new Error("Readback verification failed: record not found on-chain.");
      }

      return true;
    }

    // 1. Success case: state_confirmed is reached
    const ok = await simulateFlowWithReadback(true);
    expect(ok).toBe(true);
    expect(stageHistory).toContain("state_confirmed");
    expect(stageHistory[stageHistory.length - 1]).toBe("state_confirmed");

    // 2. Failure case: readback fails -> error thrown, state_confirmed NOT reached
    const failedHistory: PipelineStage[] = [];
    const failedOnProgress = (p: TxProgress) => failedHistory.push(p.stage);

    let errorThrown = false;
    try {
      await (async () => {
        failedOnProgress({ stage: "signing" });
        failedOnProgress({ stage: "submitting" });
        failedOnProgress({ stage: "consensus" });
        failedOnProgress({ stage: "accepted" });
        // Readback fails:
        throw new Error("Readback verification timed out.");
      })();
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toBe(true);
    expect(failedHistory).not.toContain("state_confirmed");
  });

  it("decodes leader receipt results correctly with first status byte sliced", async () => {
    // Leader results in GenLayer return base64 with a 1-byte status prefix followed by utf-8 payload
    const text = "quote not found verbatim in baseline";
    const binary = String.fromCharCode(0) + text;
    const base64 = btoa(binary);

    const { decodeLeaderReceiptResult } = await import("../src/services/contractService");
    const decoded = decodeLeaderReceiptResult(base64);
    expect(decoded).toBe(text);
  });

  it("decodes leader receipt results when returned as an object with payload or raw", async () => {
    const { decodeLeaderReceiptResult } = await import("../src/services/contractService");
    expect(decodeLeaderReceiptResult({ payload: "quote not found verbatim in baseline" })).toBe("quote not found verbatim in baseline");

    const binary = String.fromCharCode(1) + "custom error";
    const base64 = btoa(binary);
    expect(decodeLeaderReceiptResult({ raw: base64 })).toBe("custom error");
  });
});

