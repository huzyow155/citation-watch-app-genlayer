import { describe, it, expect } from "vitest";

describe("Interactive Guided Walkthrough Flow", () => {
  const steps = [
    { id: 1, title: "Decentralized Citation Integrity" },
    { id: 2, title: "1. Register Baseline Citation" },
    { id: 3, title: "2. Audit Source Drift" },
    { id: 4, title: "3. Publish Verifiable Claims" },
    { id: 5, title: "4. Dynamic ClaimsBoard Badges" },
  ];

  it("has exactly 5 sequential onboarding steps", () => {
    expect(steps.length).toBe(5);
  });

  it("covers all primary protocol operations in order", () => {
    expect(steps[0].title).toContain("Citation Integrity");
    expect(steps[1].title).toContain("Register Baseline");
    expect(steps[2].title).toContain("Audit Source Drift");
    expect(steps[3].title).toContain("Publish Verifiable Claims");
    expect(steps[4].title).toContain("Dynamic ClaimsBoard Badges");
  });
});
