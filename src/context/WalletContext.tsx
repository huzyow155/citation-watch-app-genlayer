import React, { createContext, useContext, useEffect, useState } from "react";
import { createAccount, generatePrivateKey } from "genlayer-js";
import { WALLET_DISCLAIMER } from "../config/chain";

interface WalletContextType {
  account: any | null;
  privateKey: string | null;
  address: string | null;
  resetWallet: () => void;
  importKey: (key: string) => boolean;
  disclaimer: string;
}

const STORAGE_KEY = "citation_watch_throwaway_key";

const WalletContext = createContext<WalletContextType>({
  account: null,
  privateKey: null,
  address: null,
  resetWallet: () => {},
  importKey: () => false,
  disclaimer: WALLET_DISCLAIMER,
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [account, setAccount] = useState<any | null>(null);

  const initAccountFromKey = (key: string) => {
    try {
      const formattedKey = (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
      const acc = createAccount(formattedKey);
      setAccount(acc);
      setPrivateKey(formattedKey);
      try {
        localStorage.setItem(STORAGE_KEY, formattedKey);
      } catch {
        // localStorage may fail in restricted/private modes
      }
      return true;
    } catch (err) {
      console.error("Failed to initialize account from key:", err);
      return false;
    }
  };

  const resetWallet = () => {
    try {
      const freshKey = generatePrivateKey();
      initAccountFromKey(freshKey);
    } catch (err) {
      console.error("Failed to generate fresh wallet:", err);
    }
  };

  const importKey = (key: string) => {
    return initAccountFromKey(key.trim());
  };

  useEffect(() => {
    let existingKey: string | null = null;
    try {
      existingKey = localStorage.getItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    if (existingKey) {
      initAccountFromKey(existingKey);
    } else {
      resetWallet();
    }
  }, []);

  const address = account?.address ? String(account.address) : null;

  return (
    <WalletContext.Provider
      value={{
        account,
        privateKey,
        address,
        resetWallet,
        importKey,
        disclaimer: WALLET_DISCLAIMER,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
