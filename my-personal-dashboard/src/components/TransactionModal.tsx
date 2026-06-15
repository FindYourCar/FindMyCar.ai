"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionCategory,
  TransactionType,
} from "@/types";
import { uid } from "@/lib/utils";
import { CURRENCY_RATES, CURRENCY_SYMBOLS, useCurrency } from "@/lib/currency";

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function TransactionModal({ open, onClose, onSave }: TransactionModalProps) {
  const { currency } = useCurrency();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<TransactionCategory>("Food");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());

  function reset() {
    setType("expense");
    setAmount("");
    setCategory("Food");
    setDescription("");
    setDate(today());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategory(next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) return;
    if (!description.trim()) return;

    onSave({
      id: uid(),
      amount: numericAmount / CURRENCY_RATES[currency],
      category,
      description: description.trim(),
      date,
      type,
    });
    reset();
    onClose();
  }

  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Modal open={open} onClose={handleClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
                type === "expense"
                  ? "bg-red-500/15 border-red-500/50 text-red-400"
                  : "bg-[#1c1c1c] border-border text-gray-400 hover:text-white"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
                type === "income"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                  : "bg-[#1c1c1c] border-border text-gray-400 hover:text-white"
              }`}
            >
              Income
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Amount ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TransactionCategory)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Description</label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-blue-500 hover:bg-blue-600 transition-colors text-white font-medium rounded-lg py-2.5 text-sm"
        >
          Add Transaction
        </button>
      </form>
    </Modal>
  );
}
