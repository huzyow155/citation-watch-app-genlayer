import { describe, it, expect } from "vitest";
import { parseAndValidateWikipediaUrl, isLookalikeOrSpoofedHost } from "../src/lib/urlParser";

describe("parseAndValidateWikipediaUrl", () => {
  it("accepts valid wikipedia url with oldid", () => {
    const res = parseAndValidateWikipediaUrl(
      "https://en.wikipedia.org/w/index.php?title=Alan_Turing&oldid=1258759526"
    );
    expect(res.isValid).toBe(true);
    expect(res.articleTitle).toBe("Alan Turing");
    expect(res.oldid).toBe(1258759526);
  });

  it("accepts valid /wiki/ path url", () => {
    const res = parseAndValidateWikipediaUrl("https://en.wikipedia.org/wiki/Computer_programming");
    expect(res.isValid).toBe(true);
    expect(res.articleTitle).toBe("Computer programming");
  });

  it("rejects http scheme", () => {
    const res = parseAndValidateWikipediaUrl(
      "http://en.wikipedia.org/w/index.php?title=Alan_Turing&oldid=1258759526"
    );
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("only https is permitted");
  });

  it("rejects userinfo injection", () => {
    const res = parseAndValidateWikipediaUrl(
      "https://admin:pass@en.wikipedia.org/wiki/Alan_Turing"
    );
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("url contains userinfo, port, or invalid characters");
  });

  it("rejects non-wikipedia domains", () => {
    const res = parseAndValidateWikipediaUrl("https://attacker.com/wiki/Alan_Turing");
    expect(res.isValid).toBe(false);
    expect(res.error).toContain("only wikipedia.org is permitted");
  });

  it("rejects lookalike spoofed domains", () => {
    expect(isLookalikeOrSpoofedHost("evilwikipedia.org")).toBe(true);
    expect(isLookalikeOrSpoofedHost("en.wikipedia.org.attacker.com")).toBe(true);
    expect(isLookalikeOrSpoofedHost("en.wikipedia.org")).toBe(false);
  });
});
