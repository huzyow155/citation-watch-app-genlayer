/**
 * Strict TypeScript port of SourceDriftLedger's text cleaning and normalization algorithms.
 * Mirrors Python's _clean_html and _normalize_text.
 */

/**
 * Removes script, style, HTML comments, and tags, decodes common entities, and collapses whitespace.
 */
export function cleanHtml(rawHtml: string): string {
  if (!rawHtml) return "";

  let text = rawHtml;

  // 1. Remove script and style elements
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");

  // 2. Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // 3. Strip tags
  text = text.replace(/<[^>]+>/g, " ");

  // 4. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, " ")
    .replace(/&ndash;/g, " ");

  // 5. Replace other numeric entities with space or strip
  text = text.replace(/&#[0-9]+;/g, " ");
  text = text.replace(/&#x[0-9a-fA-F]+;/g, " ");

  // 6. Normalize whitespace
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Normalizes text for verbatim matching: lowercase, strip punctuation, collapse whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return "";
  // Strip punctuation and convert to lowercase
  const noPunct = text.replace(/[^\w\s]/g, " ").toLowerCase();
  return noPunct.replace(/\s+/g, " ").trim();
}

/**
 * Checks deterministic match layer:
 * 1. EXACT match (substring)
 * 2. NORMALIZED match (normalized substring)
 * Returns status: "EXACT" | "NORMALIZED" | "ABSENT" | "MODEL_REQUIRED"
 */
export function evaluateDeterministicMatch(claim: string, fullSource: string): "EXACT" | "NORMALIZED" | "ABSENT" | "MODEL_REQUIRED" {
  if (!claim || !fullSource) return "ABSENT";

  if (fullSource.includes(claim.trim())) {
    return "EXACT";
  }

  const normClaim = normalizeText(claim);
  const normSource = normalizeText(fullSource);

  if (normSource.includes(normClaim)) {
    return "NORMALIZED";
  }

  return "MODEL_REQUIRED";
}
