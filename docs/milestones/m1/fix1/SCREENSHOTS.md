# Milestone 1 - Revision 2 Evidence Screenshots

Production URL: `https://citation-watch-app-genlayer.vercel.app`  
Network: **GenLayer Studionet (Preview)** (Chain ID 61999)  
Revision Tag: `milestone-1-ux-onboarding-r2`  
Verified At: 2026-10-24  

---

## 1. Blocking Bug: Walkthrough Modal Viewport Matrix Comparison

Prior to Revision 2, testing the walkthrough dialog across viewport widths (320px, 360px, 390px, 414px, 500px, 768px, 1024px, 1440px), short heights (568px, 667px, 740px, 900px), landscape (667x375), and WCAG zoom reflow (200% and 400% zoom at 1280x800) failed **0 / 35** cells due to flex centering (`items-center`) overflowing into negative Y-coordinates (`bounding box Y: -227px to -305px`), clipping the title, close button, and Skip button above the viewport. Additionally, 320px viewports suffered horizontal body overflow.

Following the Revision 2 responsive redesign (`overflow-y-auto`, `justify-start`, `m-auto`, sticky header/footer with scrollable body, fluid clamp typography, and adaptive header navigation), **35 / 35 cells (100%)** now pass all visibility, boundary, and overflow assertions.

### Viewport Matrix Results (35 Cells)

| # | Viewport / Mode | Before Fix Result | After Fix Result | Top Header Visible | Close/Skip Visible | Next/Back Visible | No Horiz Overflow |
|---|---|---|---|---|---|---|---|
| 01 | 320 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes (320px <= 320px) |
| 02 | 320 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes (320px <= 320px) |
| 03 | 320 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes (320px <= 320px) |
| 04 | 320 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes (320px <= 320px) |
| 05 | 360 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 06 | 360 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 07 | 360 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 08 | 360 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 09 | 390 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 10 | 390 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 11 | 390 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 12 | 390 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 13 | 414 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 14 | 414 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 15 | 414 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 16 | 414 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 17 | 500 x 568 (Owner Review Bug) | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 18 | 500 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 19 | 500 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 20 | 500 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 21 | 768 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 22 | 768 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 23 | 768 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 24 | 768 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 25 | 1024 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 26 | 1024 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 27 | 1024 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 28 | 1024 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 29 | 1440 x 568 | FAIL (Y: -305px) | **PASS** | Yes | Yes | Yes | Yes |
| 30 | 1440 x 667 | FAIL (Y: -255px) | **PASS** | Yes | Yes | Yes | Yes |
| 31 | 1440 x 740 | FAIL (Y: -219px) | **PASS** | Yes | Yes | Yes | Yes |
| 32 | 1440 x 900 | FAIL (Y: -139px) | **PASS** | Yes | Yes | Yes | Yes |
| 33 | Landscape (667 x 375) | FAIL (Y: -402px) | **PASS** | Yes | Yes | Yes | Yes |
| 34 | Zoom 200% (640 x 400 CSS) | FAIL (Y: -389px) | **PASS** | Yes | Yes | Yes | Yes |
| 35 | Zoom 400% (320 x 200 CSS) | FAIL (Y: -489px) | **PASS** | Yes | Yes | Yes | Yes |

*Matrix captures stored in `docs/milestones/m1/fix1/before/` and `docs/milestones/m1/fix1/after/`.*

---

## 2. Production UI E2E Verified Lifecycle Screens

The live production execution (`docs/milestones/m1/fix1/e2e_production_evidence_r2.json`) performed all 4 write operations on GenLayer Studionet Preview with a fresh unfunded throwaway account (`0xf4780364D66D87368729b80A285E24084138203e`, 0 GEN balance consumed).

1. `01_tour_step_1.png`: Tour Step 1 auto-opened on initial landing.
2. `02_tour_final_step.png`: Tour Step 5 navigating to Workbench.
3. `03_registration_modal.png`: Consensus confirmation for `register_citation` (`0xdb3ebfb2092f203eb610c620b883d46682d9d3bc330205cc95929bca204a4050`).
4. `04_citation_detail_readback.png`: Detail view readback confirming `citationId: 8bf9a5e9e40b`, registrant `0xf478...203e`, oldid `1381327532`.
5. `05_audit_modal.png`: Consensus confirmation for `audit_citation` (`0x157c801d8b220ec37b2a32fed473c71a25f6f3574e84b3eeb9b49748e37bdc82`).
6. `06_audit_verdict_detail.png`: Detail view displaying Audit #1 verdict `UNCHANGED`.
7. `07_publish_claim_modal.png`: Consensus confirmation for `publish_claim` (`0x3e1493a782666f04f68b2c227816d2ede4ee89031df61bfab6a5bd22c45ce7b5`).
8. `08_refresh_claim_modal.png`: Consensus confirmation for `refresh_claim` (`0x506b8233a22cbaac917293961556b290cd5dd43a4ca23f39c2817522fe968936`).
9. `09_claims_board_verified.png`: Claims Board list showing live Claim `2fd94aacf982` with `VERIFIED` status badge.
