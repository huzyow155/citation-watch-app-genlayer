import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Copy, Check, RefreshCw, ExternalLink, Sparkles, Coins, X } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  getExplorerAddressUrl,
} from "../config/chain";
import { FundingModal } from "./FundingModal";
import { WalkthroughModal, isTourDismissed } from "./WalkthroughModal";

export const Header: React.FC = () => {
  const { address, resetWallet, importKey, disclaimer } = useWallet();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showWalkthroughModal, setShowWalkthroughModal] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState("");
  const location = useLocation();

  const walletDialogRef = useRef<HTMLDivElement>(null);
  const walletTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isTourDismissed()) {
      setShowWalkthroughModal(true);
    }
  }, []);

  // Manage wallet modal accessibility & focus trap
  useEffect(() => {
    if (showWalletModal) {
      walletTriggerRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        if (walletDialogRef.current) {
          const focusable = walletDialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setShowWalletModal(false);
          return;
        }

        if (e.key === "Tab" && walletDialogRef.current) {
          const focusable = Array.from(
            walletDialogRef.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => el.offsetParent !== null);

          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
        clearTimeout(timer);
        if (walletTriggerRef.current && typeof walletTriggerRef.current.focus === "function") {
          walletTriggerRef.current.focus();
        }
      };
    }
  }, [showWalletModal]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopiedAddr(true);
      setTimeout(() => setCopiedAddr(false), 2000);
    }
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (importKeyInput) {
      if (importKey(importKeyInput)) {
        setShowWalletModal(false);
        setImportKeyInput("");
      } else {
        alert("Invalid private key format.");
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full overflow-x-hidden border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link
            to="/"
            aria-label="CitationWatch Home"
            className="flex min-h-[44px] items-center space-x-2.5 sm:space-x-3 group focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl"
          >
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900 p-1 transition-transform group-hover:scale-105 flex-shrink-0">
              <img src="/logo.svg" alt="" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="hidden min-[420px]:inline text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                CitationWatch
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`min-h-[44px] inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                location.pathname === "/"
                  ? "bg-slate-800 text-cyan-400"
                  : "text-slate-200 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Overview
            </Link>
            <Link
              to="/app"
              className={`min-h-[44px] inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                location.pathname.startsWith("/app") || location.pathname.startsWith("/workbench")
                  ? "bg-slate-800 text-cyan-400"
                  : "text-slate-200 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Workbench
            </Link>
          </nav>
        </div>

        {/* Right Section: Tour, Funding Guide, Contracts & Wallet */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Guided Tour Trigger */}
          <button
            type="button"
            onClick={() => setShowWalkthroughModal(true)}
            aria-label="Guided Tour"
            className="inline-flex min-h-[44px] items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 sm:px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-500 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Guided Tour</span>
          </button>

          {/* Get Test Funds Trigger */}
          <button
            type="button"
            onClick={() => setShowFundingModal(true)}
            aria-label="Get Test Funds & Gas Guide"
            className="inline-flex min-h-[44px] items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-900/90 px-2.5 sm:px-3 py-2 text-xs font-semibold text-cyan-300 hover:border-cyan-500 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Coins className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Get Test Funds</span>
          </button>

          {/* Contracts Pill */}
          <div className="hidden lg:flex min-h-[44px] items-center space-x-2 text-xs font-mono text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 bg-slate-900">
            <span className="text-slate-300 font-semibold">Ledger:</span>
            <a
              href={getExplorerAddressUrl(SOURCE_DRIFT_LEDGER_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] inline-flex items-center text-cyan-400 hover:underline space-x-1 focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
            >
              <span>{SOURCE_DRIFT_LEDGER_ADDRESS.slice(0, 6)}...{SOURCE_DRIFT_LEDGER_ADDRESS.slice(-4)}</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          {/* Wallet Pill - Shortened address or Connect */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="flex min-h-[44px] items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span className="font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Management Modal */}
      {showWalletModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="wallet-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm p-2 sm:p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] flex flex-col justify-start sm:justify-center items-center text-left"
        >
          <div
            ref={walletDialogRef}
            className="relative w-full max-w-md my-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6 text-slate-100 shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] max-h-[calc(100dvh-2rem)] focus:outline-none"
          >
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 id="wallet-modal-title" className="text-lg font-bold text-white break-words">
                  Wallet Connection
                </h3>
                <p className="mt-1 text-xs text-amber-300 font-semibold break-words">{disclaimer}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                aria-label="Close wallet connection dialog"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 overscroll-contain">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                <span className="text-xs text-slate-300 font-semibold block mb-1">Active Address</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs break-all text-cyan-300">{address || "None"}</span>
                  {address && (
                    <button
                      type="button"
                      onClick={copyAddress}
                      aria-label="Copy active address"
                      className="ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      {copiedAddr ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={resetWallet}
                  className="w-full flex min-h-[44px] items-center justify-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Generate Fresh Key</span>
                </button>
              </div>

              {/* Import Key Form */}
              <form onSubmit={handleImport} className="pt-3 border-t border-slate-800">
                <label htmlFor="import-private-key-input" className="text-xs text-slate-300 font-semibold block mb-1.5">
                  Import Existing Key
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    id="import-private-key-input"
                    type="password"
                    placeholder="0x..."
                    value={importKeyInput}
                    onChange={(e) => setImportKeyInput(e.target.value)}
                    className="flex-1 min-h-[44px] rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] rounded-xl bg-cyan-500 px-5 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                  >
                    Import
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Test Funds Guide Modal */}
      <FundingModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
      />

      {/* Guided Walkthrough Modal */}
      <WalkthroughModal
        isOpen={showWalkthroughModal}
        onClose={() => setShowWalkthroughModal(false)}
      />
    </header>
  );
};
