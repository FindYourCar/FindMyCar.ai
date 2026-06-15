import { TaskPriority, Transaction, TransactionCategory } from "@/types";
import { Currency, CURRENCY_RATES, CURRENCY_SYMBOLS } from "@/lib/currencyConfig";

/**
 * Amounts are stored internally in EUR. Converts to the given display
 * currency and formats with the appropriate symbol.
 */
export function formatCurrency(amount: number, currency: Currency = "EUR"): string {
  const converted = amount * CURRENCY_RATES[currency];
  const formatted = converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${CURRENCY_SYMBOLS[currency]}${formatted}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isIncome(transaction: Transaction): boolean {
  return transaction.type === "income";
}

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  Food: "#f59e0b",
  Transport: "#06b6d4",
  University: "#8b5cf6",
  Entertainment: "#ec4899",
  Shopping: "#f97316",
  Rent: "#ef4444",
  Other: "#94a3b8",
  Salary: "#22c55e",
  Freelance: "#10b981",
  Investment: "#14b8a6",
  Gift: "#84cc16",
  "Other Income": "#4ade80",
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  Low: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  Medium: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  High: { bg: "bg-orange-500/15", text: "text-orange-400" },
  Urgent: { bg: "bg-red-500/15", text: "text-red-400" },
};

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
