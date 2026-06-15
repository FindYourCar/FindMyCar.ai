// Pure currency constants and types — NO "use client" so this module can be
// safely imported by server code (e.g. the /api/chat route handler via
// lib/utils). The React context/provider/hook live in lib/currency.tsx, which
// re-exports everything here for client components.

export type Currency = "EUR" | "UAH";

export const CURRENCIES: Currency[] = ["EUR", "UAH"];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: "€",
  UAH: "₴",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: "Euro (€ EUR)",
  UAH: "Ukrainian Hryvnia (₴ UAH)",
};

// Amounts are stored internally in EUR. This is the EUR -> currency rate.
export const CURRENCY_RATES: Record<Currency, number> = {
  EUR: 1,
  UAH: 45,
};

export const PREFERRED_CURRENCY_KEY = "preferred_currency";
