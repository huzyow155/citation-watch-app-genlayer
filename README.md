# CitationWatch Frontend dApp (`citation-watch-app-genlayer`)

Decentralized source drift and citation integrity tracker frontend, deployed on Vercel and connected to **GenLayer Studionet (Preview)**.

- **Production App**: [https://citation-watch-app-genlayer.vercel.app](https://citation-watch-app-genlayer.vercel.app)
- **Contract Repository**: [https://github.com/huzyow155/citation-watch-genlayer](https://github.com/huzyow155/citation-watch-genlayer)
- **App Repository**: [https://github.com/huzyow155/citation-watch-app-genlayer](https://github.com/huzyow155/citation-watch-app-genlayer)
- **Chain ID**: 61999
- **Network**: GenLayer Studionet (Preview)
- **RPC**: `https://studio.genlayer.com/api`
- **Explorer**: [https://explorer-studio.genlayer.com](https://explorer-studio.genlayer.com)

---

## Active Deployed Contracts (v1.2.0)

Both active contracts are deployed on GenLayer Studionet (Preview) and their source codes match byte-for-byte with `contracts-reference/`:

| Contract | Active Address | SHA-256 Fingerprint |
| :--- | :--- | :--- |
| **SourceDriftLedger** | [`0xFC7593432D4e8A2ceda911497807E4aCC7c7B705`](https://explorer-studio.genlayer.com/address/0xFC7593432D4e8A2ceda911497807E4aCC7c7B705) | `d5598c5e118d8411e87ef03f637950dc147799c94167ab8b0a70dd19c2215c8a` |
| **ClaimsBoard** | [`0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD`](https://explorer-studio.genlayer.com/address/0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD) | `4ee7d485bcaf7505514377abfea8f05eb3286447c13752df2847a3de7d0e8569` |

---

## Audit Fix Pass (v1.2.0 Production Verification)

This release resolves the 5 audit defects:

1. **Header Polish**: Removed the green pulsing dot and Studionet badges from the wallet pill in `src/components/Header.tsx`. The pill strictly displays the shortened account address (or "Connect"). The mandatory throwaway key disclaimer (`"Studionet-only throwaway key. Preview network, no real value."`) is prominently featured inside the wallet modal and adjacent to every on-chain write button.
2. **Landing Motion & Responsiveness**:
   - Built slowly typed typewriter effect in `src/lib/motion.ts` (~45ms/char) where the caret halts upon finishing. Under `prefers-reduced-motion: reduce`, the full text renders immediately without animation.
   - Staggered scroll-reveal (`IntersectionObserver`) with smooth fade-and-rise on sections and workbench cards (disabled under reduced motion).
   - Upgraded typography: clean sans-serif blue palette, base body >= 16px, hero >= 3rem desktop.
   - Responsive layout: verified zero horizontal scroll overflow at mobile 390px viewport (`document.documentElement.scrollWidth <= innerWidth`).
3. **Explore Live Reads & Caching**:
   - Replaced static fixtures with live contract hydration via `list_citation_ids`, `get_citation`, `list_claim_ids`, and `get_claim`.
   - Verified sample citations are explicitly labeled `"Verified sample citations (IDs from our evidence run)"`.
   - In-memory cache (`useRef`) and tab-gating protect against Cloudflare 30 req/min rate limits.
   - User-submitted registrations and claims persist across browser reloads via `localStorage`.
   - Clear RPC error banner with interactive "Retry" button.
4. **Real Production UI-Driven E2E Suite**:
   - Automated via Playwright in `scripts/run_e2e.mjs` against `https://citation-watch-app-genlayer.vercel.app`.
   - All 7 steps executed live with throwaway test account `0xcCDbAb11A805C8C20BEd5f7e83a61A7ea443b898` on GenLayer Studionet (Preview).
5. **Unit Test Suite (37 tests)**:
   - 37 passing unit tests in Vitest across 5 test suites (`tests/normalization.test.ts`, `tests/urlParser.test.ts`, `tests/outcome.test.ts`, `tests/txLifecycle.test.ts`, `tests/revertMap.test.ts`).
   - Audits and covers 100% (66/66) of `gl.vm.UserError` instances across both reference contracts.
   - Verifies leader receipt decoding for raw base64 and object payloads.

---

## Live On-Chain E2E Execution Evidence

The table below documents the live transactions executed on **GenLayer Studionet (Preview)** through the production dApp UI:

| Operation | Target / Input | Tx Hash | Receipt Status | Validator Votes | Latency | Explorer Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Negative Flow** | Non-verbatim quote in baseline | *(Leader Revert)* | `REVERTED` | Leader Error | 29.51s | Revert decoded: *"The supplied quote was not found verbatim in the baseline revision text."* |
| **`register_citation`** | Alan Turing (`oldid 1379625434`) | `0xfb4bd93fe48ce0ef8208757290929ccdf2da92677fd37f0f901a4500ffc9fc99` | `FINALIZED` | 3/5 agree | 15.78s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xfb4bd93fe48ce0ef8208757290929ccdf2da92677fd37f0f901a4500ffc9fc99) |
| **`audit_citation`** | Target revision `oldid 1380390650` | `0x035d2cd00db4c43692aa3e644d8b717a258b67dd170125e5801fb2cf592d537c` | `FINALIZED` | 3/5 agree | 17.22s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x035d2cd00db4c43692aa3e644d8b717a258b67dd170125e5801fb2cf592d537c) |
| **`publish_claim`** | ClaimsBoard assertion for citation | `0x43641a24977f30707f8f020496de8a155b312a79b65051187ddefa7f49f4c56a` | `FINALIZED` | 3/5 agree | 9.35s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x43641a24977f30707f8f020496de8a155b312a79b65051187ddefa7f49f4c56a) |
| **`refresh_claim`** | Synchronize badge from ledger | `0xa24e9006b982c012323f8e22c6b960a8a8265e5ec69eb972a67f873df9a5708f` | `ACCEPTED` | 3/5 agree | 9.09s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xa24e9006b982c012323f8e22c6b960a8a8265e5ec69eb972a67f873df9a5708f) |

### Readback Verification

- **Citation ID**: `ef59e81d5e56`
- **Article Title**: `Alan Turing`
- **Baseline Oldid**: `1379625434`
- **Audit #1 Verdict**: `UNCHANGED` (verbatim match across revisions, deterministic SAME layer)
- **Claim ID**: `56d9663a46e2`
- **Claim Badge**: `VERIFIED`

---

## Screenshot Evidence Gallery

Captured during the automated production run and stored in `docs/screens/`:

| Step / View | File | Description |
| :--- | :--- | :--- |
| **Mobile 390px Viewport** | [`docs/screens/01_landing_mobile_390.png`](docs/screens/01_landing_mobile_390.png) | Landing page layout at 390px with zero horizontal scroll overflow. |
| **Desktop 1280px Landing** | [`docs/screens/02_landing_desktop_1280.png`](docs/screens/02_landing_desktop_1280.png) | Hero typewriter completed, sans-serif blue typography. |
| **Negative Revert Modal** | [`docs/screens/03_negative_revert_modal.png`](docs/screens/03_negative_revert_modal.png) | Decoded revert: quote not found verbatim in baseline text. |
| **Registration Confirmed** | [`docs/screens/04_registration_accepted_modal.png`](docs/screens/04_registration_accepted_modal.png) | Consensus pipeline modal showing acceptance by validators. |
| **Citation Detail Readback** | [`docs/screens/05_citation_detail_readback.png`](docs/screens/05_citation_detail_readback.png) | Full on-chain readback of title, oldid, and registered quote. |
| **Audit Accepted Modal** | [`docs/screens/06_audit_accepted_modal.png`](docs/screens/06_audit_accepted_modal.png) | Audit transaction accepted by validators in 17.22s. |
| **Audit Verdict Detail** | [`docs/screens/07_audit_verdict_detail.png`](docs/screens/07_audit_verdict_detail.png) | Detail tab displaying recorded `Audit #1` with verdict `UNCHANGED`. |
| **Publish Claim Modal** | [`docs/screens/08_publish_claim_modal.png`](docs/screens/08_publish_claim_modal.png) | ClaimsBoard assertion published on-chain. |
| **Refresh Claim Modal** | [`docs/screens/09_refresh_claim_modal.png`](docs/screens/09_refresh_claim_modal.png) | Badge refresh cross-contract call accepted on-chain. |
| **Admin Controls** | [`docs/screens/10_admin_controls.png`](docs/screens/10_admin_controls.png) | Admin & Ledger tab with contract owner verification. |
| **Honest Evidence Tab** | [`docs/screens/11_workbench_evidence_tab.png`](docs/screens/11_workbench_evidence_tab.png) | In-app honest evidence breakdown and unit-test disclosures. |

---

## Honest Evidence Disclosure

- **Observed On-Chain**:
  - `UNCHANGED / SAME`: Verified on-chain via revision audit (Alan Turing oldid `1379625434` to `1380390650`).
  - `COSMETIC / REPHRASED`: Observed in earlier v1.1.0/v1.2.0 verification runs.
  - `MATERIAL / CHANGED`: Observed in earlier v1.2.0 verification runs.
  - `REVERTED`: Observed and decoded on-chain via negative non-verbatim quote flow.
- **Unit-Tested Only**:
  - `REMOVED / ABSENT`: Documented as unit-tested only and not yet observed on-chain, as Wikipedia content removal requires specific test articles.

---

## Superseded Contracts (v1.0.0 & v1.1.0)

> [!NOTE]
> The following historical contract addresses are superseded and kept here for audit continuity only. They do not appear in any active code or scripts:

| Version | Contract | Address |
| :--- | :--- | :--- |
| v1.0.0 | SourceDriftLedger | `0x0d24CC10b5396C718c019E239c90c7eE6b17BE57` |
| v1.0.0 | ClaimsBoard | `0x76Ef8E906c8Fec113c4Db846e60196E58e6B818D` |
| v1.1.0 | SourceDriftLedger | `0xc6a8Cfdbbb4CA98637053A0c8529686Ff4C41CaD` |
| v1.1.0 | ClaimsBoard | `0xfc454d601DC5300ECf8458610cB1580c9640bE32` |
| Probe v1.1.0 | Probe (nondet probe) | `0x89D9153a738c83e29fF4e0050810793664C9392e` |
| Probe v1.2.0 | Probe2 (exec_prompt) | `0x1f0F2FeFFC7b1F275F36a281e285aE7Ff900bF5C` |
| Probe v1.2.0 | Probe2 (re-deployed) | `0x2B9d921312384a26127117e335eA241F8C9d123b` |

---

## Local Verification Suite

```bash
# Run comprehensive 8-step verification suite
npm run check
```

Checks included in `npm run check`:
1. `check:reference`: Source sha256 byte-for-byte check against canonical reference contracts.
2. `build`: TypeScript compilation (`tsc -b`) and Vite production bundling.
3. `test`: 37 Vitest unit tests including full revert map coverage.
4. `scan:ascii`: Scans for unexpected non-ASCII characters in source code.
5. `scan:banned`: Strict regex scan for prohibited terminology.
6. `scan:secrets`: Scan for private keys or sensitive variables.
7. `check:address`: Validates superseded addresses appear only in README.md.
8. `verify:bundle`: Asserts production bundle references only active v1.2.0 contracts.
