"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { ASSET_TYPES, AssetType, PortfolioHolding } from "@/types";
import { uid } from "@/lib/utils";
import { CURRENCY_RATES, CURRENCY_SYMBOLS, useCurrency } from "@/lib/currency";

interface HoldingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (holding: PortfolioHolding) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function HoldingModal({ open, onClose, onSave }: HoldingModalProps) {
  const { currency } = useCurrency();
  const [ticker, setTicker] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("ETF");
  const [quantity, setQuantity] = useState("");
  const [avgBuyPrice, setAvgBuyPrice] = useState("");
  const [date, setDate] = useState(today());

  function reset() {
    setTicker("");
    setAssetType("ETF");
    setQuantity("");
    setAvgBuyPrice("");
    setDate(today());
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numericQuantity = parseFloat(quantity);
    const numericPrice = parseFloat(avgBuyPrice);
    if (!ticker.trim()) return;
    if (Number.isNaN(numericQuantity) || numericQuantity <= 0) return;
    if (Number.isNaN(numericPrice) || numericPrice <= 0) return;

    onSave({
      id: uid(),
      ticker: ticker.trim().toUpperCase(),
      assetType,
      quantity: numericQuantity,
      avgBuyPrice: numericPrice / CURRENCY_RATES[currency],
      date,
    });
    reset();
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Holding">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Ticker Symbol</label>
          <input
            type="text"
            required
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="e.g. VWCE.DE, AAPL, BTC-EUR"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use the Yahoo Finance symbol, e.g. ASML.AS, AAPL, VWCE.DE, IWDA.AS, BTC-EUR, ETH-EUR.
          </p>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Asset Type</label>
          <div className="grid grid-cols-3 gap-2">
            {ASSET_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAssetType(t)}
                className={`rounded-lg px-3 py-2 text-sm font-medium border transition-colors ${
                  assetType === t
                    ? "bg-[#d4af37]/15 border-[#d4af37]/50 text-[#d4af37]"
                    : "bg-[#1c1c1c] border-border text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Quantity</label>
          <input
            type="number"
            step="any"
            min="0"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="e.g. 12.5"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">
            Average Buy Price ({CURRENCY_SYMBOLS[currency]})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            value={avgBuyPrice}
            onChange={(e) => setAvgBuyPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Purchase Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full bg-[#d4af37] hover:bg-[#c9a431] transition-colors text-black font-medium rounded-lg py-2.5 text-sm"
        >
          Add Holding
        </button>
      </form>
    </Modal>
  );
}
