"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  Currency,
  CURRENCIES,
  CURRENCY_LABELS,
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  PREFERRED_CURRENCY_KEY,
} from "@/lib/currencyConfig";

// Re-export the pure constants/types so existing client imports from
// "@/lib/currency" keep working unchanged.
export type { Currency };
export {
  CURRENCIES,
  CURRENCY_LABELS,
  CURRENCY_RATES,
  CURRENCY_SYMBOLS,
  PREFERRED_CURRENCY_KEY,
};

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "EUR",
  setCurrency: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    const saved = window.localStorage.getItem(PREFERRED_CURRENCY_KEY);
    if (saved === "EUR" || saved === "UAH") setCurrencyState(saved);
  }, []);

  function setCurrency(next: Currency) {
    setCurrencyState(next);
    window.localStorage.setItem(PREFERRED_CURRENCY_KEY, next);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
