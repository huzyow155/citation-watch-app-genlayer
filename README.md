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

## Method to UI Caller Proof Table

Every `@gl.public.write` method in both contracts is wired to an interactive UI caller:

| Contract | Public Write Method | UI Component / Caller | File & Line | Description |
| :--- | :--- | :--- | :--- | :--- |
| `SourceDriftLedger` | `register_citation` | `registerCitation` | `src/pages/Workbench.tsx:112` | Submits new citation baseline, oldid, and claims. |
| `SourceDriftLedger` | `audit_citation_revision` | `auditCitationRevision` | `src/pages/Workbench.tsx:135` | Audits baseline against a subsequent revision oldid. |
| `SourceDriftLedger` | `audit_citation_live` | `auditCitationLive` | `src/pages/Workbench.tsx:149` | Audits baseline against current LIVE article (300s cooldown). |
| `ClaimsBoard` | `publish_claim` | `publishClaim` | `src/pages/Workbench.tsx:163` | Publishes assertion linked to citation ID. |
| `ClaimsBoard` | `refresh_claim` | `refreshClaim` | `src/pages/Workbench.tsx:177` | Refreshes claim badge with latest ledger audit. |
| `ClaimsBoard` | `set_ledger` | `setLedger` | `src/pages/Workbench.tsx:191` | Admin updates linked SourceDriftLedger address. |

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

## Local Development & Verification

```bash
# Install dependencies
npm install

# Run comprehensive verification suite
npm run check
```
