"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Task } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Currency } from "@/lib/currency";
import { getTipOfTheDay } from "@/lib/cfo";

const MORNING_BRIEFING_DISMISSED_KEY = "morning_briefing_dismissed";

interface MorningBriefingProps {
  tasks: Task[];
  totalBalance: number;
  currency: Currency;
  now: Date;
}

const PRIORITY_RANK: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function MorningBriefing({ tasks, totalBalance, currency, now }: MorningBriefingProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const today = dateOnly(now);
    const lastDismissed = window.localStorage.getItem(MORNING_BRIEFING_DISMISSED_KEY);
    setDismissed(lastDismissed === today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDismiss() {
    window.localStorage.setItem(MORNING_BRIEFING_DISMISSED_KEY, dateOnly(now));
    setDismissed(true);
  }

  if (dismissed) return null;

  const pending = tasks.filter((t) => t.status !== "done");
  const topTask = [...pending].sort(
    (a, b) => (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0)
  )[0];

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tip = getTipOfTheDay(now);

  return (
    <div className="bg-surface border border-[#d4af37]/30 rounded-2xl p-5 flex flex-col gap-3 relative">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss morning briefing"
        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-[#262626] hover:text-white transition-colors"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center">
          <Sparkles size={18} />
        </div>
        <div>
          <h2 className="font-semibold">Good morning, Mykhailo</h2>
          <p className="text-xs text-gray-500">{dateLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Total Balance</p>
          <p className="text-lg font-semibold mt-1">{formatCurrency(totalBalance, currency)}</p>
        </div>
        <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">Top Task</p>
          <p className="text-sm font-medium mt-1 truncate">
            {topTask ? topTask.title : "No pending tasks — nice work!"}
          </p>
        </div>
      </div>

      <div className="bg-[#1c1c1c] rounded-xl px-4 py-3">
        <p className="text-xs text-[#d4af37] font-medium mb-1">Tip of the Day</p>
        <p className="text-sm text-gray-300">{tip}</p>
      </div>
    </div>
  );
}
