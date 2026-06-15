"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { loadPortfolioHoldings, savePortfolioHoldings } from "@/lib/storage";
import { AssetType, PortfolioHolding } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { HoldingValuation, valuateHolding } from "@/lib/portfolio";
import SummaryCard from "@/components/SummaryCard";
import PortfolioPieChart from "@/components/PortfolioPieChart";
import HoldingModal from "@/components/HoldingModal";

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [valuations, setValuations] = useState<Record<string, HoldingValuation>>({});
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { currency } = useCurrency();

  useEffect(() => {
    setHoldings(loadPortfolioHoldings());
  }, []);

  useEffect(() => {
    if (holdings.length === 0) {
      setValuations({});
      return;
    }
    refreshQuotes(holdings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  async function refreshQuotes(current: PortfolioHolding[]) {
    setLoadingQuotes(true);
    const results = await Promise.all(
      current.map(async (holding) => {
        try {
          const res = await fetch(`/api/quote?symbol=${encodeURIComponent(holding.ticker)}`);
          const data = await res.json();
          if (!res.ok || typeof data.price !== "number") {
            return valuateHolding(holding, null, data?.error ?? "Price unavailable");
          }
          return valuateHolding(holding, { price: data.price, currency: data.currency });
        } catch {
          return valuateHolding(holding, null, "Failed to fetch price");
        }
      })
    );

    const next: Record<string, HoldingValuation> = {};
    for (const v of results) next[v.holding.id] = v;
    setValuations(next);
    setLoadingQuotes(false);
  }

  function handleAddHolding(holding: PortfolioHolding) {
    const next = [...holdings, holding];
    setHoldings(next);
    savePortfolioHoldings(next);
  }

  function handleDeleteHolding(id: string) {
    const next = holdings.filter((h) => h.id !== id);
    setHoldings(next);
    savePortfolioHoldings(next);
  }

  const totals = useMemo(() => {
    let currentValue = 0;
    let costBasis = 0;
    let hasMissing = false;

    for (const holding of holdings) {
      const v = valuations[holding.id];
      costBasis += v ? v.costBasis : holding.quantity * holding.avgBuyPrice;
      if (v?.currentValue != null) {
        currentValue += v.currentValue;
      } else {
        hasMissing = true;
      }
    }

    const gainLoss = currentValue - costBasis;
    const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return { currentValue, costBasis, gainLoss, gainLossPct, hasMissing };
  }, [holdings, valuations]);

  const pieData = useMemo(() => {
    const totalsByType = new Map<AssetType, number>();
    for (const holding of holdings) {
      const v = valuations[holding.id];
      const value = v?.currentValue ?? holding.quantity * holding.avgBuyPrice;
      totalsByType.set(holding.assetType, (totalsByType.get(holding.assetType) ?? 0) + value);
    }
    return Array.from(totalsByType.entries()).map(([assetType, value]) => ({ assetType, value }));
  }, [holdings, valuations]);

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Track your stocks, ETFs, and crypto holdings with live prices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshQuotes(holdings)}
            disabled={loadingQuotes || holdings.length === 0}
            className="flex items-center gap-2 bg-[#1c1c1c] border border-border hover:bg-[#262626] transition-colors text-sm font-medium rounded-lg px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={loadingQuotes ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-[#d4af37] hover:bg-[#c9a431] transition-colors text-black text-sm font-medium rounded-lg px-4 py-2.5"
          >
            <Plus size={16} />
            Add Holding
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Portfolio Value"
          value={formatCurrency(totals.currentValue, currency)}
          icon={Wallet}
          accent="default"
        />
        <SummaryCard
          label="Gain / Loss"
          value={`${totals.gainLoss >= 0 ? "+" : ""}${formatCurrency(totals.gainLoss, currency)}`}
          icon={totals.gainLoss >= 0 ? TrendingUp : TrendingDown}
          accent={totals.gainLoss >= 0 ? "green" : "default"}
        />
        <SummaryCard
          label="Gain / Loss %"
          value={`${totals.gainLossPct >= 0 ? "+" : ""}${totals.gainLossPct.toFixed(2)}%`}
          icon={totals.gainLossPct >= 0 ? TrendingUp : TrendingDown}
          accent={totals.gainLossPct >= 0 ? "green" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings table */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-5 overflow-x-auto">
          <h2 className="font-semibold mb-3">Holdings</h2>
          {holdings.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No holdings yet — add your first stock, ETF, or crypto position.
            </p>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-gray-500 border-b border-border">
                  <th className="py-2 pr-3 font-medium">Ticker</th>
                  <th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">Qty</th>
                  <th className="py-2 pr-3 font-medium">Avg Buy</th>
                  <th className="py-2 pr-3 font-medium">Price</th>
                  <th className="py-2 pr-3 font-medium">Value</th>
                  <th className="py-2 pr-3 font-medium">Gain/Loss</th>
                  <th className="py-2 pr-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {holdings.map((holding) => {
                  const v = valuations[holding.id];
                  return (
                    <tr key={holding.id}>
                      <td className="py-3 pr-3 font-medium">
                        {holding.ticker}
                        <p className="text-xs text-gray-500">{formatDate(holding.date)}</p>
                      </td>
                      <td className="py-3 pr-3 text-gray-400">{holding.assetType}</td>
                      <td className="py-3 pr-3 text-gray-400">{holding.quantity}</td>
                      <td className="py-3 pr-3 text-gray-400">{formatCurrency(holding.avgBuyPrice, currency)}</td>
                      <td className="py-3 pr-3 text-gray-400">
                        {v?.currentPrice != null
                          ? `${v.currentPrice.toFixed(2)} ${v.currency}`
                          : v?.error
                          ? <span className="text-red-400 text-xs">{v.error}</span>
                          : "..."}
                      </td>
                      <td className="py-3 pr-3 font-medium">
                        {v?.currentValue != null ? formatCurrency(v.currentValue, currency) : "—"}
                      </td>
                      <td className="py-3 pr-3">
                        {v?.gainLoss != null ? (
                          <span className={v.gainLoss >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {v.gainLoss >= 0 ? "+" : ""}
                            {formatCurrency(v.gainLoss, currency)} ({v.gainLossPct?.toFixed(1)}%)
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <button
                          onClick={() => handleDeleteHolding(holding.id)}
                          aria-label="Remove holding"
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Allocation pie chart */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-2">Allocation</h2>
          <PortfolioPieChart data={pieData} currency={currency} />
        </div>
      </div>

      <HoldingModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAddHolding} />
    </div>
  );
}
