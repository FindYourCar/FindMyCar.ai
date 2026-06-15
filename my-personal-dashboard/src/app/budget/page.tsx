"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import {
  DEFAULT_FINANCIAL_PROFILE,
  loadFinancialProfile,
  loadTransactions,
  saveFinancialProfile,
  saveTransactions,
} from "@/lib/storage";
import { FinancialProfile, Transaction, TRANSACTION_CATEGORIES, TransactionCategory } from "@/types";
import { formatCurrency, isIncome } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import TransactionModal from "@/components/TransactionModal";
import TransactionsTable from "@/components/TransactionsTable";
import SpendingPieChart from "@/components/SpendingPieChart";
import IncomeExpenseBarChart from "@/components/IncomeExpenseBarChart";
import FinancialProfileModal from "@/components/FinancialProfileModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export default function BudgetPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<FinancialProfile>(DEFAULT_FINANCIAL_PROFILE);
  const [modalOpen, setModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<TransactionCategory | "all">("all");
  const { currency } = useCurrency();

  useEffect(() => {
    setTransactions(loadTransactions());
    setProfile(loadFinancialProfile());
  }, []);

  function handleAdd(transaction: Transaction) {
    const updated = [transaction, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  }

  function handleSaveProfile(next: FinancialProfile) {
    setProfile(next);
    saveFinancialProfile(next);
  }

  const now = useMemo(() => new Date(), []);
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const t of transactions) keys.add(monthKey(t.date));
    keys.add(currentKey);
    return Array.from(keys)
      .sort()
      .reverse()
      .map((key) => {
        const [year, month] = key.split("-").map(Number);
        return { key, label: `${MONTH_NAMES[month - 1]} ${year}` };
      });
  }, [transactions, currentKey]);

  // Current month summary (for the progress bar)
  const monthlySummary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (monthKey(t.date) !== currentKey) continue;
      if (isIncome(t)) income += t.amount;
      else expenses += t.amount;
    }
    return { income, expenses };
  }, [transactions, currentKey]);

  const progressPercent =
    monthlySummary.income > 0
      ? Math.min(100, (monthlySummary.expenses / monthlySummary.income) * 100)
      : monthlySummary.expenses > 0
      ? 100
      : 0;
  const overBudget = monthlySummary.expenses > monthlySummary.income;

  // Filtered transactions for table + pie chart
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => filterMonth === "all" || monthKey(t.date) === filterMonth)
      .filter((t) => filterCategory === "all" || t.category === filterCategory)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, filterMonth, filterCategory]);

  const pieData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of filteredTransactions) {
      if (isIncome(t)) continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(totals.entries()).map(([category, value]) => ({ category, value }));
  }, [filteredTransactions]);

  // Last 6 months income vs expenses
  const barData = useMemo(() => {
    const months: { key: string; month: string; income: number; expenses: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, month: MONTH_NAMES[d.getMonth()].slice(0, 3), income: 0, expenses: 0 });
    }
    for (const t of transactions) {
      const key = monthKey(t.date);
      const entry = months.find((m) => m.key === key);
      if (!entry) continue;
      if (isIncome(t)) entry.income += t.amount;
      else entry.expenses += t.amount;
    }
    return months.map(({ month, income, expenses }) => ({ month, income, expenses }));
  }, [transactions, now]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Budget Tracker</h1>
          <p className="text-gray-400 mt-1 text-sm">Manage your income and expenses</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 transition-colors text-white font-medium rounded-lg px-4 py-2.5 text-sm"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {/* Financial profile */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Financial Profile</h2>
          <button
            onClick={() => setProfileModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-border rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <Pencil size={12} />
            Edit Profile
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Current Balance</p>
            <p className="text-xl font-semibold mt-1">
              {formatCurrency(profile.currentBalance, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Monthly Income</p>
            <p className="text-xl font-semibold mt-1 text-emerald-400">
              {formatCurrency(profile.monthlyIncome, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Monthly Savings Goal</p>
            <p className="text-xl font-semibold mt-1 text-blue-400">
              {formatCurrency(profile.monthlySavingsGoal, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly summary bar */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-4">This Month</h2>
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div>
            <p className="text-xs text-gray-500">Income</p>
            <p className="text-xl font-semibold text-emerald-400">
              {formatCurrency(monthlySummary.income, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="text-xl font-semibold text-red-400">
              {formatCurrency(monthlySummary.expenses, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Remaining</p>
            <p className={`text-xl font-semibold ${overBudget ? "text-red-400" : "text-blue-400"}`}>
              {formatCurrency(monthlySummary.income - monthlySummary.expenses, currency)}
            </p>
          </div>
        </div>
        <div className="w-full h-2.5 bg-[#1c1c1c] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-blue-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {progressPercent.toFixed(0)}% of income spent
          {overBudget && " — over budget"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All months</option>
          {monthOptions.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TransactionCategory | "all")}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All categories</option>
          {TRANSACTION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-2">Income vs Expenses (Last 6 Months)</h2>
          <IncomeExpenseBarChart data={barData} currency={currency} />
        </div>
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-2">Spending by Category</h2>
          <SpendingPieChart data={pieData} currency={currency} />
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Transactions</h2>
        <TransactionsTable transactions={filteredTransactions} currency={currency} />
      </div>

      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAdd} />

      <FinancialProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleSaveProfile}
        profile={profile}
      />
    </div>
  );
}
