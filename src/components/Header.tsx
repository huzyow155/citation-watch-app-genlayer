import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Copy, Check, RefreshCw, Key, ExternalLink, ShieldCheck } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  NETWORK_STATUS,
  getExplorerAddressUrl,
} from "../config/chain";

export const Header: React.FC = () => {
  const { address, resetWallet, importKey, disclaimer } = useWallet();
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [importKeyInput, setImportKeyInput] = useState("");
  const location = useLocation();

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
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="h-9 w-9 overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900 p-1 transition-transform group-hover:scale-105">
              <img src="/logo.svg" alt="CitationWatch Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                CitationWatch
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-cyan-400">
                {NETWORK_STATUS}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === "/"
                  ? "bg-slate-800 text-cyan-400"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Overview
            </Link>
            <Link
              to="/app"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname.startsWith("/app")
                  ? "bg-slate-800 text-cyan-400"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              Workbench
            </Link>
          </nav>
        </div>

        {/* Right Section: Contracts & Wallet Pill */}
        <div className="flex items-center space-x-3">
          {/* Contracts Pill */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-400 border border-slate-800 rounded-lg px-2.5 py-1.5 bg-slate-900">
            <span className="text-slate-500">Ledger:</span>
            <a
              href={getExplorerAddressUrl(SOURCE_DRIFT_LEDGER_ADDRESS)}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline inline-flex items-center space-x-1"
            >
              <span>{SOURCE_DRIFT_LEDGER_ADDRESS.slice(0, 6)}...{SOURCE_DRIFT_LEDGER_ADDRESS.slice(-4)}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Wallet Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 transition-colors"
            >
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connecting..."}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Management Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Studionet Throwaway Key</h3>
                <p className="mt-1 text-xs text-amber-300 font-medium">{disclaimer}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-xs text-slate-400 block mb-1">Active Address</span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs break-all text-cyan-300">{address}</span>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedAddr ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mt-4 flex space-x-2">
              <button
                type="button"
                onClick={resetWallet}
                className="flex-1 flex items-center justify-center space-x-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Generate Fresh Key</span>
              </button>
            </div>

            {/* Import Key Form */}
            <form onSubmit={handleImport} className="mt-4 pt-4 border-t border-slate-800">
              <label className="text-xs text-slate-400 block mb-1">Import Existing Key</label>
              <div className="flex space-x-2">
                <input
                  type="password"
                  placeholder="0x..."
                  value={importKeyInput}
                  onChange={(e) => setImportKeyInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
