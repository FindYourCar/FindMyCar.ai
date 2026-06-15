"use client";

import { CURRENCIES, CURRENCY_LABELS, Currency, useCurrency } from "@/lib/currency";

export default function CurrencySwitcher({ className = "" }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as Currency)}
      aria-label="Currency"
      className={`bg-[#1c1c1c] border border-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_LABELS[c]}
        </option>
      ))}
    </select>
  );
}
