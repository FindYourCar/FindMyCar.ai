"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Currency, CURRENCY_RATES, CURRENCY_SYMBOLS } from "@/lib/currency";

interface IncomeExpenseBarChartProps {
  data: { month: string; income: number; expenses: number }[];
  currency?: Currency;
}

export default function IncomeExpenseBarChart({ data, currency = "EUR" }: IncomeExpenseBarChartProps) {
  const rate = CURRENCY_RATES[currency];
  const converted = data.map((d) => ({
    month: d.month,
    income: d.income * rate,
    expenses: d.expenses * rate,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={converted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#9ca3af"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${CURRENCY_SYMBOLS[currency]}${v}`}
        />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value) / rate, currency)}
          contentStyle={{
            backgroundColor: "#161616",
            border: "1px solid #262626",
            borderRadius: 8,
            color: "#fff",
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
