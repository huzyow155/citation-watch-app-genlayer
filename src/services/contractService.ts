import { createClient } from "genlayer-js";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  GENLAYER_CHAIN,
  RPC_URL,
} from "../config/chain";
import type { CitationRecord, AuditRecord, ClaimBadgeRecord } from "../lib/outcome";
import {
  isAcceptedReceiptStatus,
  isDisagreedReceiptStatus,
  isTimeoutReceiptStatus,
  type TxProgress,
} from "../lib/txLifecycle";
import { decodeContractRevert } from "../lib/revertMap";

export function getGenLayerClient(account?: any) {
  return createClient({
    chain: GENLAYER_CHAIN,
    endpoint: RPC_URL,
    account,
  });
}

/**
 * Decodes leader receipt result from GenLayer JSON-RPC base64 response.
 */
export function decodeLeaderReceiptResult(base64Str: string): string {
  try {
    if (!base64Str) return "";
    const binaryStr = atob(base64Str);
    if (binaryStr.length <= 1) return "";
    const sliced = binaryStr.slice(1);
    const bytes = new Uint8Array(sliced.length);
    for (let i = 0; i < sliced.length; i++) {
      bytes[i] = sliced.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "";
  }
}

// -----------------------------------------------------------------------------
// READ CALLS
// -----------------------------------------------------------------------------

export async function getCitation(citationId: string): Promise<CitationRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw: any = await client.readContract({
      address: SOURCE_DRIFT_LEDGER_ADDRESS,
      functionName: "get_citation",
      args: [citationId],
    });
    if (!raw) return null;
    return raw as unknown as CitationRecord;
  } catch (err: any) {
    if (String(err).includes("citation not found")) {
      return null;
    }
    throw err;
  }
}

export async function getLatestAudit(citationId: string): Promise<AuditRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw: any = await client.readContract({
      address: SOURCE_DRIFT_LEDGER_ADDRESS,
      functionName: "get_latest_audit",
      args: [citationId],
    });
    if (!raw) return null;
    return raw as unknown as AuditRecord;
  } catch (err: any) {
    if (String(err).includes("audit not found") || String(err).includes("citation not found")) {
      return null;
    }
    throw err;
  }
}

export async function getAudit(auditId: string): Promise<AuditRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw: any = await client.readContract({
      address: SOURCE_DRIFT_LEDGER_ADDRESS,
      functionName: "get_audit",
      args: [auditId],
    });
    if (!raw) return null;
    return raw as unknown as AuditRecord;
  } catch {
    return null;
  }
}

export async function getCitationAuditCount(citationId: string): Promise<number> {
  const client = getGenLayerClient();
  try {
    const count: any = await client.readContract({
      address: SOURCE_DRIFT_LEDGER_ADDRESS,
      functionName: "get_citation_audit_count",
      args: [citationId],
    });
    return Number(count) || 0;
  } catch {
    return 0;
  }
}

export async function getClaim(claimId: string): Promise<ClaimBadgeRecord | null> {
  const client = getGenLayerClient();
  try {
    const raw: any = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "get_claim",
      args: [claimId],
    });
    if (!raw) return null;
    return raw as unknown as ClaimBadgeRecord;
  } catch {
    return null;
  }
}

export async function getClaimsLedgerAddress(): Promise<string> {
  const client = getGenLayerClient();
  try {
    const addr = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "get_ledger",
      args: [],
    });
    return String(addr);
  } catch {
    return "";
  }
}

export async function getClaimsOwner(): Promise<string> {
  const client = getGenLayerClient();
  try {
    const owner = await client.readContract({
      address: CLAIMS_BOARD_ADDRESS,
      functionName: "get_owner",
      args: [],
    });
    return String(owner);
  } catch {
    return "";
  }
}

// -----------------------------------------------------------------------------
// WRITE CALLS & LIFECYCLE
// -----------------------------------------------------------------------------

