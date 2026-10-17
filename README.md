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

## E2E Evidence Integrity Fix Pass & Root Cause Analysis

This pass addresses and resolves the 3 audit integrity findings:

### 1. Root Cause Analysis & Code Fixes
- **Root Cause 1 (`registrantMatchesAccount` was FALSE)**:
  - In `src/pages/Workbench.tsx:51`, `selectedCitationId` defaulted to `"bbee352df865"`.
  - In `src/pages/Workbench.tsx:192-219`, `loadCitationDetails` did not clear `citationData` before async fetch. The DOM retained the registrant of `bbee352df865` (`0x56415851C3dDc1232807522198fA6Fb07f78A95A`) while fetching, causing readback extraction to capture the previous citation's registrant instead of the runner account.
  - In `src/services/contractService.ts:428-447`, `registerCitationFlow` fell back to `listCitationIds(0, 1)`.
  - **Fix**: Cleared hardcoded dummy default IDs (`""`), added `setCitationData(null)` on load start to clear stale state, enforced strict account matching (`record.registrant.toLowerCase() === account.address.toLowerCase()`), and verified against the contract's deterministic ID derivation (`sha256(sender|url|rfp|nonce)[:12]`).
- **Root Cause 2 (`publish_claim`/`refresh_claim` reported stale claim `56d9663a46e2`)**:
  - In `src/pages/Workbench.tsx:78`, `selectedClaimId` defaulted to `"56d9663a46e2"`.
  - In `src/services/contractService.ts:547-556`, `publishClaimFlow` fell back to `listClaimIds(0, 1)`, returning historical claim `56d9663a46e2` (which belonged to citation `a68c69aa9a4d`).
  - **Fix**: Cleared default claim ID, bound `claimCitationId` directly from the registered citation upon success, took pre-run snapshots of `list_claim_ids`, and asserted that the discovered claim ID was brand new, its `citation_id` strictly equaled this run's citation, and its `publisher` strictly equaled the runner account.
- **Root Cause 3 (Receipt status, validator votes, and revert transparency)**:
  - Updated evidence generation and documentation to record exact on-chain receipt statuses (`ACCEPTED` / `FINALIZED`), agree/total validator counts (`3/5`), latencies, and detailed explanation of leader simulation revert (no on-chain tx hash is emitted because revert occurs in the leader VM pre-consensus).

### 2. Failing Assertion Proof on Historical Data
The script `scripts/verify_assertions_old_evidence.mjs` was executed to verify that the strict integrity assertions fail against the historical commit `9ac126f` data:
```bash
node scripts/verify_assertions_old_evidence.mjs
# Output:
# [ASSERTION 1] Check: citation registrant === runner account -> ❌ FAILED (0x5641... != 0xcCDb...)
# [ASSERTION 2] Check: claimId !== '56d9663a46e2' -> ❌ FAILED (reported identical historical claim)
# [ASSERTION 3] Check: claim.citation_id === this run's citationId -> ❌ FAILED (bound to a68c69aa9a4d)
# [ASSERTION 4] Check: claim.publisher === runner account -> ❌ FAILED (publisher 0x5641... != 0xcCDb...)
# PROOF COMPLETE: 4 OF 4 INTEGRITY ASSERTIONS FAILED ON OLD DATA.
```

---

## Live On-Chain E2E Execution Evidence

Executed on **GenLayer Studionet (Preview)** through the production dApp UI (`https://citation-watch-app-genlayer.vercel.app`) using fresh throwaway runner account `0xAae33E1CBDa6d9511C278a5289Ab37A7FCc548BB`:

