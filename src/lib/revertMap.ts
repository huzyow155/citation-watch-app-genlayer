export interface RevertDefinition {
  code: string;
  category: "VALIDATION" | "COOLDOWN" | "PERMISSION" | "SOURCE_ERROR" | "CONSENSUS_FAILURE";
  friendlyMessage: string;
  remedy: string;
}

export const REVERT_MAP: Record<string, RevertDefinition> = {
  // SourceDriftLedger Reverts
  "already registered": {
    code: "ALREADY_REGISTERED",
    category: "VALIDATION",
    friendlyMessage: "This baseline citation and quote combination has already been registered on-chain.",
    remedy: "Query the existing citation ID in Explore, or register a different revision or quote set.",
  },
  "audit evaluation failed": {
    code: "AUDIT_EVALUATION_FAILED",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Validators could not reach consensus on the audit evaluation.",
    remedy: "Check target URL availability or retry after verifying the page loads normally.",
  },
  "audit evaluation payload missing": {
    code: "AUDIT_PAYLOAD_MISSING",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Audit consensus payload was missing or malformed.",
    remedy: "Retry the audit transaction.",
  },
  "baseline url cannot contain backslashes": {
    code: "INVALID_URL_BACKSLASHES",
    category: "VALIDATION",
    friendlyMessage: "The baseline URL contains backslashes.",
    remedy: "Use forward slashes in the URL path.",
  },
  "baseline url cannot contain fragment": {
    code: "INVALID_URL_FRAGMENT",
    category: "VALIDATION",
    friendlyMessage: "The baseline URL cannot contain a hash fragment (#).",
    remedy: "Remove the #section fragment from the URL.",
  },
  "baseline url cannot contain whitespace": {
    code: "INVALID_URL_WHITESPACE",
    category: "VALIDATION",
    friendlyMessage: "The baseline URL contains spaces or whitespace.",
    remedy: "Ensure the URL is trimmed and spaces are percent-encoded or replaced with underscores.",
  },
  "baseline url must be string": {
    code: "INVALID_URL_TYPE",
    category: "VALIDATION",
    friendlyMessage: "The baseline URL parameter must be a string.",
    remedy: "Provide a valid URL string.",
  },
  "baseline url title cannot be empty": {
    code: "EMPTY_ARTICLE_TITLE",
    category: "VALIDATION",
    friendlyMessage: "Could not extract a valid article title from the URL path.",
    remedy: "Ensure the URL points to /wiki/<Article_Title> or contains ?title=<Title>.",
  },
  "baseline must be an immutable revision permalink": {
    code: "BASELINE_NOT_PERMALINK",
    category: "VALIDATION",
    friendlyMessage: "Baseline citations must use a permanent revision permalink with an oldid query parameter.",
    remedy: "Provide a permalink containing ?title=<Title>&oldid=<number>.",
  },
  "baseline verification failed": {
    code: "BASELINE_VERIFICATION_FAILED",
    category: "VALIDATION",
    friendlyMessage: "Validators could not verify the claim quote in the baseline Wikipedia text.",
    remedy: "Make sure the quote is copied verbatim from the baseline revision text.",
  },
  "citation not found": {
    code: "CITATION_NOT_FOUND",
    category: "VALIDATION",
    friendlyMessage: "The specified citation ID does not exist in the ledger.",
    remedy: "Check that the 12-character citation ID is correct and registered.",
  },
  "cited quote not found verbatim in presented passage": {
    code: "QUOTE_NOT_IN_PASSAGE",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Model output failed consensus because the cited quote was not verbatim in the presented passage.",
    remedy: "Verify the quote accurately matches the text in the target page.",
  },
  "clock unavailable": {
    code: "CLOCK_UNAVAILABLE",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Chain clock timestamp was unavailable during contract execution.",
    remedy: "Retry the transaction on Studionet.",
  },
  "coverage insufficient to conclude absence": {
    code: "COVERAGE_INSUFFICIENT",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Passage scan coverage was insufficient to conclusively prove claim absence.",
    remedy: "Ensure quotes are selected from primary article sections.",
  },
  "datetime must be string": {
    code: "DATETIME_NOT_STRING",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Internal timestamp error: datetime must be string.",
    remedy: "Retry the transaction.",
  },
  "duplicate quote": {
    code: "DUPLICATE_QUOTE",
    category: "VALIDATION",
    friendlyMessage: "Duplicate quotes detected in registration input.",
    remedy: "Provide distinct sentences for each claim quote.",
  },
  "empty baseline url": {
    code: "EMPTY_BASELINE_URL",
    category: "VALIDATION",
    friendlyMessage: "The baseline URL cannot be empty.",
    remedy: "Enter a valid Wikipedia permalink URL.",
  },
  "empty datetime": {
    code: "EMPTY_DATETIME",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Chain timestamp was empty.",
    remedy: "Retry the transaction.",
  },
  "empty target url": {
    code: "EMPTY_TARGET_URL",
    category: "VALIDATION",
    friendlyMessage: "The target URL cannot be empty.",
    remedy: "Enter a valid target Wikipedia URL or revision permalink.",
  },
  "invalid iso-8601 datetime format": {
    code: "INVALID_DATETIME_FORMAT",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Invalid ISO-8601 datetime format received from chain clock.",
    remedy: "Retry the transaction.",
  },
  "invalid model output": {
    code: "INVALID_MODEL_OUTPUT",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Validator LLM output did not conform to the strict JSON schema required by consensus.",
    remedy: "Re-run the audit or verify that the sentences have standard textual representation.",
  },
  "label must be string": {
    code: "LABEL_NOT_STRING",
    category: "VALIDATION",
    friendlyMessage: "Citation label must be a string.",
    remedy: "Enter a text title or label for the citation.",
  },
  "label exceeds maximum length": {
    code: "LABEL_TOO_LONG",
    category: "VALIDATION",
    friendlyMessage: "Citation label exceeds maximum allowed length (80 characters).",
    remedy: "Shorten the label to 80 characters or fewer.",
  },
  "live audit cooldown active": {
    code: "LIVE_COOLDOWN_ACTIVE",
    category: "COOLDOWN",
    friendlyMessage: "A live audit for this citation was conducted recently. The 300-second cooldown is active.",
    remedy: "Wait until the cooldown period expires (5 minutes between LIVE audits) or audit against a historical revision permalink.",
  },
  "live target url cannot contain query parameters": {
    code: "LIVE_URL_QUERY_FORBIDDEN",
    category: "VALIDATION",
    friendlyMessage: "LIVE article audits must use clean article path without query parameters.",
    remedy: "Provide clean live URL path like https://en.wikipedia.org/wiki/<Title>.",
  },
  "no elements to classify": {
    code: "NO_ELEMENTS",
    category: "VALIDATION",
    friendlyMessage: "No claim elements were provided to evaluate.",
    remedy: "Provide at least one claim sentence.",
  },
  "quote not found verbatim in baseline": {
    code: "QUOTE_NOT_IN_BASELINE",
    category: "VALIDATION",
    friendlyMessage: "The supplied quote was not found verbatim in the baseline revision text.",
    remedy: "Copy the sentence verbatim from the baseline revision HTML text.",
  },
  "quotes_json must be json string": {
    code: "QUOTES_NOT_JSON_STRING",
    category: "VALIDATION",
    friendlyMessage: "Quotes parameter must be a JSON-encoded string.",
    remedy: "Encode quotes array as JSON string.",
  },
  "quotes_json must be valid json": {
    code: "QUOTES_INVALID_JSON",
    category: "VALIDATION",
    friendlyMessage: "Quotes parameter could not be parsed as valid JSON.",
    remedy: "Ensure the JSON array format is valid.",
  },
  "quotes must be a list": {
    code: "QUOTES_NOT_A_LIST",
    category: "VALIDATION",
    friendlyMessage: "Quotes must be a list of 1 to 4 items.",
    remedy: "Provide between 1 and 4 quote sentences.",
  },
  "quote 1 cannot be empty": {
    code: "QUOTE_EMPTY",
    category: "VALIDATION",
    friendlyMessage: "A quote sentence cannot be empty.",
    remedy: "Enter valid sentence text.",
  },
  "cannot be empty": {
    code: "QUOTE_EMPTY",
    category: "VALIDATION",
    friendlyMessage: "A quote sentence cannot be empty.",
    remedy: "Enter valid sentence text.",
  },
  "length must be between": {
    code: "QUOTE_LENGTH_INVALID",
    category: "VALIDATION",
    friendlyMessage: "Quote length must be between 20 and 300 characters.",
    remedy: "Adjust the quote length to be between 20 and 300 characters.",
  },
  "must be string": {
    code: "PARAM_NOT_STRING",
    category: "VALIDATION",
    friendlyMessage: "Input parameter must be a string.",
    remedy: "Provide valid text string input.",
  },
  "source url cannot contain userinfo": {
    code: "URL_CONTAINS_USERINFO",
    category: "VALIDATION",
    friendlyMessage: "URL cannot contain username or password credentials.",
    remedy: "Remove authentication credentials from the URL.",
  },
  "source url hostname cannot be an ip address": {
    code: "URL_IS_IP",
    category: "VALIDATION",
    friendlyMessage: "IP address hostnames are not permitted.",
    remedy: "Use a standard wikipedia.org domain name.",
  },
  "source url hostname cannot be localhost": {
    code: "URL_IS_LOCALHOST",
    category: "VALIDATION",
    friendlyMessage: "Localhost URLs are not allowed.",
    remedy: "Use an official wikipedia.org domain.",
  },
  "source url hostname cannot be punycode": {
    code: "URL_IS_PUNYCODE",
    category: "VALIDATION",
    friendlyMessage: "Punycode domain names are disallowed.",
    remedy: "Use standard ASCII wikipedia.org domain.",
  },
  "source url hostname cannot end with a dot": {
    code: "URL_ENDS_WITH_DOT",
    category: "VALIDATION",
    friendlyMessage: "Hostname cannot end with a trailing dot.",
    remedy: "Remove the trailing dot from the domain name.",
  },
  "source url hostname is missing": {
    code: "URL_HOST_MISSING",
    category: "VALIDATION",
    friendlyMessage: "The URL hostname is missing.",
    remedy: "Ensure the URL starts with https://en.wikipedia.org.",
  },
  "source url hostname must be pure ascii": {
    code: "URL_NOT_ASCII",
    category: "VALIDATION",
    friendlyMessage: "URL hostname must contain only pure ASCII characters.",
    remedy: "Remove any non-ASCII characters from the URL domain.",
  },
  "source url must be a wikipedia.org language domain": {
    code: "UNSUPPORTED_DOMAIN",
    category: "VALIDATION",
    friendlyMessage: "Only wikipedia.org language domains are permitted.",
    remedy: "Use a valid Wikipedia domain such as en.wikipedia.org.",
  },
  "source url port must be 443 or omitted": {
    code: "INVALID_PORT",
    category: "VALIDATION",
    friendlyMessage: "Non-standard network ports are not permitted.",
    remedy: "Omit the port number or use the default https port (443).",
  },
  "source url scheme must be https": {
    code: "INVALID_URL_SCHEME",
    category: "VALIDATION",
    friendlyMessage: "Insecure URL scheme: only https:// is permitted.",
    remedy: "Change the URL scheme to https://",
  },
  "source unavailable": {
    code: "SOURCE_UNAVAILABLE",
    category: "SOURCE_ERROR",
    friendlyMessage: "Wikipedia page could not be fetched by consensus nodes.",
    remedy: "Verify the Wikipedia URL is live and accessible.",
  },
  "target url cannot contain backslashes": {
    code: "TARGET_URL_BACKSLASHES",
    category: "VALIDATION",
    friendlyMessage: "Target URL cannot contain backslashes.",
    remedy: "Use forward slashes in the target URL.",
  },
  "target url cannot contain fragment": {
    code: "TARGET_URL_FRAGMENT",
    category: "VALIDATION",
    friendlyMessage: "Target URL cannot contain section fragments (#).",
    remedy: "Remove #section from the target URL.",
  },
  "target url cannot contain whitespace": {
    code: "TARGET_URL_WHITESPACE",
    category: "VALIDATION",
    friendlyMessage: "Target URL contains whitespace.",
    remedy: "Ensure the target URL has no spaces.",
  },
  "target url host must match baseline host": {
    code: "TARGET_HOST_MISMATCH",
    category: "VALIDATION",
    friendlyMessage: "The target URL hostname must match the baseline citation hostname.",
    remedy: "Audit against the same language edition of Wikipedia.",
  },
  "target url must be string": {
    code: "TARGET_NOT_STRING",
    category: "VALIDATION",
    friendlyMessage: "Target URL parameter must be a string.",
    remedy: "Provide a valid target URL string.",
  },
  "target url path must be /w/index.php or /wiki/<title>": {
    code: "TARGET_PATH_INVALID",
    category: "VALIDATION",
    friendlyMessage: "Target URL path must be /w/index.php or /wiki/<Article_Title>.",
    remedy: "Provide a valid Wikipedia article path.",
  },
  "target already audited": {
    code: "TARGET_ALREADY_AUDITED",
    category: "VALIDATION",
    friendlyMessage: "This revision has already been audited for this citation.",
    remedy: "Select a different subsequent revision oldid, or audit the current LIVE page.",
  },
  "target oldid must be digits only": {
    code: "TARGET_OLDID_NOT_DIGITS",
    category: "VALIDATION",
    friendlyMessage: "Target oldid must consist of numeric digits only.",
    remedy: "Provide a valid integer revision oldid.",
  },
  "target revision url must contain title and oldid": {
    code: "TARGET_OLDID_MISSING",
    category: "VALIDATION",
    friendlyMessage: "Target revision URL must contain both title and oldid query parameters.",
    remedy: "Include ?title=<Title>&oldid=<number> in the target permalink.",
  },
  "target revision must be later than baseline": {
    code: "TARGET_NOT_LATER",
    category: "VALIDATION",
    friendlyMessage: "Target revision oldid must be strictly greater than baseline oldid.",
    remedy: "Select a later historical revision to evaluate forward drift.",
  },
  "target title must match baseline title": {
    code: "TITLE_MISMATCH",
    category: "VALIDATION",
    friendlyMessage: "Target article title does not match the registered baseline title.",
    remedy: "Audit revisions belonging to the same Wikipedia article title.",
  },
  "invalid element statuses": {
    code: "INVALID_ELEMENT_STATUSES",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Validator consensus failed on element drift classifications.",
    remedy: "Retry the audit transaction.",
  },
  "unknown audit class": {
    code: "UNKNOWN_AUDIT_CLASS",
    category: "CONSENSUS_FAILURE",
    friendlyMessage: "Received unrecognized audit classification.",
    remedy: "Retry the audit transaction.",
  },

  // ClaimsBoard Reverts
  "citation_id cannot be empty": {
    code: "CLAIMS_EMPTY_CID",
    category: "VALIDATION",
    friendlyMessage: "The citation ID cannot be empty.",
    remedy: "Provide the 12-character ID of a registered citation.",
  },
  "claim not found": {
    code: "CLAIM_RECORD_NOT_FOUND",
    category: "VALIDATION",
    friendlyMessage: "The requested claim ID does not exist on ClaimsBoard.",
    remedy: "Check that the claim ID is correct.",
  },
  "headline must be string": {
    code: "HEADLINE_NOT_STRING",
    category: "VALIDATION",
    friendlyMessage: "Headline must be a string.",
    remedy: "Enter a statement headline for the claim.",
  },
  "headline length must be between": {
    code: "HEADLINE_LENGTH_INVALID",
    category: "VALIDATION",
    friendlyMessage: "Headline length must be between 10 and 140 characters.",
    remedy: "Adjust the headline length to be between 10 and 140 characters.",
  },
  "invalid hex address": {
    code: "INVALID_HEX_ADDRESS",
    category: "VALIDATION",
    friendlyMessage: "The address provided is not a valid hexadecimal Ethereum address.",
    remedy: "Provide a valid 42-character 0x hex address.",
  },
  "invalid ledger contract address format": {
    code: "INVALID_LEDGER_ADDR_FORMAT",
    category: "VALIDATION",
    friendlyMessage: "The ledger contract address format is invalid.",
    remedy: "Ensure the contract address starts with 0x and is 42 characters long.",
  },
  "ledger address already set": {
    code: "LEDGER_ALREADY_SET",
    category: "VALIDATION",
    friendlyMessage: "The SourceDriftLedger address on ClaimsBoard has already been configured.",
    remedy: "The ledger address cannot be changed once configured.",
  },
  "ledger not set": {
    code: "LEDGER_NOT_SET",
    category: "PERMISSION",
    friendlyMessage: "ClaimsBoard cannot publish claims because the linked ledger address is not configured.",
    remedy: "Contact the contract owner to initialize the ledger address.",
  },
  "only owner can set ledger address": {
    code: "UNAUTHORIZED_OWNER",
    category: "PERMISSION",
    friendlyMessage: "Only the ClaimsBoard contract deployer/owner can set the linked ledger address.",
    remedy: "Switch to the contract owner's wallet address.",
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
