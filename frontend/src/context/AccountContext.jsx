import { createContext, useContext, useEffect, useState } from "react";

const AccountContext = createContext();

const STORAGE_KEY = "selectedAccountKey";

export function AccountProvider({ children }) {
  const [selectedAccountKey, setSelectedAccountKey] = useState("");

  // 🔥 Load from localStorage on app start
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSelectedAccountKey(stored);
    }
  }, []);

  // 🔥 Persist whenever it changes
  useEffect(() => {
    if (selectedAccountKey) {
      localStorage.setItem(STORAGE_KEY, selectedAccountKey);
    }
  }, [selectedAccountKey]);

  return (
    <AccountContext.Provider
      value={{ selectedAccountKey, setSelectedAccountKey }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}