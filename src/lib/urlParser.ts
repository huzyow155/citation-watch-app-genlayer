/**
 * Strict URL parsing and spoof protection utilities for CitationWatch.
 * Enforces RFC standards and strict Wikipedia subdomain matching.
 */

export interface ParsedWikiUrl {
  isValid: boolean;
  error?: string;
  articleTitle?: string;
  oldid?: number;
  normalizedUrl?: string;
}

const ALLOWED_HOST_REGEX = /^[a-z0-9-]+\.wikipedia\.org$/i;

export function parseAndValidateWikipediaUrl(rawUrl: string): ParsedWikiUrl {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { isValid: false, error: "URL string is required" };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 500) {
    return { isValid: false, error: "URL exceeds maximum length (500 chars)" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: "Malformed URL format" };
  }

  // Scheme check
  if (parsed.protocol !== "https:") {
    return { isValid: false, error: "invalid url scheme: only https is permitted" };
  }

  // Userinfo check (spoofing protection)
  if (parsed.username || parsed.password) {
    return { isValid: false, error: "url contains userinfo, port, or invalid characters" };
  }

  // Custom port check
  if (parsed.port && parsed.port !== "443" && parsed.port !== "") {
    return { isValid: false, error: "url contains userinfo, port, or invalid characters" };
  }

  // Host check (must be sub.wikipedia.org or wikipedia.org)
  const host = parsed.hostname.toLowerCase();
  if (host !== "wikipedia.org" && !ALLOWED_HOST_REGEX.test(host)) {
    return { isValid: false, error: "invalid url: only wikipedia.org is permitted" };
  }

  // Extract article title from /wiki/<Title> or /w/index.php?title=<Title>
  let articleTitle = "";
  if (parsed.pathname.startsWith("/wiki/")) {
    articleTitle = parsed.pathname.slice("/wiki/".length).trim();
  } else if (parsed.pathname.startsWith("/w/index.php")) {
    articleTitle = parsed.searchParams.get("title") || "";
  }

  if (!articleTitle) {
    return { isValid: false, error: "article title must not be empty" };
  }

  // Clean title: decode URI component and replace underscores with spaces
  try {
    articleTitle = decodeURIComponent(articleTitle).replace(/_/g, " ");
  } catch {
    // If decoding fails, keep raw
  }

  // Extract oldid if present
  let oldid: number | undefined;
  const oldidParam = parsed.searchParams.get("oldid");
  if (oldidParam) {
    const parsedOldid = parseInt(oldidParam, 10);
    if (!isNaN(parsedOldid) && parsedOldid > 0) {
      oldid = parsedOldid;
    }
  }

  return {
    isValid: true,
    articleTitle,
    oldid,
    normalizedUrl: parsed.origin + parsed.pathname + (parsed.search ? parsed.search : ""),
  };
}

/**
 * Spoofing protection tests:
 * Detects open redirect tricks, double @, lookalikes, IDN homographs.
 */
export function isLookalikeOrSpoofedHost(host: string): boolean {
  const h = host.toLowerCase();
  // Homograph / Cyrillic or lookalikes:
  // e.g. wikìpedia, wikipedıa, etc.
  for (let i = 0; i < h.length; i++) {
    const code = h.charCodeAt(i);
    // standard ascii alphanumeric, dot, or dash
    if (
      !(code >= 97 && code <= 122) && // a-z
      !(code >= 48 && code <= 57) &&  // 0-9
      code !== 46 && // .
      code !== 45    // -
    ) {
      return true;
    }
  }

  // Subdomain spoof check: evilwikipedia.org, not-wikipedia.org.attacker.com
  const parts = h.split(".");
  if (parts.length < 2) return true;
  const domain = parts[parts.length - 2];
  const tld = parts[parts.length - 1];

  if (domain !== "wikipedia" || tld !== "org") {
    return true;
  }

  return false;
}
