import { AssetType, PortfolioHolding } from "@/types";

export const ASSET_TYPE_COLORS: Record<AssetType, string> = {
  Stock: "#3b82f6",
  ETF: "#d4af37",
  Crypto: "#8b5cf6",
};

// Quotes are returned by Yahoo Finance in their native currency. Amounts
// elsewhere in the app are stored in EUR, so convert to EUR for totals.
const FX_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  GBp: 0.0117,
  CHF: 1.04,
};

export function toEur(amount: number, currency: string): number {
  return amount * (FX_TO_EUR[currency] ?? 1);
}

export interface HoldingValuation {
  holding: PortfolioHolding;
  currentPrice: number | null;
  currency: string | null;
  costBasis: number;
  currentValue: number | null;
  gainLoss: number | null;
  gainLossPct: number | null;
  error?: string;
}

export function valuateHolding(
  holding: PortfolioHolding,
  quote: { price: number; currency: string } | null,
  error?: string
): HoldingValuation {
  const costBasis = holding.quantity * holding.avgBuyPrice;

  if (!quote) {
    return {
      holding,
      currentPrice: null,
      currency: null,
      costBasis,
      currentValue: null,
      gainLoss: null,
      gainLossPct: null,
      error,
    };
  }

  const currentValue = toEur(quote.price * holding.quantity, quote.currency);
  const gainLoss = currentValue - costBasis;
  const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

  return {
    holding,
    currentPrice: quote.price,
    currency: quote.currency,
    costBasis,
    currentValue,
    gainLoss,
    gainLossPct,
  };
}
