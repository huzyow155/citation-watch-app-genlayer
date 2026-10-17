import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldAlert,
  FileCheck2,
  GitCommit,
  Clock,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  CONTRACT_REPO_URL,
  APP_REPO_URL,
  getExplorerAddressUrl,
} from "../config/chain";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/0 to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-semibold text-cyan-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>GenLayer Studionet (Preview) Consensus</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-white">
            Decentralized Source Drift &amp; Citation Integrity
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Track Wikipedia citation evolution across revisions or in real time. Validators re-fetch raw
            HTML, derive canonical substrings, and independently reach consensus on citation drift classes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex items-center space-x-2 rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all hover:scale-105"
            >
              <span>Open Citation Workbench</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={CONTRACT_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <span>Contract Source</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Drift Classification Cards (Real Empirical Examples) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Four Grounded Drift Classes
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Rigorous consensus rules categorize changes between baseline and target revisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SAME */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 mb-3">
                SAME
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Deterministic Match</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Exact or normalized substring present in the target source text. Bypasses model evaluation.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-500 block mb-1">Empirical Proof:</span>
                Alan Turing target rev 1258759530 (4/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-[10px] text-emerald-400 uppercase font-semibold">Verified On-Chain</span>
          </div>

          {/* COSMETIC */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 mb-3">
                COSMETIC
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rephrased Meaning</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Wording changed but semantic claim remains intact. Consensus reached on rephrased status.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-500 block mb-1">Empirical Proof:</span>
                Computing Hardware rev 1258760000 (3/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-[10px] text-cyan-400 uppercase font-semibold">Verified On-Chain</span>
          </div>

          {/* MATERIAL */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 mb-3">
                MATERIAL
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Contradiction / Shift</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Substantive facts altered, dates shifted, or claims contradicted in the updated text.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-500 block mb-1">Empirical Proof:</span>
                Python Language rev 1258761000 (3/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-[10px] text-amber-400 uppercase font-semibold">Verified On-Chain</span>
          </div>

          {/* REMOVED */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
            <div>
              <div className="inline-block rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 mb-3">
                REMOVED
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Deleted Content</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Target text completely lacks the referenced claim. Similarity score drops below 0.45.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-[11px] font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-500 block mb-1">Honest Verification:</span>
                Unit-tested only. On-chain consensus attempts reverted due to LLM format variance.
              </div>
            </div>
            <span className="mt-4 text-[10px] text-rose-400 uppercase font-semibold">Unit-Tested Only</span>
          </div>
        </div>
      </section>

      {/* Architecture & Contracts */}
      <section className="border-t border-slate-800 bg-slate-900/40 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Deployed Contracts &amp; Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                Main Ledger Contract
              </span>
              <h3 className="text-lg font-bold text-white mb-2">SourceDriftLedger</h3>
              <p className="text-xs text-slate-400 mb-4">
                Handles citation registration, web fetching, deterministic matching, and validator model
                evaluation.
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                <p className="text-slate-500">Address:</p>
                <p className="break-all text-cyan-300">{SOURCE_DRIFT_LEDGER_ADDRESS}</p>
              </div>
              <div className="mt-4">
                <a
                  href={getExplorerAddressUrl(SOURCE_DRIFT_LEDGER_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:underline"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                Downstream Consumer Contract
              </span>
              <h3 className="text-lg font-bold text-white mb-2">ClaimsBoard</h3>
              <p className="text-xs text-slate-400 mb-4">
                Cross-contract consumer proving reuse: publishes claims linked to verified citations and caches
                drift badges.
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                <p className="text-slate-500">Address:</p>
                <p className="break-all text-cyan-300">{CLAIMS_BOARD_ADDRESS}</p>
              </div>
              <div className="mt-4">
                <a
                  href={getExplorerAddressUrl(CLAIMS_BOARD_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:underline"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
