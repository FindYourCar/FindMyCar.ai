import { BudgetGroup } from "@/lib/cfo";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/currency";

interface BudgetSplitProps {
  groups: BudgetGroup[];
  currency: Currency;
}

export default function BudgetSplit({ groups, currency }: BudgetSplitProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <h2 className="font-semibold mb-1">Recommended Budget Split</h2>
      <p className="text-xs text-gray-500 mb-4">
        Based on the 50/30/20 rule applied to your monthly income.
      </p>
      <div className="flex flex-col gap-5">
        {groups.map((group) => {
          const isSavings = group.label.startsWith("Savings");
          const overBudget = isSavings
            ? group.actual < group.recommended
            : group.actual > group.recommended;
          const barColor = overBudget ? "bg-red-500" : "bg-emerald-500";
          const pct =
            group.recommended > 0
              ? Math.min(150, (group.actual / group.recommended) * 100)
              : group.actual > 0
              ? 150
              : 0;

          return (
            <div key={group.label}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="font-medium">
                  {group.label}{" "}
                  <span className="text-gray-500 text-xs">({group.recommendedPct}% recommended)</span>
                </span>
                <span className={overBudget ? "text-red-400" : "text-emerald-400"}>
                  {formatCurrency(group.actual, currency)} / {formatCurrency(group.recommended, currency)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#1c1c1c] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${Math.max(2, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
