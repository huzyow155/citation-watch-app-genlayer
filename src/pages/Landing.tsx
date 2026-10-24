import React from "react";
import { Link } from "react-router-dom";
import {
  FileCheck2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Search,
  BookOpen,
} from "lucide-react";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  CONTRACT_REPO_URL,
  getExplorerAddressUrl,
} from "../config/chain";
import { useTypewriter, useScrollReveal } from "../lib/motion";

export const Landing: React.FC = () => {
  const headlineText = "Decentralized Source Drift & Citation Integrity";
  const subtextText =
    "Track Wikipedia citation evolution across revisions or in real time. Validators re-fetch raw HTML, derive canonical substrings, and independently reach consensus on citation drift classes.";

  const headlineTypewriter = useTypewriter(headlineText, 45, 50);
  const subtextTypewriter = useTypewriter(
    subtextText,
    18,
    headlineText.length * 45 + 150
  );

  const section1Reveal = useScrollReveal(0);
  const section2Reveal = useScrollReveal(100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans text-base overflow-x-hidden">
      {/* Hero Section */}
      <section
        aria-labelledby="hero-headline"
        className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950/0 to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/40 bg-cyan-950/60 px-4 py-1.5 text-xs font-semibold text-cyan-300 mb-6">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Autonomous AI-Validator Consensus</span>
          </div>

          {/* Hero Headline with Typewriter */}
          <h1
            id="hero-headline"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight min-h-[5rem] sm:min-h-[7rem]"
          >
            <span>{headlineTypewriter.displayedText}</span>
            {headlineTypewriter.showCaret && (
              <span className="inline-block w-1 h-8 sm:h-12 bg-cyan-400 ml-1.5 align-middle animate-pulse" />
            )}
          </h1>

          {/* Subtext with Typewriter */}
          <p
            id="hero-subtext"
            className="mx-auto mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-slate-200 leading-relaxed min-h-[4.5rem]"
          >
            <span>{subtextTypewriter.displayedText}</span>
            {subtextTypewriter.showCaret && (
              <span className="inline-block w-0.5 h-4 sm:h-5 bg-cyan-400 ml-1 align-middle animate-pulse" />
            )}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/app"
              className="inline-flex min-h-[44px] items-center space-x-2 rounded-xl bg-cyan-500 px-6 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-white"
            >
              <span>Open Citation Workbench</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={CONTRACT_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-base font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span>Contract Source</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Drift Classification Cards (Real Empirical Examples) */}
      <section
        ref={section1Reveal.ref}
        aria-labelledby="drift-classes-title"
        className={`mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 transition-all duration-700 ease-out ${
          section1Reveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mb-12 text-center">
          <h2 id="drift-classes-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Four Grounded Drift Classes
          </h2>
          <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto">
            Rigorous consensus rules categorize changes between baseline and target revisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SAME */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="inline-block rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold text-emerald-300 mb-3">
                SAME
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deterministic Match</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Exact or normalized substring present in the target source text. Bypasses model evaluation.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-300 font-semibold block mb-1">Empirical Proof:</span>
                Alan Turing target rev 1380390650 (4/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-xs text-emerald-300 uppercase font-bold">Verified On-Chain</span>
          </div>

          {/* COSMETIC */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="inline-block rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-1 text-xs font-bold text-cyan-300 mb-3">
                COSMETIC
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Rephrased Meaning</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Wording changed but semantic claim remains intact. Consensus reached on rephrased status.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-300 font-semibold block mb-1">Empirical Proof:</span>
                Computing Hardware rev 1258760000 (3/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-xs text-cyan-300 uppercase font-bold">Verified On-Chain</span>
          </div>

          {/* MATERIAL */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="inline-block rounded-lg bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 text-xs font-bold text-amber-300 mb-3">
                MATERIAL
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Contradiction / Shift</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Substantive facts altered, dates shifted, or claims contradicted in the updated text.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-300 font-semibold block mb-1">Empirical Proof:</span>
                Python Language rev 1258761000 (3/5 votes agreed).
              </div>
            </div>
            <span className="mt-4 text-xs text-amber-300 uppercase font-bold">Verified On-Chain</span>
          </div>

          {/* REMOVED */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div>
              <div className="inline-block rounded-lg bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 text-xs font-bold text-rose-300 mb-3">
                REMOVED
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Deleted Content</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Target text completely lacks the referenced claim. Absence calibrated with 0.1630 empirical margin.
              </p>
              <div className="rounded-lg bg-slate-950 p-3 text-xs font-mono text-slate-300 border border-slate-800">
                <span className="text-slate-300 font-semibold block mb-1">Honest Verification:</span>
                Unit-tested only. On-chain consensus attempts reverted due to LLM format variance.
              </div>
            </div>
            <span className="mt-4 text-xs text-rose-300 uppercase font-bold">Unit-Tested Only</span>
          </div>
        </div>
      </section>

      {/* Architecture & Contracts */}
      <section
        ref={section2Reveal.ref}
        aria-labelledby="architecture-title"
        className={`border-t border-slate-800 bg-slate-900/40 px-4 py-20 sm:px-6 lg:px-8 transition-all duration-700 ease-out ${
          section2Reveal.isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <div className="mx-auto max-w-5xl">
          <h2 id="architecture-title" className="text-3xl font-bold text-white text-center mb-10">
            Deployed Contracts &amp; Architecture
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Main Ledger Contract
              </span>
              <h3 className="text-xl font-bold text-white mb-2">SourceDriftLedger</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Handles citation registration, web fetching, deterministic matching, and validator model evaluation.
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                <p className="text-slate-400 font-semibold">Address:</p>
                <p className="break-all text-cyan-300">{SOURCE_DRIFT_LEDGER_ADDRESS}</p>
              </div>
              <div className="mt-4">
                <a
                  href={getExplorerAddressUrl(SOURCE_DRIFT_LEDGER_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:underline focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                Downstream Consumer Contract
              </span>
              <h3 className="text-xl font-bold text-white mb-2">ClaimsBoard</h3>
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                Cross-contract consumer proving reuse: publishes claims linked to verified citations and caches drift badges.
              </p>
              <div className="space-y-1 font-mono text-xs text-slate-300">
                <p className="text-slate-400 font-semibold">Address:</p>
                <p className="break-all text-cyan-300">{CLAIMS_BOARD_ADDRESS}</p>
              </div>
              <div className="mt-4">
                <a
                  href={getExplorerAddressUrl(CLAIMS_BOARD_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[44px] items-center space-x-1.5 text-xs font-semibold text-cyan-400 hover:underline focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
                >
                  <span>View on Explorer</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Semantic Footer */}
      <div className="border-t border-slate-800 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 CitationWatch &middot; Built for GenLayer Studionet (Preview).</p>
          <div className="flex items-center space-x-4">
            <Link to="/app" className="min-h-[44px] inline-flex items-center text-slate-300 hover:text-white font-medium">
              Workbench
            </Link>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] inline-flex items-center text-slate-300 hover:text-white font-medium"
            >
              GenLayer Studio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
