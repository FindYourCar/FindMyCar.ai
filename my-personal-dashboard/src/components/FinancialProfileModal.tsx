"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { FinancialProfile } from "@/types";
import { CURRENCY_RATES, CURRENCY_SYMBOLS, useCurrency } from "@/lib/currency";

interface FinancialProfileModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (profile: FinancialProfile) => void;
  profile: FinancialProfile;
}

export default function FinancialProfileModal({
  open,
  onClose,
  onSave,
  profile,
}: FinancialProfileModalProps) {
  const { currency } = useCurrency();
  const rate = CURRENCY_RATES[currency];
  const [currentBalance, setCurrentBalance] = useState("0");
  const [monthlyIncome, setMonthlyIncome] = useState("0");
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState("0");

  useEffect(() => {
    if (!open) return;
    setCurrentBalance((profile.currentBalance * rate).toFixed(2));
    setMonthlyIncome((profile.monthlyIncome * rate).toFixed(2));
    setMonthlySavingsGoal((profile.monthlySavingsGoal * rate).toFixed(2));
  }, [open, profile, rate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const balance = parseFloat(currentBalance);
    const income = parseFloat(monthlyIncome);
    const goal = parseFloat(monthlySavingsGoal);

    onSave({
      currentBalance: Number.isNaN(balance) ? 0 : balance / rate,
      monthlyIncome: Number.isNaN(income) ? 0 : income / rate,
      monthlySavingsGoal: Number.isNaN(goal) ? 0 : goal / rate,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Financial Profile">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Current Balance ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            step="0.01"
            value={currentBalance}
            onChange={(e) => setCurrentBalance(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Monthly Income ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            step="0.01"
            value={monthlyIncome}
            onChange={(e) => setMonthlyIncome(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Monthly Savings Goal ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            step="0.01"
            value={monthlySavingsGoal}
            onChange={(e) => setMonthlySavingsGoal(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-blue-500 hover:bg-blue-600 transition-colors text-white font-medium rounded-lg py-2.5 text-sm"
        >
          Save
        </button>
      </form>
    </Modal>
  );
}
