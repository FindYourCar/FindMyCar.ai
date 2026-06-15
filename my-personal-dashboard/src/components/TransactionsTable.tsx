"use client";

import { Transaction } from "@/types";
import { CATEGORY_COLORS, formatCurrency, formatDate, isIncome } from "@/lib/utils";
import { Currency } from "@/lib/currency";

interface TransactionsTableProps {
  transactions: Transaction[];
  currency?: Currency;
}

export default function TransactionsTable({ transactions, currency = "EUR" }: TransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        No transactions match your filters
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-left text-gray-500 border-b border-border">
            <th className="font-medium py-2 px-5">Date</th>
            <th className="font-medium py-2 px-5">Description</th>
            <th className="font-medium py-2 px-5">Category</th>
            <th className="font-medium py-2 px-5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((t) => (
            <tr key={t.id} className="hover:bg-[#1a1a1a]">
              <td className="py-3 px-5 text-gray-400 whitespace-nowrap">{formatDate(t.date)}</td>
              <td className="py-3 px-5">{t.description}</td>
              <td className="py-3 px-5">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `${CATEGORY_COLORS[t.category]}22`,
                    color: CATEGORY_COLORS[t.category],
                  }}
                >
                  {t.category}
                </span>
              </td>
              <td
                className={`py-3 px-5 text-right font-semibold whitespace-nowrap ${
                  isIncome(t) ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isIncome(t) ? "+" : "-"}
                {formatCurrency(t.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
