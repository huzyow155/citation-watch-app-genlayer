export interface RevertDefinition {
  code: string;
  category: "VALIDATION" | "COOLDOWN" | "PERMISSION" | "SOURCE_ERROR" | "CONSENSUS_FAILURE";
  friendlyMessage: string;
  remedy: string;
}

export const REVERT_MAP: Record<string, RevertDefinition> = {
  // SourceDriftLedger Reverts
  "invalid url scheme: only https is permitted": {
    code: "INVALID_URL_SCHEME",
    category: "VALIDATION",
    friendlyMessage: "The provided URL scheme is not secure. Only https:// is allowed.",
    remedy: "Ensure your URL begins with https://",
  },
  "invalid url: only wikipedia.org is permitted": {
    code: "UNSUPPORTED_DOMAIN",
    category: "VALIDATION",
    friendlyMessage: "Domain is not permitted. Only wikipedia.org subdomains are accepted.",
    remedy: "Provide a valid Wikipedia article URL (e.g. https://en.wikipedia.org/wiki/...).",
  },
  "url contains userinfo, port, or invalid characters": {
    code: "MALFORMED_URL",
    category: "VALIDATION",
    friendlyMessage: "URL contains prohibited authentication info, custom ports, or invalid characters.",
    remedy: "Remove ports, username/passwords, or non-standard characters from the URL.",
  },
  "article title must not be empty": {
    code: "EMPTY_ARTICLE_TITLE",
    category: "VALIDATION",
    friendlyMessage: "Could not extract a valid article title from the URL path.",
    remedy: "Ensure the URL points to /wiki/<Article_Title>.",
  },
  "baseline_oldid must be greater than 0": {
    code: "INVALID_BASELINE_OLDID",
    category: "VALIDATION",
    friendlyMessage: "The baseline revision ID must be a positive integer.",
    remedy: "Provide a valid oldid query parameter greater than 0.",
  },
  "claim_elements must not be empty": {
    code: "EMPTY_CLAIM_ELEMENTS",
    category: "VALIDATION",
    friendlyMessage: "At least one claim element sentence is required.",
    remedy: "Add one or more sentences extracted from the baseline source text.",
  },
  "claim_elements exceeds maximum allowed": {
    code: "MAX_ELEMENTS_EXCEEDED",
    category: "VALIDATION",
    friendlyMessage: "Exceeded maximum allowed claim elements (maximum 5).",
    remedy: "Reduce the number of claim sentences to 5 or fewer.",
  },
  "claim element text exceeds maximum length": {
    code: "ELEMENT_TOO_LONG",
    category: "VALIDATION",
    friendlyMessage: "One of the claim elements exceeds the maximum character limit (300 chars).",
    remedy: "Trim or break down the sentence to stay under 300 characters.",
  },
  "claim element text cannot be empty": {
    code: "EMPTY_ELEMENT_TEXT",
    category: "VALIDATION",
    friendlyMessage: "One of the claim elements is empty.",
    remedy: "Ensure each claim element contains text.",
  },
  "citation not found": {
    code: "CITATION_NOT_FOUND",
    category: "VALIDATION",
    friendlyMessage: "The specified citation ID does not exist in the ledger.",
    remedy: "Check that the 64-character citation ID is correct and registered.",
  },
  "live audit cooldown in progress": {
    code: "LIVE_COOLDOWN_ACTIVE",
    category: "COOLDOWN",
    friendlyMessage: "A live audit for this citation was conducted recently. The 300-second cooldown is active.",
    remedy: "Wait until the cooldown period expires (5 minutes between LIVE audits) or audit against a historical revision ID.",
  },
  "target oldid must be greater than baseline oldid": {
    code: "TARGET_OLDID_ORDER",
    category: "VALIDATION",
    friendlyMessage: "The target revision oldid must be greater than the baseline oldid.",
    remedy: "Select a later historical revision ID to evaluate drift forward in time.",
  },
  "target title must match baseline title": {
    code: "TITLE_MISMATCH",
    category: "VALIDATION",
    friendlyMessage: "The target revision does not belong to the same Wikipedia article title as the baseline.",
    remedy: "Audit revisions belonging to the same registered article title.",
  },
  "element claim not found in baseline text": {
    code: "BASELINE_CLAIM_ABSENT",
    category: "VALIDATION",
    friendlyMessage: "A claim element was not found in the baseline text during registration.",
    remedy: "Make sure the quote is copied verbatim from the baseline revision text.",
  },
  "invalid model output": {
    code: "INVALID_MODEL_OUTPUT",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Validator LLM output did not conform to the strict JSON schema required by consensus.",
    remedy: "Re-run the audit or verify that the sentences have standard textual representation.",
  },

  // ClaimsBoard Reverts
  "citation is not registered in ledger": {
    code: "CLAIMS_CITATION_NOT_FOUND",
    category: "VALIDATION",
    friendlyMessage: "ClaimsBoard could not verify the citation in the linked SourceDriftLedger.",
    remedy: "Register the citation on SourceDriftLedger first before referencing it in ClaimsBoard.",
  },
  "claim text cannot be empty": {
    code: "CLAIMS_EMPTY_TEXT",
    category: "VALIDATION",
    friendlyMessage: "The claim text cannot be empty.",
    remedy: "Enter the statement or assertion you are publishing.",
  },
  "claim not found": {
    code: "CLAIM_RECORD_NOT_FOUND",
    category: "VALIDATION",
    friendlyMessage: "The requested claim ID does not exist on ClaimsBoard.",
    remedy: "Verify the claim ID.",
  },
  "only owner can update ledger": {
    code: "UNAUTHORIZED_OWNER",
    category: "PERMISSION",
    friendlyMessage: "Only the contract owner can update the linked SourceDriftLedger contract address.",
    remedy: "Switch to the contract deployer/owner wallet address.",
  },
};

export function decodeContractRevert(rawError: string | undefined | null): RevertDefinition {
  if (!rawError) {
    return {
      code: "UNKNOWN_ERROR",
      category: "VALIDATION",
      friendlyMessage: "Transaction reverted with no message.",
      remedy: "Check transaction parameters and try again.",
    };
  }

  const errLower = rawError.toLowerCase();

  for (const [key, def] of Object.entries(REVERT_MAP)) {
    if (errLower.includes(key.toLowerCase())) {
      return def;
    }
  }

  return {
    code: "GENERIC_REVERT",
    category: "VALIDATION",
    friendlyMessage: `Transaction reverted: ${rawError.slice(0, 150)}`,
    remedy: "Review the contract rules and retry with valid inputs.",
  };
}
