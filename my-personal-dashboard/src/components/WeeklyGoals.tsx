"use client";

import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { loadWeeklyGoals, saveWeeklyGoals } from "@/lib/storage";
import { WeeklyGoalsState } from "@/types";

export default function WeeklyGoals() {
  const [state, setState] = useState<WeeklyGoalsState | null>(null);

  useEffect(() => {
    setState(loadWeeklyGoals());
  }, []);

  function update(next: WeeklyGoalsState) {
    setState(next);
    saveWeeklyGoals(next);
  }

  function handleToggle(id: string) {
    if (!state) return;
    update({
      ...state,
      goals: state.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    });
  }

  function handleTextChange(id: string, text: string) {
    if (!state) return;
    update({
      ...state,
      goals: state.goals.map((g) => (g.id === id ? { ...g, text } : g)),
    });
  }

  if (!state) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center">
          <Target size={18} />
        </div>
        <div>
          <h2 className="font-semibold">Weekly Goals</h2>
          <p className="text-xs text-gray-500">Resets every Monday</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {state.goals.map((goal, i) => (
          <div key={goal.id} className="flex items-center gap-3 bg-[#1c1c1c] rounded-xl px-3 py-2.5">
            <button
              onClick={() => handleToggle(goal.id)}
              aria-label={goal.done ? "Mark goal incomplete" : "Mark goal complete"}
              className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-colors ${
                goal.done ? "bg-[#d4af37] border-[#d4af37]" : "border-border"
              }`}
            >
              {goal.done && <span className="w-2.5 h-2.5 rounded-sm bg-black" />}
            </button>
            <input
              type="text"
              value={goal.text}
              onChange={(e) => handleTextChange(goal.id, e.target.value)}
              placeholder={`Goal ${i + 1} — e.g. "Save €50"`}
              className={`flex-1 bg-transparent text-sm focus:outline-none ${
                goal.done ? "text-gray-500 line-through" : "text-white"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
