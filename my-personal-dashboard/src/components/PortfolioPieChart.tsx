"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ASSET_TYPE_COLORS } from "@/lib/portfolio";
import { Currency } from "@/lib/currency";
import { AssetType } from "@/types";

interface PortfolioPieChartProps {
  data: { assetType: AssetType; value: number }[];
  currency?: Currency;
}

export default function PortfolioPieChart({ data, currency = "EUR" }: PortfolioPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 text-sm">
        No holdings yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="assetType"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((entry) => (
            <Cell key={entry.assetType} fill={ASSET_TYPE_COLORS[entry.assetType]} stroke="#0d0d0d" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatCurrency(Number(value), currency)}
          contentStyle={{
            backgroundColor: "#161616",
            border: "1px solid #262626",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
