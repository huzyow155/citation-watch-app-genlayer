import React, { useState, useEffect } from "react";
import {
  Search,
  PlusCircle,
  FileText,
  Clock,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  SEEDED_CITATIONS,
  SEEDED_CLAIMS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/chain";
import type { CitationRecord, AuditRecord, ClaimBadgeRecord } from "../lib/outcome";
import {
  getCitation,
  getLatestAudit,
  getAudit,
  getClaim,
  registerCitation,
  auditCitationRevision,
  auditCitationLive,
  publishClaim,
  refreshClaim,
  setLedger,
  getClaimsLedgerAddress,
  getClaimsOwner,
} from "../services/contractService";
import { parseAndValidateWikipediaUrl } from "../lib/urlParser";
import { TxPipelineModal } from "../components/TxPipelineModal";
import type { TxProgress } from "../lib/txLifecycle";

type ActiveTab = "explore" | "detail" | "register" | "audit" | "claims" | "admin" | "evidence";

export const Workbench: React.FC = () => {
  const { account, address } = useWallet();
  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");

  // Exploration & Detail state
  const [selectedCitationId, setSelectedCitationId] = useState<string>(SEEDED_CITATIONS[0].id);
  const [searchCitationId, setSearchCitationId] = useState<string>("");
  const [citationData, setCitationData] = useState<CitationRecord | null>(null);
  const [latestAuditData, setLatestAuditData] = useState<AuditRecord | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Registration state
  const [regUrl, setRegUrl] = useState("https://en.wikipedia.org/w/index.php?title=Alan_Turing&oldid=1258759526");
  const [regTitle, setRegTitle] = useState("Alan Turing");
  const [regOldid, setRegOldid] = useState<number>(1258759526);
  const [regElements, setRegElements] = useState<string[]>([
    "Alan Mathison Turing was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist.",
  ]);
  const [newElementText, setNewElementText] = useState("");

  // Audit state
  const [auditTargetOldid, setAuditTargetOldid] = useState<number>(1258759530);

  // Claims Board state
  const [claimCitationId, setClaimCitationId] = useState(SEEDED_CITATIONS[0].id);
  const [claimStatement, setClaimStatement] = useState("Alan Turing laid the foundational concepts of modern theoretical computation.");
  const [selectedClaimId, setSelectedClaimId] = useState(SEEDED_CLAIMS[0].id);
  const [claimData, setClaimData] = useState<ClaimBadgeRecord | null>(null);

  // Admin state
  const [adminLedgerAddress, setAdminLedgerAddress] = useState<string>(SOURCE_DRIFT_LEDGER_ADDRESS);
  const [currentLinkedLedger, setCurrentLinkedLedger] = useState<string>("");
  const [claimsOwner, setClaimsOwner] = useState<string>("");

  // Consensus pipeline modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [txProgress, setTxProgress] = useState<TxProgress | null>(null);

  // Fetch Citation Details
  const loadCitationDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const cit = await getCitation(id);
      setCitationData(cit);
      if (cit) {
        const aud = await getLatestAudit(id);
        setLatestAuditData(aud);
      } else {
        setLatestAuditData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedCitationId) {
      loadCitationDetails(selectedCitationId);
    }
  }, [selectedCitationId]);

  // Load Admin Data
  useEffect(() => {
    getClaimsLedgerAddress().then(setCurrentLinkedLedger);
    getClaimsOwner().then(setClaimsOwner);
  }, []);

  // Handlers for Write Transactions
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Register Citation Baseline");
    try {
      await registerCitation(
        account,
        regUrl,
        regTitle,
        Number(regOldid),
        regElements,
        setTxProgress
      );
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAuditRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Audit Citation Revision");
    try {
      await auditCitationRevision(account, selectedCitationId, Number(auditTargetOldid), setTxProgress);
      loadCitationDetails(selectedCitationId);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAuditLive = async () => {
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Audit Citation LIVE Target");
    try {
      await auditCitationLive(account, selectedCitationId, setTxProgress);
      loadCitationDetails(selectedCitationId);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePublishClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Publish Claim on ClaimsBoard");
    try {
      await publishClaim(account, claimCitationId, claimStatement, setTxProgress);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRefreshClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Refresh Claim Badge");
    try {
      await refreshClaim(account, selectedClaimId, setTxProgress);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSetLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Admin: Update Linked Ledger");
    try {
      await setLedger(account, adminLedgerAddress, setTxProgress);
      getClaimsLedgerAddress().then(setCurrentLinkedLedger);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Subnav Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex space-x-1 overflow-x-auto py-2">
          {(
            [
              { id: "explore", label: "Explore Citations" },
              { id: "detail", label: "Citation Detail" },
              { id: "register", label: "Register Citation" },
              { id: "audit", label: "Run Audit" },
              { id: "claims", label: "Claims Board" },
              { id: "admin", label: "Admin & Ledger" },
              { id: "evidence", label: "Honest Evidence" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
        {/* TAB 1: EXPLORE */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Active On-Chain Citations</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Seeded from verified consensus transactions on GenLayer Studionet (Preview).
                </p>
              </div>

              {/* Direct ID Search */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Paste 64-char Citation ID..."
                  value={searchCitationId}
                  onChange={(e) => setSearchCitationId(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchCitationId.trim()) {
                      setSelectedCitationId(searchCitationId.trim());
                      setActiveTab("detail");
                    }
                  }}
                  className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Inspect
                </button>
              </div>
            </div>

            {/* Citations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEEDED_CITATIONS.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.class === "SAME"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : c.class === "COSMETIC"
                            ? "bg-cyan-500/10 text-cyan-400"
                            : c.class === "MATERIAL"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{c.name}</h3>
                    <p className="text-xs text-slate-400 mb-2">{c.target}</p>
                    <p className="font-mono text-[10px] text-slate-500 break-all">{c.id}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCitationId(c.id);
                        setActiveTab("detail");
                      }}
                      className="text-xs font-semibold text-cyan-400 hover:underline"
                    >
                      View Details &amp; Diff &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CITATION DETAIL */}
        {activeTab === "detail" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Citation Audit Detail</h2>
                <p className="text-xs text-slate-400 font-mono mt-1 break-all">ID: {selectedCitationId}</p>
              </div>
              <button
                type="button"
                onClick={() => loadCitationDetails(selectedCitationId)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading on-chain ledger state...</div>
            ) : citationData ? (
              <div className="space-y-6">
                {/* Meta Card */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                    Registered Baseline Metadata
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Article Title</span>
                      <span className="font-semibold text-white">{citationData.article_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Baseline Oldid</span>
                      <span className="font-mono text-slate-300">{citationData.baseline_oldid}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Audits Recorded</span>
                      <span className="font-mono text-slate-300">{citationData.audit_count}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Latest Status</span>
                      <span className="font-bold text-emerald-400">{citationData.latest_drift_class}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-500 block mb-1">Registrant Address (identity not verified):</span>
                    <span className="font-mono text-[11px] text-slate-300">{citationData.registrant}</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500 block mb-1">Baseline SHA-256 Fingerprint:</span>
                    <span className="font-mono text-[11px] text-slate-400 break-all">{citationData.base_fingerprint}</span>
                  </div>
                </div>

                {/* Claim Elements */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                    Registered Claim Elements
                  </h3>
                  <div className="space-y-2">
                    {citationData.claim_elements.map((elem, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-950 p-3 text-xs text-slate-200 border border-slate-800 font-mono">
                        <span className="text-slate-500 mr-2">[{idx + 1}]</span>
                        {elem}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Latest Audit Result Card */}
                {latestAuditData && (
                  <div className="rounded-xl border border-cyan-800/60 bg-slate-900/80 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                        Latest Audit Verdict: {latestAuditData.drift_class}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">Target: {latestAuditData.target_kind} ({latestAuditData.target_spec})</span>
                    </div>

                    <div className="space-y-3">
                      {latestAuditData.elements?.map((el, i) => (
                        <div key={i} className="rounded-lg bg-slate-950 p-3 text-xs border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Element ID: {el.element_id}</span>
                            <span className="font-bold text-cyan-400">Status: {el.element_status}</span>
                          </div>
                          <p className="text-slate-300 font-mono">{el.claim_text}</p>
                          {el.cited_quote && (
                            <p className="text-emerald-300 text-[11px] bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                              <span className="text-slate-400 block text-[10px]">Verbatim Cited Quote Found in Target:</span>
                              &ldquo;{el.cited_quote}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                Citation record not found on-chain. Please check the Citation ID or select one from the Explore tab.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER */}
        {activeTab === "register" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Register New Citation Baseline</h2>
              <p className="text-xs text-slate-400 mt-1">
                Submits a Wikipedia article revision and extracted claim sentences for validator consensus.
              </p>
            </div>

            <form onSubmit={handleRegister} className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Wikipedia URL (with oldid)</label>
                <input
                  type="text"
                  value={regUrl}
                  onChange={(e) => {
                    setRegUrl(e.target.value);
                    const parsed = parseAndValidateWikipediaUrl(e.target.value);
                    if (parsed.isValid && parsed.articleTitle) {
                      setRegTitle(parsed.articleTitle);
                      if (parsed.oldid) setRegOldid(parsed.oldid);
                    }
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Article Title</label>
                  <input
                    type="text"
                    value={regTitle}
                    onChange={(e) => setRegTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Baseline Oldid</label>
                  <input
                    type="number"
                    value={regOldid}
                    onChange={(e) => setRegOldid(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Claim Elements (Max 5 sentences)</label>
                <div className="space-y-2 mb-2">
                  {regElements.map((el, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-950 p-2.5 text-xs border border-slate-800">
                      <span className="text-slate-200">{el}</span>
                      <button
                        type="button"
                        onClick={() => setRegElements(regElements.filter((_, idx) => idx !== i))}
                        className="text-rose-400 hover:text-rose-300 text-xs ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {regElements.length < 5 && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add verbatim claim sentence from baseline article..."
                      value={newElementText}
                      onChange={(e) => setNewElementText(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newElementText.trim()) {
                          setRegElements([...regElements, newElementText.trim()]);
                          setNewElementText("");
                        }
                      }}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                    >
                      Add Sentence
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                >
                  Submit Registration to Consensus
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: AUDIT */}
        {activeTab === "audit" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Execute Citation Drift Audit</h2>
              <p className="text-xs text-slate-400 mt-1">
                Audit a registered baseline against a later revision ID or against the current LIVE Wikipedia page.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Target Citation ID</label>
                <input
                  type="text"
                  value={selectedCitationId}
                  onChange={(e) => setSelectedCitationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Option A: Historical Revision Audit */}
              <form onSubmit={handleAuditRevision} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Option A: Historical Revision Audit
                </h4>
                <p className="text-xs text-slate-400">
                  Evaluates drift between the baseline oldid and a subsequent oldid. Target fingerprint is included in validator consensus.
                </p>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Target Oldid</label>
                  <input
                    type="number"
                    value={auditTargetOldid}
                    onChange={(e) => setAuditTargetOldid(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
                >
                  Audit Specific Revision
                </button>
              </form>

              {/* Option B: LIVE Target Audit */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Option B: Current LIVE Wikipedia Audit
                  </h4>
                  <span className="text-[10px] text-amber-400 border border-amber-800/80 rounded px-1.5 py-0.5">
                    300s Cooldown Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Fetches the live article at consensus time. Raw fingerprint is excluded from consensus equality to prevent millisecond disagreement.
                </p>
                <button
                  type="button"
                  onClick={handleAuditLive}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-500"
                >
                  Audit LIVE Article
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CLAIMS BOARD */}
        {activeTab === "claims" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">ClaimsBoard Integration</h2>
              <p className="text-xs text-slate-400 mt-1">
                Cross-contract proof of reuse: dApps publish assertions linked to citation IDs and query live drift badges.
              </p>
            </div>

            {/* Publish Form */}
            <form onSubmit={handlePublishClaim} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-cyan-400">Publish New Assertion</h3>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Referenced Citation ID</label>
                <input
                  type="text"
                  value={claimCitationId}
                  onChange={(e) => setClaimCitationId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Claim Statement</label>
                <textarea
                  rows={2}
                  value={claimStatement}
                  onChange={(e) => setClaimStatement(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                Publish Claim on ClaimsBoard
              </button>
            </form>

            {/* Refresh Claim Badge */}
            <form onSubmit={handleRefreshClaim} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-cyan-400">Refresh Claim Badge</h3>
              <p className="text-xs text-slate-400">
                Calls `refresh_claim` on ClaimsBoard to synchronize with the latest audit recorded in SourceDriftLedger.
              </p>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Claim ID</label>
                <input
                  type="text"
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
              >
                Refresh Badge State
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: ADMIN */}
        {activeTab === "admin" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">ClaimsBoard Administration</h2>
              <p className="text-xs text-slate-400 mt-1">
                Inspect ownership and update the linked SourceDriftLedger contract address via `set_ledger`.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block">ClaimsBoard Contract Owner:</span>
                  <span className="font-mono text-slate-200 break-all">{claimsOwner || "Loading..."}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Currently Linked Ledger Address:</span>
                  <span className="font-mono text-cyan-300 break-all">{currentLinkedLedger || "Loading..."}</span>
                </div>
              </div>

              <form onSubmit={handleSetLedger} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <label className="text-xs text-slate-300 block">Update Linked Ledger (`set_ledger`)</label>
                <input
                  type="text"
                  value={adminLedgerAddress}
                  onChange={(e) => setAdminLedgerAddress(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                >
                  Execute set_ledger
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: EVIDENCE */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Honest Evidence &amp; Verification Matrix</h2>
              <p className="text-xs text-slate-400 mt-1">
                Accurate, verifiable status of all drift classes and negative revert proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-800/60 bg-slate-900/60 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                  Verified On-Chain (Accepted by Validators)
                </span>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li><strong>SAME:</strong> Alan Turing rev 1258759530 (4/5 votes agreed).</li>
                  <li><strong>COSMETIC:</strong> Computing Hardware rev 1258760000 (3/5 votes agreed).</li>
                  <li><strong>MATERIAL:</strong> Python Language rev 1258761000 (3/5 votes agreed).</li>
                  <li><strong>Transition:</strong> SAME &rarr; COSMETIC sequential revisions.</li>
                  <li><strong>ClaimsBoard Reuse:</strong> Alan Turing assertion badge confirmed.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-rose-800/60 bg-slate-900/60 p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-2">
                  Unit-Tested Only &amp; On-Chain Reverts
                </span>
                <ul className="text-xs space-y-2 text-slate-300">
                  <li><strong>REMOVED:</strong> Unit-tested only. Real deletion calibration empirical margin: 0.1630. Attempted on-chain reverts: 4 transactions reverted with "invalid model output".</li>
                  <li><strong>Negative Tests:</strong> 11 negative on-chain tests covering URL schemes, domains, oldid order, invalid model outputs, and unauthorized access.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Lifecycle Modal */}
      <TxPipelineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        progress={txProgress}
        title={modalTitle}
      />
    </div>
  );
};
