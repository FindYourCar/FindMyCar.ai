"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_FINANCIAL_PROFILE,
  loadFinancialProfile,
  loadTasks,
  loadTransactions,
} from "@/lib/storage";
import { FinancialProfile, Task, Transaction } from "@/types";
import { useCurrency } from "@/lib/currency";
import {
  calculateHealthScore,
  generateInsights,
  getBudgetSplit,
  getMonthTotals,
  getTipOfTheDay,
} from "@/lib/cfo";
import TipOfTheDay from "@/components/cfo/TipOfTheDay";
import HealthScoreCard from "@/components/cfo/HealthScoreCard";
import InsightsSection from "@/components/cfo/InsightsSection";
import InvestmentIdeas from "@/components/cfo/InvestmentIdeas";
import BudgetSplit from "@/components/cfo/BudgetSplit";
import CfoChat from "@/components/cfo/CfoChat";

export default function CfoPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_FINANCIAL_PROFILE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { currency } = useCurrency();

  useEffect(() => {
    setTransactions(loadTransactions());
    setProfile(loadFinancialProfile());
    setTasks(loadTasks());
  }, []);

  const now = useMemo(() => new Date(), []);
  const tip = useMemo(() => getTipOfTheDay(now), [now]);

  const currentTotals = useMemo(
    () => getMonthTotals(transactions, now.getFullYear(), now.getMonth()),
    [transactions, now]
  );

  const healthScore = useMemo(
    () => calculateHealthScore(profile, currentTotals),
    [profile, currentTotals]
  );

  const insights = useMemo(
    () => generateInsights(transactions, profile, now, currency),
    [transactions, profile, now, currency]
  );

  const budgetGroups = useMemo(
    () => getBudgetSplit(transactions, profile, now),
    [transactions, profile, now]
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">AI CFO</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Your personal finance copilot — insights, scores, and recommendations.
        </p>
      </div>

      <TipOfTheDay tip={tip} />

      <HealthScoreCard score={healthScore.score} label={healthScore.label} />

      <InsightsSection insights={insights} />

      <BudgetSplit groups={budgetGroups} currency={currency} />

      <InvestmentIdeas />

      <CfoChat transactions={transactions} profile={profile} tasks={tasks} currency={currency} />
    </div>
  );
}