| Operation | Target / Input | Tx Hash | Receipt Status | Final Status | Validator Votes | Latency | Explorer Link |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Negative Flow** | Non-verbatim quote in baseline | *(Leader Revert)* | `REVERTED` | `REVERTED` | Leader Error | 27.35s | Revert decoded: *"The supplied quote was not found verbatim in the baseline revision text."* |
| **`register_citation`** | Claude Shannon (`oldid 1378873158`, quote: *"From 1956 to 1978, he was a professor at MIT."*) | [`0x22d54b28912b891d0f0bfd200394bf51cff7741a10812f493999a4f601f09d99`](https://explorer-studio.genlayer.com/tx/0x22d54b28912b891d0f0bfd200394bf51cff7741a10812f493999a4f601f09d99) | `ACCEPTED` | `FINALIZED` | 3/5 agree | 44.18s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x22d54b28912b891d0f0bfd200394bf51cff7741a10812f493999a4f601f09d99) |
| **`audit_citation` #1** | Target revision `oldid 1379693800` | [`0xaf274d3d224bc403ebede8f9d554c3192a8b36eaa879a44811fd7c42d86d13f5`](https://explorer-studio.genlayer.com/tx/0xaf274d3d224bc403ebede8f9d554c3192a8b36eaa879a44811fd7c42d86d13f5) | `ACCEPTED` | `FINALIZED` | 3/5 agree | 17.24s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0xaf274d3d224bc403ebede8f9d554c3192a8b36eaa879a44811fd7c42d86d13f5) |
| **`audit_citation` #2** | Live page `https://en.wikipedia.org/wiki/Claude_Shannon` | [`0x2d50850899235603b699c102f554f1f0a8d181f6abe8924baa547b506c9f7acd`](https://explorer-studio.genlayer.com/tx/0x2d50850899235603b699c102f554f1f0a8d181f6abe8924baa547b506c9f7acd) | `ACCEPTED` | `FINALIZED` | 3/5 agree | 17.11s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x2d50850899235603b699c102f554f1f0a8d181f6abe8924baa547b506c9f7acd) |
| **`publish_claim`** | ClaimsBoard assertion for citation `fcca1095abb0` | [`0x7a4bec5982666e4678c98db63c6d0bcec78f2f04471396de9aa877821f2a8509`](https://explorer-studio.genlayer.com/tx/0x7a4bec5982666e4678c98db63c6d0bcec78f2f04471396de9aa877821f2a8509) | `ACCEPTED` | `FINALIZED` | 3/5 agree | 10.53s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x7a4bec5982666e4678c98db63c6d0bcec78f2f04471396de9aa877821f2a8509) |
| **`refresh_claim`** | Synchronize badge from ledger for claim `d8e56d644113` | [`0x67a0e552f7ce67fbb95c0d2348287e4ebab0ad1a6237eaee1892775361cbcf1b`](https://explorer-studio.genlayer.com/tx/0x67a0e552f7ce67fbb95c0d2348287e4ebab0ad1a6237eaee1892775361cbcf1b) | `ACCEPTED` | `FINALIZED` | 3/5 agree | 12.60s | [View on Explorer](https://explorer-studio.genlayer.com/tx/0x67a0e552f7ce67fbb95c0d2348287e4ebab0ad1a6237eaee1892775361cbcf1b) |

### Readback & Integrity Verification Results

- **Runner Account**: `0xAae33E1CBDa6d9511C278a5289Ab37A7FCc548BB`
- **Citation ID**: `fcca1095abb0` (brand new on-chain ID)
- **Article Title**: `Claude Shannon`
- **Baseline Oldid**: `1378873158`
- **Registrant Address**: `0xAae33E1CBDa6d9511C278a5289Ab37A7FCc548BB` (`registrantMatchesAccount: true`)
- **Deterministic ID Match**: `true` (`sha256(sender|url|rfp|15)[:12]` equals `fcca1095abb0`)
- **Audit #1 Verdict**: `UNCHANGED` (revision `1379693800`, deterministic SAME layer)
- **Audit #2 Verdict**: `UNCHANGED` (live Wikipedia page `Claude_Shannon`, consensus without live fingerprint)
- **Claim ID**: `d8e56d644113` (brand new ID, distinct from historical `56d9663a46e2`)
- **Claim Citation ID**: `fcca1095abb0` (strictly bound to this run's citation)
- **Claim Publisher**: `0xAae33E1CBDa6d9511C278a5289Ab37A7FCc548BB` (strictly matches runner)
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
