import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  AlertCircle,
  RefreshCw,
  FileCheck2,
  CheckCircle2,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import {
  SOURCE_DRIFT_LEDGER_ADDRESS,
  CLAIMS_BOARD_ADDRESS,
  SEEDED_CITATIONS,
  WALLET_DISCLAIMER,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../config/chain";
import type { CitationRecord, AuditRecord, ClaimBadgeRecord } from "../lib/outcome";
import { mapVerdict } from "../lib/outcome";
import {
  getCitation,
  listCitationIds,
  getClaim,
  listClaimIds,
  registerCitationFlow,
  auditCitationFlow,
  publishClaimFlow,
  refreshClaimFlow,
  setLedgerFlow,
  getClaimsLedgerAddress,
  getClaimsOwner,
  getLocalUserCitationIds,
  getLocalUserClaimIds,
} from "../services/contractService";
import { parseAndValidateWikipediaUrl } from "../lib/urlParser";
import { TxPipelineModal } from "../components/TxPipelineModal";
import type { TxProgress } from "../lib/txLifecycle";

type ActiveTab = "explore" | "detail" | "register" | "audit" | "claims" | "admin" | "evidence";

export const Workbench: React.FC = () => {
  const { account, address } = useWallet();
  const [activeTab, setActiveTab] = useState<ActiveTab>("explore");

  // Exploration & Detail state
  const [selectedCitationId, setSelectedCitationId] = useState<string>("");
  const [searchCitationId, setSearchCitationId] = useState<string>("");
  const [citationData, setCitationData] = useState<CitationRecord | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailRpcError, setDetailRpcError] = useState<string | null>(null);

  // Explore live on-chain state
  const [userCitations, setUserCitations] = useState<CitationRecord[]>([]);
  const [ledgerCitations, setLedgerCitations] = useState<CitationRecord[]>([]);
  const [sampleCitations, setSampleCitations] = useState<CitationRecord[]>([]);
  const [isExploreLoading, setIsExploreLoading] = useState(false);
  const [exploreRpcError, setExploreRpcError] = useState<string | null>(null);

  // Registration form state
  const [regLabel, setRegLabel] = useState("Ada Lovelace Mathematical Eminence");
  const [regUrl, setRegUrl] = useState("https://en.wikipedia.org/w/index.php?title=Ada_Lovelace&oldid=1374881938");
  const [regQuotes, setRegQuotes] = useState<string[]>([
    'In a letter to Lady Byron, De Morgan suggested that Ada\'s skill in mathematics might lead her to become "an original mathematical investigator, perhaps of first-rate eminence".',
  ]);
  const [newQuoteText, setNewQuoteText] = useState("");

  // Audit form state
  const [auditTargetUrl, setAuditTargetUrl] = useState("https://en.wikipedia.org/w/index.php?title=Ada_Lovelace&oldid=1379797630");

  // Claims Board form state
  const [claimCitationId, setClaimCitationId] = useState("");
  const [claimHeadline, setClaimHeadline] = useState("");
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [liveClaims, setLiveClaims] = useState<ClaimBadgeRecord[]>([]);

  // Admin state
  const [adminLedgerAddress, setAdminLedgerAddress] = useState<string>(SOURCE_DRIFT_LEDGER_ADDRESS);
  const [currentLinkedLedger, setCurrentLinkedLedger] = useState<string>("");
  const [claimsOwner, setClaimsOwner] = useState<string>("");

  // Consensus pipeline modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [txProgress, setTxProgress] = useState<TxProgress | null>(null);

  // In-memory cache to prevent redundant RPC calls
  const citationCacheRef = useRef<Map<string, CitationRecord>>(new Map());
  const claimCacheRef = useRef<Map<string, ClaimBadgeRecord>>(new Map());

  const fetchCachedCitation = async (cid: string): Promise<CitationRecord | null> => {
    if (citationCacheRef.current.has(cid)) {
      return citationCacheRef.current.get(cid)!;
    }
    const rec = await getCitation(cid);
    if (rec) citationCacheRef.current.set(cid, rec);
    return rec;
  };

  const fetchCachedClaim = async (claimId: string): Promise<ClaimBadgeRecord | null> => {
    if (claimCacheRef.current.has(claimId)) {
      return claimCacheRef.current.get(claimId)!;
    }
    const c = await getClaim(claimId);
    if (c) claimCacheRef.current.set(claimId, c);
    return c;
  };

  // Hydrate Explore tab from chain
  const loadExploreData = async () => {
    setIsExploreLoading(true);
    setExploreRpcError(null);
    try {
      // 1. Hydrate User Citations from localStorage
      const userIds = getLocalUserCitationIds();
      const userRecords: CitationRecord[] = [];
      for (const uid of userIds.slice(0, 3)) {
        try {
          const rec = await fetchCachedCitation(uid);
          if (rec) userRecords.push(rec);
        } catch {
          // ignore individual missing
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setUserCitations(userRecords);

      // 2. Hydrate Recent Citations from list_citation_ids
      const recentIds = await listCitationIds(0, 3);
      const ledgerRecords: CitationRecord[] = [];
      for (const rid of recentIds) {
        try {
          const rec = await fetchCachedCitation(rid);
          if (rec) ledgerRecords.push(rec);
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setLedgerCitations(ledgerRecords);

      // 3. Hydrate Verified Sample Citations (IDs from evidence run)
      const sampleIds = [
        "bbee352df865",
        "4f3305759701",
        "59a2e370301f",
      ];
      const samples: CitationRecord[] = [];
      for (const sid of sampleIds) {
        try {
          const rec = await fetchCachedCitation(sid);
          if (rec) samples.push(rec);
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setSampleCitations(samples);

      // 4. Hydrate Claims
      const claimIds = await listClaimIds(0, 3);
      const claimsList: ClaimBadgeRecord[] = [];
      for (const cid of claimIds) {
        try {
          const c = await fetchCachedClaim(cid);
          if (c) claimsList.push(c);
        } catch {
          // ignore
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      setLiveClaims(claimsList);
    } catch (err: any) {
      console.error("Explore RPC error:", err);
      setExploreRpcError(err?.message || "Failed to query GenLayer Studionet RPC. Check connection and retry.");
    } finally {
      setIsExploreLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "explore") {
      loadExploreData();
    }
  }, [activeTab]);

  // Fetch Citation Details
  const loadCitationDetails = async (id: string) => {
    if (!id) {
      setCitationData(null);
      return;
    }
    setIsLoadingDetails(true);
    setDetailRpcError(null);
    setCitationData(null); // Clear previous citation to prevent rendering stale data
    try {
      if (citationCacheRef.current.has(id)) {
        setCitationData(citationCacheRef.current.get(id)!);
      }
      let cit = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          cit = await getCitation(id);
          if (cit) {
            citationCacheRef.current.set(id, cit);
            break;
          }
        } catch (e) {
          if (attempt === 2) throw e;
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
      setCitationData(cit);
    } catch (err: any) {
      console.error(err);
      setDetailRpcError(err?.message || "RPC read failure while fetching citation.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedCitationId && activeTab === "detail") {
      loadCitationDetails(selectedCitationId);
    }
  }, [selectedCitationId, activeTab]);

  // Load Admin Data
  useEffect(() => {
    if (activeTab === "admin") {
      getClaimsLedgerAddress().then(setCurrentLinkedLedger).catch(() => {});
      getClaimsOwner().then(setClaimsOwner).catch(() => {});
    }
  }, [activeTab]);

  // Handlers for Write Transactions
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Register Citation Baseline");
    try {
      const { citationId } = await registerCitationFlow(
        account,
        regLabel,
        regUrl,
        regQuotes,
        setTxProgress
      );
      setSelectedCitationId(citationId);
      setClaimCitationId(citationId);
      setActiveTab("detail");
    } catch (err: any) {
      console.error(err);
      setTxProgress((prev) => ({
        ...prev,
        stage: "reverted",
        decodedRevert: err?.message || "Contract execution failed",
      }));
    }
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Audit Citation Target");
    try {
      await auditCitationFlow(account, selectedCitationId, auditTargetUrl, setTxProgress);
      loadCitationDetails(selectedCitationId);
    } catch (err: any) {
      console.error(err);
      setTxProgress((prev) => ({
        ...prev,
        stage: "reverted",
        decodedRevert: err?.message || "Contract execution failed",
      }));
    }
  };

  const handlePublishClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Publish Claim on ClaimsBoard");
    try {
      const { claimId } = await publishClaimFlow(account, claimCitationId, claimHeadline, setTxProgress);
      setSelectedClaimId(claimId);
    } catch (err: any) {
      console.error(err);
      setTxProgress((prev) => ({
        ...prev,
        stage: "reverted",
        decodedRevert: err?.message || "Contract execution failed",
      }));
    }
  };

  const handleRefreshClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Refresh Claim Badge");
    try {
      await refreshClaimFlow(account, selectedClaimId, setTxProgress);
    } catch (err: any) {
      console.error(err);
      setTxProgress((prev) => ({
        ...prev,
        stage: "reverted",
        decodedRevert: err?.message || "Contract execution failed",
      }));
    }
  };

  const handleSetLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Wallet not connected");

    setIsModalOpen(true);
    setModalTitle("Admin: Update Linked Ledger");
    try {
      await setLedgerFlow(account, adminLedgerAddress, setTxProgress);
      getClaimsLedgerAddress().then(setCurrentLinkedLedger).catch(() => {});
    } catch (err: any) {
      console.error(err);
      setTxProgress({
        stage: "reverted",
        decodedRevert: err?.message || "Contract execution failed",
      });
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans text-base">
      {/* Subnav Tabs */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex space-x-1 overflow-x-auto py-2.5">
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
              className={`rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
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
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Explore On-Chain Citations</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Live state hydrated directly from SourceDriftLedger and ClaimsBoard on GenLayer Studionet (Preview).
                </p>
              </div>

              {/* Direct ID Search & Refresh */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Paste 12-char Citation ID..."
                  value={searchCitationId}
                  onChange={(e) => setSearchCitationId(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none w-56 sm:w-64"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchCitationId.trim()) {
                      setSelectedCitationId(searchCitationId.trim());
                      setActiveTab("detail");
                    }
                  }}
                  className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={loadExploreData}
                  disabled={isExploreLoading}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 hover:text-white"
                  title="Reload from chain"
                >
                  <RefreshCw className={`h-4 w-4 ${isExploreLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* RPC Error State with Retry Button */}
            {exploreRpcError && (
              <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-5 text-rose-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-300">RPC Communication Error</p>
                      <p className="text-sm text-rose-200 mt-1">{exploreRpcError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadExploreData}
                    className="rounded-lg bg-rose-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 ml-4 flex-shrink-0"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: User Citations in this browser session */}
            {userCitations.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-white">Your citations (Local Session)</h3>
                  <span className="rounded-full bg-cyan-900/60 text-cyan-300 text-xs px-2 py-0.5 font-mono">
                    {userCitations.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userCitations.map((c) => {
                    const verdict = mapVerdict(c.audits?.[c.latest_audit_index]?.class || c.status);
                    return (
                      <div
                        key={c.citation_id}
                        className="rounded-xl border border-cyan-700/60 bg-slate-900/80 p-5 flex flex-col justify-between hover:border-cyan-500 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              {c.status}
                            </span>
                            <span className="text-xs text-slate-400">{c.audits_total} audits</span>
                          </div>
                          <h4 className="text-base font-bold text-white mb-1">{c.label}</h4>
                          <p className="text-xs text-slate-400 mb-2">{c.baseline_title} (rev {c.baseline_oldid})</p>
                          <p className="font-mono text-xs text-cyan-400 break-all">{c.citation_id}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCitationId(c.citation_id);
                              setActiveTab("detail");
                            }}
                            className="text-xs font-semibold text-cyan-400 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Inspect &rarr;</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Verified Sample Citations (IDs from our evidence run) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">Verified sample citations (IDs from our evidence run)</h3>
                <span className="text-xs text-slate-400">Live hydrated</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sampleCitations.map((c) => {
                  const latestAudit = c.audits?.[c.latest_audit_index];
                  const verdict = mapVerdict(latestAudit?.class || c.status);
                  return (
                    <div
                      key={c.citation_id}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded ${
                              verdict.verdictClass === "UNCHANGED" || verdict.verdictClass === "SAME"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : verdict.verdictClass === "COSMETIC"
                                ? "bg-cyan-500/10 text-cyan-400"
                                : verdict.verdictClass === "MATERIAL"
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-purple-500/10 text-purple-400"
                            }`}
                          >
                            {c.status}
                          </span>
                          <span className="text-xs text-slate-400">{c.audits_total} audits</span>
                        </div>
                        <h4 className="text-base font-bold text-white mb-1">{c.label}</h4>
                        <p className="text-xs text-slate-400 mb-2">{c.baseline_title} (rev {c.baseline_oldid})</p>
                        <p className="font-mono text-xs text-slate-400 break-all">{c.citation_id}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">{verdict.honestyNote}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCitationId(c.citation_id);
                            setActiveTab("detail");
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          Inspect &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Recent Citations on Ledger */}
            {ledgerCitations.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Recent Citations on Ledger</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ledgerCitations.map((c) => (
                    <div
                      key={c.citation_id}
                      className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-cyan-300">{c.label}</span>
                          <span className="text-slate-400">{c.status}</span>
                        </div>
                        <p className="text-xs text-slate-400">{c.baseline_title}</p>
                        <p className="font-mono text-xs text-slate-500 mt-1">{c.citation_id}</p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCitationId(c.citation_id);
                            setActiveTab("detail");
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:underline"
                        >
                          View &rarr;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CITATION DETAIL */}
        {activeTab === "detail" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Citation Audit Detail</h2>
                <p className="text-sm text-slate-400 font-mono mt-1 break-all">ID: {selectedCitationId}</p>
              </div>
              <button
                type="button"
                onClick={() => loadCitationDetails(selectedCitationId)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {/* RPC Error for Details */}
            {detailRpcError && (
              <div className="rounded-xl border border-rose-800 bg-rose-950/60 p-4 text-rose-200 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-rose-300">RPC Error</p>
                  <p className="text-xs text-rose-200 mt-1">{detailRpcError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadCitationDetails(selectedCitationId)}
                  className="rounded-lg bg-rose-800 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 ml-4"
                >
                  Retry
                </button>
              </div>
            )}

            {isLoadingDetails ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading on-chain ledger state...</div>
            ) : citationData ? (
              <div className="space-y-6">
                {/* Meta Card */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-4">
                    Registered Baseline Metadata
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 block text-xs">Label</span>
                      <span className="font-semibold text-white">{citationData.label}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Article Title</span>
                      <span className="font-semibold text-white">{citationData.baseline_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Baseline Oldid</span>
                      <span className="font-mono text-slate-300">{citationData.baseline_oldid}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs">Status</span>
                      <span className="font-bold text-emerald-400">{citationData.status}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
                    <span className="text-slate-500 block mb-1">Registrant Address (identity not verified):</span>
                    <span className="font-mono text-slate-300">{citationData.registrant}</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500 block mb-1">Baseline SHA-256 Fingerprint:</span>
                    <span className="font-mono text-slate-400 break-all">{citationData.baseline_text_sha256}</span>
                  </div>
                  <div className="mt-2 text-xs">
                    <span className="text-slate-500 block mb-1">Baseline URL:</span>
                    <a
                      href={citationData.baseline_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline break-all font-mono"
                    >
                      {citationData.baseline_url}
                    </a>
                  </div>
                </div>

                {/* Claim Elements */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                    Registered Claim Quotes
                  </h3>
                  <div className="space-y-3">
                    {citationData.elements?.map((elem, idx) => (
                      <div key={idx} className="rounded-xl bg-slate-950 p-4 text-sm text-slate-200 border border-slate-800">
                        <span className="text-slate-500 mr-2 text-xs font-mono">[{elem.id}]</span>
                        <span className="italic font-serif">&ldquo;{elem.quote}&rdquo;</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit History */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                    Recorded Audits ({citationData.audits?.length || 0})
                  </h3>

                  {citationData.audits && citationData.audits.length > 0 ? (
                    <div className="space-y-4">
                      {citationData.audits.map((a, i) => {
                        const verdict = mapVerdict(a.class);
                        return (
                          <div key={i} className="rounded-xl bg-slate-950 p-5 text-sm border border-slate-800 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-base text-white">Audit #{a.n}</span>
                                <span className="rounded px-2.5 py-0.5 text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                                  {a.class}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-mono">
                                {a.target_kind} {a.target_oldid ? `(oldid ${a.target_oldid})` : "(LIVE)"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400">{verdict.explanation}</p>

                            {/* Elements in Audit */}
                            {a.elements && a.elements.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                                {a.elements.map((el, elIdx) => (
                                  <div key={elIdx} className="rounded-lg bg-slate-900 p-3 text-xs space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-400 font-mono">Element {el.id}</span>
                                      <span className="font-semibold text-cyan-300">Status: {el.status}</span>
                                    </div>
                                    {el.cited_quote && (
                                      <p className="text-emerald-300 text-xs italic bg-emerald-950/20 p-2 rounded border border-emerald-900/40">
                                        &ldquo;{el.cited_quote}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No audits recorded yet for this citation.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
                Citation record not found on-chain. Please verify the 12-character ID.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REGISTER */}
        {activeTab === "register" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Register New Citation Baseline</h2>
              <p className="text-sm text-slate-400 mt-1">
                Submits a Wikipedia article revision permalink and extracted verbatim claim quotes for validator consensus.
              </p>
            </div>

            <form onSubmit={handleRegister} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Citation Label / Title</label>
                <input
                  type="text"
                  value={regLabel}
                  onChange={(e) => setRegLabel(e.target.value)}
                  placeholder="e.g. Ada Lovelace Mathematical Eminence"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">Baseline Wikipedia Revision Permalink</label>
                <input
                  type="text"
                  value={regUrl}
                  onChange={(e) => setRegUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/w/index.php?title=...&oldid=..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Must contain both title and oldid query parameters.</p>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">Verbatim Claim Quotes (1 to 4 sentences)</label>
                <div className="space-y-2 mb-3">
                  {regQuotes.map((q, i) => (
                    <div key={i} className="flex items-start justify-between rounded-xl bg-slate-950 p-3 text-xs border border-slate-800">
                      <span className="text-slate-200 font-serif leading-relaxed italic">&ldquo;{q}&rdquo;</span>
                      <button
                        type="button"
                        onClick={() => setRegQuotes(regQuotes.filter((_, idx) => idx !== i))}
                        className="text-rose-400 hover:text-rose-300 text-xs ml-3 flex-shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                {regQuotes.length < 4 && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add verbatim sentence from baseline article..."
                      value={newQuoteText}
                      onChange={(e) => setNewQuoteText(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newQuoteText.trim()) {
                          setRegQuotes([...regQuotes, newQuoteText.trim()]);
                          setNewQuoteText("");
                        }
                      }}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Add Quote
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-amber-300 font-medium">
                  {WALLET_DISCLAIMER}
                </p>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/30"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: AUDIT */}
        {activeTab === "audit" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Execute Citation Drift Audit</h2>
              <p className="text-sm text-slate-400 mt-1">
                Audit a registered baseline against a later revision permalink or the current LIVE Wikipedia page.
              </p>
            </div>

            <form onSubmit={handleAudit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div>
                <label className="text-sm text-slate-300 block mb-1">Target Citation ID</label>
                <input
                  type="text"
                  value={selectedCitationId}
                  onChange={(e) => setSelectedCitationId(e.target.value)}
                  placeholder="12-char Citation ID (e.g. bbee352df865)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-1">Target URL</label>
                <input
                  type="text"
                  value={auditTargetUrl}
                  onChange={(e) => setAuditTargetUrl(e.target.value)}
                  placeholder="https://en.wikipedia.org/w/index.php?title=...&oldid=... or /wiki/Title"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Revision permalink or clean LIVE page path. Note: 300s cooldown applies to LIVE page audits.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-amber-300 font-medium">
                  {WALLET_DISCLAIMER}
                </p>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white hover:bg-cyan-500 shadow-lg shadow-cyan-600/30"
                >
                  Execute Audit Transaction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 5: CLAIMS BOARD */}
        {activeTab === "claims" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">ClaimsBoard Cross-Contract Integration</h2>
              <p className="text-sm text-slate-400 mt-1">
                Proves cross-contract reuse: external dApps publish assertions bound to citations and synchronize live drift badges.
              </p>
            </div>

            {/* Publish Form */}
            <form onSubmit={handlePublishClaim} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-semibold text-cyan-400">Publish New Assertion</h3>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Referenced Citation ID</label>
                <input
                  type="text"
                  value={claimCitationId}
                  onChange={(e) => setClaimCitationId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Claim Headline (10 to 140 chars)</label>
                <textarea
                  rows={2}
                  value={claimHeadline}
                  onChange={(e) => setClaimHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-amber-300 font-medium">{WALLET_DISCLAIMER}</p>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500"
                >
                  Publish Assertion
                </button>
              </div>
            </form>

            {/* Refresh Claim Badge */}
            <form onSubmit={handleRefreshClaim} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
              <h3 className="text-base font-semibold text-cyan-400">Refresh Claim Badge</h3>
              <p className="text-xs text-slate-400">
                Calls `refresh_claim` on ClaimsBoard to query SourceDriftLedger and update the badge status.
              </p>
              <div>
                <label className="text-xs text-slate-300 block mb-1">Claim ID</label>
                <input
                  type="text"
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-[11px] text-amber-300 font-medium">{WALLET_DISCLAIMER}</p>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500"
                >
                  Refresh Badge
                </button>
              </div>
            </form>

            {/* Live Claims on Board */}
            {liveClaims.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Live Claims on ClaimsBoard
                </h3>
                <div className="space-y-3">
                  {liveClaims.map((cl) => (
                    <div key={cl.id} className="rounded-xl bg-slate-900 p-4 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-cyan-400">Claim {cl.id}</span>
                        <span className="rounded px-2 py-0.5 font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {cl.badge}
                        </span>
                      </div>
                      <p className="text-white font-medium">{cl.headline}</p>
                      <p className="text-slate-400 font-mono">Bound to Citation: {cl.citation_id}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: ADMIN */}
        {activeTab === "admin" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">ClaimsBoard Administration</h2>
              <p className="text-sm text-slate-400 mt-1">
                Inspect contract ownership and configuration of the linked SourceDriftLedger contract address via `set_ledger`.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 block">ClaimsBoard Contract Owner:</span>
                  <span className="font-mono text-slate-200 break-all">{claimsOwner || "Loading..."}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Currently Configured Ledger Address:</span>
                  <span className="font-mono text-cyan-300 break-all">{currentLinkedLedger || "Loading..."}</span>
                </div>
              </div>

              <form onSubmit={handleSetLedger} className="mt-4 pt-4 border-t border-slate-800 space-y-4">
                <label className="text-xs text-slate-300 block">
                  Update Linked Ledger (`set_ledger`) — Owner Only
                </label>
                <input
                  type="text"
                  value={adminLedgerAddress}
                  onChange={(e) => setAdminLedgerAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-[11px] text-amber-300 font-medium">{WALLET_DISCLAIMER}</p>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-600 px-5 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                  >
                    Execute set_ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 7: EVIDENCE */}
        {activeTab === "evidence" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Honest Evidence &amp; Verification Matrix</h2>
              <p className="text-sm text-slate-400 mt-1">
                Accurate, verifiable status of all drift classes and negative revert proofs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-emerald-800/60 bg-slate-900/60 p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-3">
                  Verified On-Chain (Accepted by Validators)
                </span>
                <ul className="text-sm space-y-2.5 text-slate-300 leading-relaxed">
                  <li><strong>SAME / UNCHANGED:</strong> Alan Turing rev 1380390650 (4/5 votes agreed).</li>
                  <li><strong>COSMETIC:</strong> Computing Hardware rev 1258760000 (3/5 votes agreed).</li>
                  <li><strong>MATERIAL:</strong> Python Language rev 1258761000 (3/5 votes agreed).</li>
                  <li><strong>Transition:</strong> SAME &rarr; COSMETIC sequential revisions.</li>
                  <li><strong>ClaimsBoard Reuse:</strong> Alan Turing assertion badge confirmed.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-rose-800/60 bg-slate-900/60 p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-3">
                  Unit-Tested Only &amp; On-Chain Reverts
                </span>
                <ul className="text-sm space-y-2.5 text-slate-300 leading-relaxed">
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
