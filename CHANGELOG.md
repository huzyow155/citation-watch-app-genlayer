# Changelog

All notable changes to CitationWatch dApp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Milestone 1] - 2026-10-24

### UX, Onboarding, and Accessibility Overhaul

**Git Diff**: [pre-milestones...milestone-1-ux-onboarding](https://github.com/huzyow155/citation-watch-app-genlayer/compare/pre-milestones...milestone-1-ux-onboarding)

---

### Overview

Milestone 1 delivers a comprehensive overhaul of user experience, interactive onboarding, and accessibility compliance for the CitationWatch dApp on GenLayer Studionet (Preview). This update introduces an interactive 5-step guided walkthrough, a dedicated test funds and gas guide with live RPC balance queries, pre-write validation guards, shimmer skeleton loading states, an application-wide ErrorBoundary, and full WCAG 2.1 AA accessibility remediation achieving 0 axe violations across desktop and mobile viewports.

---

### Quantifiable Metrics (Before vs. After)

| Metric | Baseline (`pre-milestones` @ `9da5734`) | Milestone 1 (`milestone-1-ux-onboarding`) | Improvement |
| :--- | :--- | :--- | :--- |
| **Axe Violations - Landing (Desktop 1440px)** | 1 serious (`color-contrast`) | **0 violations** | 100% resolved |
| **Axe Violations - Landing (Mobile 390px)** | 1 serious (`color-contrast`) | **0 violations** | 100% resolved |
| **Axe Violations - Workbench (Desktop 1440px)** | 2 violations (1 serious, 1 moderate) | **0 violations** | 100% resolved |
| **Axe Violations - Workbench (Mobile 390px)** | 2 violations (1 serious, 1 moderate) | **0 violations** | 100% resolved |
| **Interactive Guided Tour Steps** | 0 steps (no tour) | **5 steps (keyboard-navigable)** | +5 steps |
| **Dedicated Funding & Gas Guide** | None | **Live modal + RPC balance query** | Complete feature |
| **Pre-Write Balance Guards** | 0/4 write buttons | **4/4 write buttons guarded** | 100% coverage |
| **Inline Gas/Funding Callouts** | 0/4 write operations | **4/4 write operations** | 100% coverage |
| **Shimmer Skeleton Loaders** | 0 skeleton components | **3 dedicated skeleton loaders** | Cards, Details, Claims |
| **Application ErrorBoundary** | Missing (uncaught crashes) | **Full boundary + reset actions** | Production resilient |
| **Direct Deep-Link Routing** | 404 error on `/workbench` | **SPA rewrite (vercel.json)** | 100% resolved |
| **Vitest Unit & Integration Tests** | 37 tests (5 files) | **42 tests (7 files)** | +5 tests (100% passing) |
| **Touch Target Compliance (>= 44x44px)** | 0% compliant | **94.4% compliant (17/18)** | WCAG 2.5.5 compliance |

---

### Before vs. After Analysis

#### 1. Interactive Onboarding & Walkthrough
- **Before**: First-time visitors arrived on the Workbench with no visual cues explaining GenLayer's non-deterministic consensus, how verbatim extraction works, or what the 4 tabs accomplish.
- **After**: An interactive 5-step modal walkthrough (`WalkthroughModal.tsx`) introduces the user to:
  1. Source Integrity & Baselines
  2. Non-Deterministic Validator Consensus
  3. Continuous Drift Detection
  4. Cross-Contract ClaimsBoard Integration
  5. Throwaway Keys & Gasless Preview Model
  Includes keyboard navigation (Escape, Left/Right arrows), step indicator pills, and `localStorage` dismissal persistence (`citationwatch_tour_dismissed`).
- **Reason**: Educates new users and judges on GenLayer-native capabilities without cognitive friction.

#### 2. Test Funds and Gas Guidance
- **Before**: No gas or funding explanations existed. Users unfamiliar with GenLayer Studionet (Preview) wondered if real funds were required or why transactions did not trigger MetaMask gas prompts.
- **After**: A dedicated Test Funds & Gas Guide modal (`FundingModal.tsx`) explains:
  - GenLayer Studionet (Preview) zero-gas model (measured transaction cost: 0 GEN).
  - Live account balance querying via `client.getBalance`.
  - Faucet instructions and discord bot access for preview tokens.
  - Low balance recovery instructions.
  - Inline `[Gas & Funds Guide]` action buttons placed directly beside EVERY write button (Register, Audit, Publish Claim, Refresh Claim).
  - Pre-write balance guard (`runPreWriteGuard`) executing before any consensus transaction is submitted.
- **Reason**: Eliminates user hesitation around transaction fees and confirms the preview nature of Studionet.

#### 3. Full Accessibility Remediation (WCAG 2.1 AA)
- **Before**: Automated axe scans failed on contrast ratios (cyan-600 on dark slate failed AA standard 4.5:1), missing landmark regions, and `label-content-name-mismatch` on custom buttons. Touch targets were sub-40px.
- **After**:
  - Contrast ratios elevated above 9:1 using high-contrast cyan-500 against slate-950 and bright white foreground text.
  - Pure ASCII header and components (replaced non-ASCII symbols with Lucide vector icons).
  - Accessible name alignment on all buttons and interactive controls.
  - Proper landmark hierarchy: `<header>`, `<main>`, `<nav role="tablist">`, and `<section aria-labelledby="...">` landmarks.
  - Keyboard accessible skip link (`Skip to main content`).
  - Mobile 390px viewport verified for zero horizontal overflow (`scrollWidth <= innerWidth`).
- **Reason**: Meets strict WCAG 2.1 AA standards for all users and assistive technology.

#### 4. Skeleton Loading States & Error Resilience
- **Before**: Slow RPC responses left users staring at blank white screens or frozen card layouts without indication of network activity. Unhandled runtime errors caused full page crashes.
- **After**:
  - Added `CitationCardSkeleton`, `CitationDetailSkeleton`, and `ClaimCardSkeleton` providing animated pulse/shimmer feedback while querying Studionet RPC.
  - Added React `ErrorBoundary` component with actionable "Reload Application" and "Reset to Overview" buttons.
  - Enhanced revert decoding with human-readable consensus disagreement explanations.
- **Reason**: Prevents jarring layout shifts and provides graceful degradation during RPC latency or validator disagreement.

#### 5. Direct Deep-Linking & Routing
- **Before**: Directly loading `https://citation-watch-app-genlayer.vercel.app/workbench` or `/app` resulted in Vercel 404 errors due to missing single-page app rewrites.
- **After**: Added `vercel.json` with SPA wildcard rewrite `[{"source": "/(.*)", "destination": "/"}]` and added route aliases in `App.tsx`.
- **Reason**: Ensures bookmarked or shared links to the workbench route resolve correctly.
