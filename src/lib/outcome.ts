export interface ElementAudit {
  element_id: string;
  claim_text: string;
  deterministic_status?: "EXACT" | "NORMALIZED" | "ABSENT" | "MODEL_REQUIRED";
  element_status: "VERBATIM" | "REPHRASED" | "CHANGED" | "ABSENT";
  cited_quote: string;
  similarity_score?: number;
  reason?: string;
}

export interface AuditRecord {
  audit_id: string;
  auditor: string;
  target_kind: "REVISION" | "LIVE";
  target_spec: string;
  target_fingerprint: string;
  drift_class: "SAME" | "COSMETIC" | "MATERIAL" | "REMOVED";
  audited_at: string;
  elements: ElementAudit[];
  summary?: string;
}

export interface CitationRecord {
  citation_id: string;
  registrant: string;
  base_url: string;
  article_title: string;
  baseline_oldid: number;
  base_fingerprint: string;
  claim_elements: string[];
  registered_at: string;
  latest_drift_class: "UNAUDITED" | "SAME" | "COSMETIC" | "MATERIAL" | "REMOVED";
  latest_audit_id: string;
  audit_count: number;
}

export interface ClaimBadgeRecord {
  claim_id: string;
  publisher: string;
  citation_id: string;
  claim_text: string;
  badge_class: string;
  last_checked_at: string;
  citation_audit_count: number;
  is_valid: boolean;
}

export interface DriftStats {
  totalCitations: number;
  totalAudits: number;
  sameCount: number;
  cosmeticCount: number;
  materialCount: number;
  removedCount: number;
}
