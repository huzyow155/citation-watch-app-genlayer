import { studionet } from "genlayer-js/chains";

export const NETWORK_NAME = "GenLayer Studionet";
export const NETWORK_STATUS = "GenLayer Studionet (Preview)";
export const CHAIN_ID = 61999;
export const RPC_URL = "https://studio.genlayer.com/api";
export const EXPLORER_BASE = "https://explorer-studio.genlayer.com";

// Active contracts (v1.2.0)
export const SOURCE_DRIFT_LEDGER_ADDRESS = "0xFC7593432D4e8A2ceda911497807E4aCC7c7B705" as const;
export const CLAIMS_BOARD_ADDRESS = "0x057fA33Ed3508AAe0051d72e81dD6B0Ba52009aD" as const;

export const SOURCE_DRIFT_LEDGER_SHA256 = "d5598c5e118d8411e87ef03f637950dc147799c94167ab8b0a70dd19c2215c8a";
export const CLAIMS_BOARD_SHA256 = "4ee7d485bcaf7505514377abfea8f05eb3286447c13752df2847a3de7d0e8569";

export const CONTRACT_REPO_URL = "https://github.com/huzyow155/citation-watch-genlayer";
export const APP_REPO_URL = "https://github.com/huzyow155/citation-watch-app-genlayer";

export const GENLAYER_CHAIN = studionet;

export const WALLET_DISCLAIMER = "Studionet-only throwaway key. Preview network, no real value.";

// Seeded active on-chain citations for quick access in UI Explore
export const SEEDED_CITATIONS = [
  {
    id: "bbee352df86551b9e26e2552b757e7959089f6fd1d74620aaae057d3637ca8d9",
    name: "Alan Turing (Wikipedia)",
    class: "SAME",
    status: "SAME (Verified On-Chain)",
    target: "Target rev 1258759530",
  },
  {
    id: "4f3305759701d00922e9603cf453bca51b038c116c278a56c071a93324c4897f",
    name: "History of Computing Hardware",
    class: "COSMETIC",
    status: "COSMETIC (Verified On-Chain)",
    target: "Target rev 1258760000",
  },
  {
    id: "59a2e370301f280c4fa61fe04130f142b7194f4848523c0490f2b3e83921e42d",
    name: "Python Programming Language",
    class: "MATERIAL",
    status: "MATERIAL (Verified On-Chain)",
    target: "Target rev 1258761000",
  },
  {
    id: "a68c69aa9a4d8fa2a632616bcaad63d3fc291fc22d1ce2b9fcba3feaa81938b8",
    name: "State Transition Model (SAME -> COSMETIC)",
    class: "TRANSITION",
    status: "Transition Verified On-Chain",
    target: "Sequential Revisions",
  },
  {
    id: "4339810e1be92d5c36f2cb7c9925e01cb6b01b637d4040f13f1e944d1ea0eec4",
    name: "Charles Babbage Analytical Engine",
    class: "SAME",
    status: "SAME (Verified On-Chain)",
    target: "Baseline Verification",
  },
];

export const SEEDED_CLAIMS = [
  {
    id: "56d9663a46e2b694c9f7a77fcf96f8c2b535d25cb5111b7d59837d3838a16dbb",
    name: "Alan Turing Father of Theoretical Computer Science",
    citationId: "bbee352df86551b9e26e2552b757e7959089f6fd1d74620aaae057d3637ca8d9",
    target: "Consumer dApp Evidence Badge",
  },
];

export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_BASE}/address/${address}`;

export const getExplorerTxUrl = (txHash: string) =>
  `${EXPLORER_BASE}/tx/${txHash}`;
