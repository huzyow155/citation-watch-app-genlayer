export interface ElementAudit {
  id: string;
  status: "SAME" | "REPHRASED" | "CHANGED" | "ABSENT";
  decided_by?: "DETERMINISTIC" | "MODEL" | string;
  passage_id?: string | null;
  cited_quote: string;
}

export interface AuditRecord {
  n: number;
  auditor: string;
  audited_at: string;
  audited_at_ts: number;
  target_url: string;
  target_kind: "REVISION" | "LIVE";
  target_oldid?: string | null;
  class: "UNCHANGED" | "COSMETIC" | "MATERIAL" | "REMOVED" | string;
  elements: ElementAudit[];
  passages?: any[];
  target_text_sha256?: string;
  coverage?: string;
  fetch_method?: string;
  fingerprint_in_consensus?: boolean;
}

export interface CitationRecord {
  schema_version: string;
  citation_id: string;
  label: string;
  registrant: string;
  registered_at: string;
  registered_at_ts: number;
  baseline_url: string;
  baseline_host: string;
  baseline_title: string;
  baseline_oldid: string;
  elements: Array<{ id: string; quote: string; quote_sha256: string }>;
  baseline_text_sha256: string;
  baseline_chars_total: number;
  fetch_method: string;
  latest_audit_index: number;
  status: "UNAUDITED" | "HEALTHY" | "DRIFTED" | "REMOVED" | string;
  audits_total: number;
  audits: AuditRecord[];
}

export interface ClaimBadgeRecord {
  id: string;
  headline: string;
  citation_id: string;
  publisher: string;
  published_at: string;
  published_at_ts: number;
  badge: "UNAUDITED" | "VERIFIED" | "REPHRASED" | "DRIFTED" | "REMOVED" | string;
  badge_history: string[];
}

export interface VerdictInfo {
  verdictClass: string;
  statusLabel: string;
  badgeLabel: string;
  isObservedOnChain: boolean;
  honestyNote: string;
  explanation: string;
}

/**
 * Maps contract audit classes to user-facing verdict descriptions,
 * explicitly distinguishing on-chain verified behaviors from unit-tested-only behaviors.
 */
export function mapVerdict(rawClass: string | undefined | null): VerdictInfo {
  const c = String(rawClass || "").trim().toUpperCase();

  switch (c) {
    case "UNCHANGED":
    case "SAME":
      return {
        verdictClass: "UNCHANGED",
        statusLabel: "HEALTHY",
        badgeLabel: "VERIFIED",
        isObservedOnChain: true,
        honestyNote: "Verified on-chain (accepted by validators)",
        explanation: "Deterministic match: quotes are verbatim identical in the target text.",
      };
    case "COSMETIC":
      return {
        verdictClass: "COSMETIC",
        statusLabel: "HEALTHY",
        badgeLabel: "REPHRASED",
        isObservedOnChain: true,
        honestyNote: "Verified on-chain (accepted by validators)",
        explanation: "Rephrased match: phrasing was adjusted, but meaning is intact without substantive drift.",
      };
    case "MATERIAL":
      return {
        verdictClass: "MATERIAL",
        statusLabel: "DRIFTED",
        badgeLabel: "DRIFTED",
        isObservedOnChain: true,
        honestyNote: "Verified on-chain (accepted by validators)",
        explanation: "Material drift: statements were substantively changed or contradicted.",
      };
    case "REMOVED":
      return {
        verdictClass: "REMOVED",
        statusLabel: "REMOVED",
        badgeLabel: "REMOVED",
        isObservedOnChain: false,
        honestyNote: "unit-tested only, not yet observed on-chain",
        explanation: "Quotes are absent from the target text (similarity < 0.45). Validated via empirical diff calibration with 0.1630 margin.",
      };
    default:
      return {
        verdictClass: c || "UNAUDITED",
        statusLabel: "UNAUDITED",
        badgeLabel: "UNAUDITED",
        isObservedOnChain: false,
        honestyNote: "Pending audit",
        explanation: "This citation has not yet been audited against a target revision or LIVE page.",
      };
  }
}
