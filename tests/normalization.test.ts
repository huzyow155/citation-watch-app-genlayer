import { describe, it, expect } from "vitest";
import { cleanHtml, normalizeText, evaluateDeterministicMatch } from "../src/lib/normalization";

describe("cleanHtml", () => {
  it("strips scripts, styles, comments, and decodes html entities", () => {
    const raw = `
      <div>
        <script>alert('xss');</script>
        <p>Turing was an English mathematician &amp; computer scientist.</p>
        <!-- note here -->
        <style>.hide { display: none; }</style>
      </div>
    `;
    const cleaned = cleanHtml(raw);
    expect(cleaned).toBe("Turing was an English mathematician & computer scientist.");
  });

  it("handles non-breaking spaces and quotes", () => {
    const raw = "Alan&nbsp;Turing was &quot;the father of computer science&#39;s modern era&quot;.";
    const cleaned = cleanHtml(raw);
    expect(cleaned).toBe("Alan Turing was \"the father of computer science's modern era\".");
  });
});

describe("normalizeText", () => {
  it("lowercases, removes punctuation, and normalizes spacing", () => {
    const raw = "Alan Turing, born in 1912; played a pivotal role!";
    const norm = normalizeText(raw);
    expect(norm).toBe("alan turing born in 1912 played a pivotal role");
  });
});

describe("evaluateDeterministicMatch", () => {
  const source = "Alan Turing was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist.";

  it("detects EXACT match", () => {
    const res = evaluateDeterministicMatch("English mathematician, computer scientist", source);
    expect(res).toBe("EXACT");
  });

  it("detects NORMALIZED match when punctuation/case differs", () => {
    const res = evaluateDeterministicMatch("english mathematician computer scientist", source);
    expect(res).toBe("NORMALIZED");
  });

  it("returns MODEL_REQUIRED when text is rephrased or drifted", () => {
    const res = evaluateDeterministicMatch("British computing pioneer and logician", source);
    expect(res).toBe("MODEL_REQUIRED");
  });
});
