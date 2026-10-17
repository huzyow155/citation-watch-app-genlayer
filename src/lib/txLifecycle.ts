export type PipelineStage =
  | "idle"
  | "signing"
  | "submitting"
  | "consensus"
  | "accepted"
  | "state_confirmed"
  | "disagreed"
  | "reverted"
  | "timed_out"
  | "complete";

export interface TxProgress {
  stage: PipelineStage;
  txHash?: string;
  leaderResult?: "SUCCESS" | "ERROR" | string;
  decodedRevert?: string;
  agreeCount?: number;
  totalVotes?: number;
  message?: string;
}

/**
 * Checks if a transaction status represents a terminal receipt state in GenLayer.
 * A transaction is terminal if it has finished validator voting (ACCEPTED or FINALIZED)
 * or ended in a terminal non-success state (undetermined/disagreement, timeout, canceled).
 */
export function isTerminalReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return (
    s === "ACCEPTED" ||
    s === "FINALIZED" ||
    s === "UNDETERMINED" ||
    s === "MAJORITY_DISAGREE" ||
    s === "CANCELED" ||
    s === "VALIDATORS_TIMEOUT" ||
    s === "LEADER_TIMEOUT" ||
    s === "5" || // ACCEPTED
    s === "6" || // UNDETERMINED
    s === "7" || // FINALIZED
    s === "8" || // CANCELED
    s === "12" || // VALIDATORS_TIMEOUT
    s === "13" // LEADER_TIMEOUT
  );
}

export function isAcceptedReceiptStatus(status: string | number | undefined | null): boolean {
  if (status === undefined || status === null) return false;
  const s = String(status).trim().toUpperCase();
  return s === "ACCEPTED" || s === "FINALIZED" || s === "5" || s === "7";
}

export function isDisagreedReceiptStatus(status: string | number | undefined | null): boolean {
  const s = String(status || "").trim().toUpperCase();
  return s === "UNDETERMINED" || s === "MAJORITY_DISAGREE" || s === "6";
}

export function isTimeoutReceiptStatus(status: string | number | undefined | null): boolean {
  const s = String(status || "").trim().toUpperCase();
  return s === "VALIDATORS_TIMEOUT" || s === "LEADER_TIMEOUT" || s === "12" || s === "13";
}