export async function monitorTransaction(
  txHash: string,
  onProgress?: (progress: TxProgress) => void
): Promise<{ status: string; receipt: any; decodedRevert?: string }> {
  const client = getGenLayerClient();
  const startTime = Date.now();
  const timeoutMs = 240000; // 4 minutes

  while (Date.now() - startTime < timeoutMs) {
    try {
      const receipt: any = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
      if (receipt) {
        const rawStatus = receipt.status;
        const leader = receipt.leader_receipt?.[0];
        let decodedRevert: string | undefined;

        if (leader?.execution_result === "ERROR" && leader?.result) {
          const rawDecoded = decodeLeaderReceiptResult(leader.result);
          const parsed = decodeContractRevert(rawDecoded);
          decodedRevert = parsed.friendlyMessage;
        }

        // Count agree votes
        const votes = receipt.validator_receipts || [];
        const agreeCount = votes.filter((v: any) => v.vote === 1 || v.vote === true || v.agree === true).length;
        const totalVotes = votes.length;

        if (isAcceptedReceiptStatus(rawStatus)) {
          if (leader?.execution_result === "ERROR") {
            onProgress?.({
              stage: "reverted",
              txHash,
              leaderResult: "ERROR",
              decodedRevert,
              agreeCount,
              totalVotes,
            });
            return { status: "REVERTED", receipt, decodedRevert };
          }

          onProgress?.({
            stage: "accepted",
            txHash,
            leaderResult: "SUCCESS",
            agreeCount,
            totalVotes,
          });
          return { status: "ACCEPTED", receipt };
        }

        if (isDisagreedReceiptStatus(rawStatus)) {
          onProgress?.({
            stage: "disagreed",
            txHash,
            leaderResult: leader?.execution_result,
            agreeCount,
            totalVotes,
          });
          return { status: "DISAGREED", receipt };
        }

        if (isTimeoutReceiptStatus(rawStatus)) {
          onProgress?.({
            stage: "timed_out",
            txHash,
            leaderResult: leader?.execution_result,
            agreeCount,
            totalVotes,
          });
          return { status: "TIMED_OUT", receipt };
        }

        onProgress?.({
          stage: "consensus",
          txHash,
          agreeCount,
          totalVotes,
        });
      }
    } catch {
      // Continue polling
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  onProgress?.({ stage: "timed_out", txHash });
  return { status: "TIMED_OUT", receipt: null };
}

export async function registerCitation(
  account: any,
  baseUrl: string,
  articleTitle: string,
  baselineOldid: number,
  claimElements: string[],
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string; citationId?: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: SOURCE_DRIFT_LEDGER_ADDRESS,
    functionName: "register_citation",
    args: [baseUrl, articleTitle, baselineOldid, claimElements],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Registration failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}

export async function auditCitationRevision(
  account: any,
  citationId: string,
  targetOldid: number,
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: SOURCE_DRIFT_LEDGER_ADDRESS,
    functionName: "audit_citation_revision",
    args: [citationId, targetOldid],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Audit failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}

export async function auditCitationLive(
  account: any,
  citationId: string,
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: SOURCE_DRIFT_LEDGER_ADDRESS,
    functionName: "audit_citation_live",
    args: [citationId],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Live audit failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}

export async function publishClaim(
  account: any,
  citationId: string,
  claimText: string,
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: CLAIMS_BOARD_ADDRESS,
    functionName: "publish_claim",
    args: [citationId, claimText],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Publish claim failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}

export async function refreshClaim(
  account: any,
  claimId: string,
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: CLAIMS_BOARD_ADDRESS,
    functionName: "refresh_claim",
    args: [claimId],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Refresh claim failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}

export async function setLedger(
  account: any,
  newLedgerAddress: string,
  onProgress?: (progress: TxProgress) => void
): Promise<{ txHash: string }> {
  onProgress?.({ stage: "signing" });
  const client = getGenLayerClient(account);

  onProgress?.({ stage: "submitting" });
  const txHash: string = await client.writeContract({
    address: CLAIMS_BOARD_ADDRESS,
    functionName: "set_ledger",
    args: [newLedgerAddress],
    value: 0n,
  } as any);

  onProgress?.({ stage: "consensus", txHash });
  const result = await monitorTransaction(txHash, onProgress);

  if (result.status !== "ACCEPTED") {
    throw new Error(result.decodedRevert || `Set ledger failed with status ${result.status}`);
  }

  onProgress?.({ stage: "state_confirmed", txHash });
  return { txHash };
}
