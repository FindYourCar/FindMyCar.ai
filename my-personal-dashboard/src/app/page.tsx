"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { DEFAULT_FINANCIAL_PROFILE, loadFinancialProfile, loadTasks, loadTransactions } from "@/lib/storage";
import { FinancialProfile, Task, Transaction } from "@/types";
import { CATEGORY_COLORS, formatCurrency, formatDate, getGreeting, isIncome } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import SummaryCard from "@/components/SummaryCard";
import SpendingPieChart from "@/components/SpendingPieChart";
import MorningBriefing from "@/components/MorningBriefing";
import PomodoroTimer from "@/components/PomodoroTimer";
import WeeklyGoals from "@/components/WeeklyGoals";
import Link from "next/link";

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_FINANCIAL_PROFILE);
  const [greeting, setGreeting] = useState("Hello");
  const { currency } = useCurrency();

  useEffect(() => {
    setTransactions(loadTransactions());
    setTasks(loadTasks());
    setProfile(loadFinancialProfile());
    setGreeting(getGreeting());
  }, []);

  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const stats = useMemo(() => {
    let transactionsTotal = 0;
    let monthlyExpenses = 0;

    for (const t of transactions) {
      const d = new Date(t.date + "T00:00:00");
      const signed = isIncome(t) ? t.amount : -t.amount;
      transactionsTotal += signed;

      if (
        !isIncome(t) &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      ) {
        monthlyExpenses += t.amount;
      }
    }

    const totalBalance = profile.currentBalance + transactionsTotal;
    const monthlyIncome = profile.monthlyIncome;
    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100
        : 0;

    return { totalBalance, monthlyIncome, monthlyExpenses, savingsRate };
  }, [transactions, currentMonth, currentYear, profile]);

  const pieData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of transactions) {
      const d = new Date(t.date + "T00:00:00");
      if (
        isIncome(t) ||
        d.getMonth() !== currentMonth ||
        d.getFullYear() !== currentYear
      )
        continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(totals.entries()).map(([category, value]) => ({
      category,
      value,
    }));
  }, [transactions, currentMonth, currentYear]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);
  }, [transactions]);

  const taskSummary = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{greeting}, Mykhailo</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Here&apos;s what&apos;s happening with your finances and tasks today.
        </p>
      </div>

      <MorningBriefing tasks={tasks} totalBalance={stats.totalBalance} currency={currency} now={now} />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Balance"
          value={formatCurrency(stats.totalBalance, currency)}
          icon={Wallet}
          accent="blue"
        />
        <SummaryCard
          label="Monthly Income"
          value={formatCurrency(stats.monthlyIncome, currency)}
          icon={TrendingUp}
          accent="green"
        />
        <SummaryCard
          label="Monthly Expenses"
          value={formatCurrency(stats.monthlyExpenses, currency)}
          icon={TrendingDown}
          accent="default"
        />
        <SummaryCard
          label="Savings Rate"
          value={`${stats.savingsRate.toFixed(1)}%`}
          icon={PiggyBank}
          accent="purple"
        />
      </div>

      {/* Productivity widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PomodoroTimer />
        <WeeklyGoals />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-2">Monthly Spending</h2>
          <SpendingPieChart data={pieData} currency={currency} />
        </div>

        {/* Task summary */}
        <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Task Summary</h2>
            <Link href="/tasks" className="text-xs text-purple-400 hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-[#1c1c1c] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <Circle size={18} className="text-gray-400" />
                <span className="text-sm">Pending</span>
              </div>
              <span className="text-lg font-semibold">{taskSummary.pending}</span>
            </div>
            <div className="flex items-center justify-between bg-[#1c1c1c] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="text-purple-400" />
                <span className="text-sm">In Progress</span>
              </div>
              <span className="text-lg font-semibold">{taskSummary.inProgress}</span>
            </div>
            <div className="flex items-center justify-between bg-[#1c1c1c] rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span className="text-sm">Completed</span>
              </div>
              <span className="text-lg font-semibold">{taskSummary.done}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent Transactions</h2>
          <Link href="/budget" className="text-xs text-blue-400 hover:underline">
            View all
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No transactions yet</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {recentTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[t.category] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-gray-500">
                      {t.category} &middot; {formatDate(t.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    isIncome(t) ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isIncome(t) ? "+" : "-"}
                  {formatCurrency(t.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
