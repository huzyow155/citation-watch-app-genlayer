import React, { useState } from "react";
import { Check, Copy, ExternalLink, RefreshCw, AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { getExplorerTxUrl } from "../config/chain";
import type { PipelineStage, TxProgress } from "../lib/txLifecycle";

interface TxPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: TxProgress | null;
  title?: string;
  onRetry?: () => void;
}

export const TxPipelineModal: React.FC<TxPipelineModalProps> = ({
  isOpen,
  onClose,
  progress,
  title = "Consensus Transaction",
  onRetry,
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !progress) return null;

  const copyTxHash = () => {
    if (progress?.txHash) {
      navigator.clipboard.writeText(progress.txHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const stage = progress.stage;
  const isTerminalSuccess = stage === "complete" || stage === "state_confirmed" || stage === "accepted";
  const isDisagreed = stage === "disagreed";
  const isTimedOut = stage === "timed_out";
  const isReverted = stage === "reverted";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity text-left"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-pipeline-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold inline-block mb-1">
              GenLayer Consensus Pipeline
            </span>
            <h3 id="tx-pipeline-title" className="text-xl font-bold text-white">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Progress Pipeline Steps */}
        <div className="my-6 space-y-3">
          {/* Step 1: Submitting */}
          <div className="flex items-center space-x-3 text-sm">
            {stage === "signing" || stage === "submitting" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            ) : stage !== "idle" ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : (
              <Clock className="h-4 w-4 text-slate-600" />
            )}
            <span className={stage === "signing" || stage === "submitting" ? "text-cyan-300 font-medium" : "text-slate-400"}>
              1. Signing & Submitting to Studionet
            </span>
          </div>

          {/* Step 2: Consensus */}
          <div className="flex items-center space-x-3 text-sm">
            {stage === "consensus" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            ) : isTerminalSuccess ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : isDisagreed || isTimedOut || isReverted ? (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            ) : (
              <Clock className="h-4 w-4 text-slate-600" />
            )}
            <span className={stage === "consensus" ? "text-cyan-300 font-medium" : "text-slate-400"}>
              2. Validator Voting & Execution
              {progress.totalVotes !== undefined && progress.totalVotes > 0 && (
                <span className="ml-2 text-xs text-slate-400">
                  ({progress.agreeCount ?? 0}/{progress.totalVotes} validators agree)
                </span>
              )}
            </span>
          </div>

          {/* Step 3: Acceptance / Finality */}
          <div className="flex items-center space-x-3 text-sm">
            {isTerminalSuccess ? (
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            ) : isReverted ? (
              <AlertCircle className="h-4 w-4 text-rose-500" />
            ) : isDisagreed ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Clock className="h-4 w-4 text-slate-600" />
            )}
            <span
              className={
                isTerminalSuccess
                  ? "text-emerald-400 font-semibold"
                  : isReverted
                  ? "text-rose-400 font-semibold"
                  : isDisagreed
                  ? "text-amber-400 font-semibold"
                  : "text-slate-500"
              }
            >
              3. Accepted by Validators (On-Chain State Confirmed)
            </span>
          </div>
        </div>

        {/* Revert / Error Callout */}
        {isReverted && (
          <div className="mb-4 rounded-xl border border-rose-800 bg-rose-950/50 p-4 text-rose-200">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
              <div>
                <p className="font-semibold text-rose-300">Contract Execution Reverted</p>
                <p className="mt-1 text-sm text-rose-200">{progress.decodedRevert || "Leader returned ERROR"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disagreement Callout */}
        {isDisagreed && (
          <div className="mb-4 rounded-xl border border-amber-800 bg-amber-950/50 p-4 text-amber-200">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-300">Validator Disagreement</p>
                <p className="mt-1 text-sm text-amber-200">
                  Validators did not reach consensus agreement. Transaction concluded with status UNDETERMINED.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tx Hash & Explorer Link */}
        {progress.txHash && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Transaction Hash</span>
              <button
                type="button"
                onClick={copyTxHash}
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedHash ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedHash ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <p className="font-mono text-xs break-all text-slate-300">{progress.txHash}</p>
            <div className="mt-2.5 flex justify-end">
              <a
                href={getExplorerTxUrl(progress.txHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:underline"
              >
                <span>View on GenLayer Explorer</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end space-x-3">
          {onRetry && (isReverted || isDisagreed || isTimedOut) && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
            >
              Try Again
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            {isTerminalSuccess ? "Done" : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  );
};
