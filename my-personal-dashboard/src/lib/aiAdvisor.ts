import { FinancialProfile, Transaction } from "@/types";
import { Currency } from "@/lib/currencyConfig";
import { formatCurrency, isIncome } from "@/lib/utils";
import { getMonthTotals } from "@/lib/cfo";

export const AI_ADVISOR_SYSTEM_PROMPT = `You are Mykhailo's personal AI investment advisor and financial strategist. You have the knowledge and analytical mindset of a senior portfolio manager with 20+ years of experience across equity markets, ETFs, crypto, real estate, and venture investing.

About Mykhailo:
- Graduate student in Business Administration & Finance at University of Amsterdam (UvA)
- Based in Amsterdam, Netherlands
- Ukrainian non-EU student, 16-hour work limit per week
- Entrepreneur building FindMyCar — AI car search platform for NL, BE, DE, PL markets
- Monthly budget is tight as a student but growing

Your role:
1. Give SPECIFIC, actionable investment advice — not disclaimers
2. Recommend concrete instruments: VWCE, iShares Core MSCI World, DEGIRO/Trading212 strategies, specific ETFs for EU residents
3. Factor in his real financial data when provided
4. Know Dutch/EU rules: Box 3 NL wealth tax (threshold €57,000), zorgtoeslag, DUO student loan (currently 0% interest), DEGIRO fee structures, UCITS ETF regulations
5. For FindMyCar questions: advise on startup finance, runway, reinvestment strategy, revenue models
6. Be direct and confident — like a Goldman Sachs analyst friend
7. Use numbers and percentages whenever possible
8. Keep responses concise but substantive — no fluff
9. Always end with ONE specific next action to take today`;

export const AI_QUICK_ACTIONS = [
  "What should I invest €100 in right now?",
  "Review my spending and tell me what to cut",
  "Best ETFs for a student in the Netherlands?",
  "How is my savings rate vs my age group?",
  "Give me a 3-month financial plan",
  "Should I invest in FindMyCar or the market?",
];

export interface FinancialSnapshot {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topCategories: { category: string; amount: number }[];
  netThisMonth: number;
  currency: Currency;
}

function getTotalBalance(transactions: Transaction[], profile: FinancialProfile): number {
  let net = 0;
  for (const t of transactions) net += isIncome(t) ? t.amount : -t.amount;
  return profile.currentBalance + net;
}

export function buildFinancialSnapshot(
  transactions: Transaction[],
  profile: FinancialProfile,
  currency: Currency,
  now: Date = new Date()
): FinancialSnapshot {
  const current = getMonthTotals(transactions, now.getFullYear(), now.getMonth());
  const savingsRate =
    profile.monthlyIncome > 0
      ? ((profile.monthlyIncome - current.expenses) / profile.monthlyIncome) * 100
      : 0;

  const topCategories = Object.entries(current.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => ({ category, amount }));

  return {
    totalBalance: getTotalBalance(transactions, profile),
    monthlyIncome: profile.monthlyIncome,
    monthlyExpenses: current.expenses,
    savingsRate,
    topCategories,
    netThisMonth: current.income - current.expenses,
    currency,
  };
}

export function formatFinancialContextMessage(snapshot: FinancialSnapshot): string {
  const topCategoriesText =
    snapshot.topCategories.length > 0
      ? snapshot.topCategories
          .map((c) => `${c.category} (${formatCurrency(c.amount, snapshot.currency)})`)
          .join(", ")
      : "none logged yet";

  return [
    "Mykhailo's current financial snapshot:",
    `Total balance: ${formatCurrency(snapshot.totalBalance, snapshot.currency)}`,
    `Monthly income: ${formatCurrency(snapshot.monthlyIncome, snapshot.currency)}`,
    `Monthly expenses: ${formatCurrency(snapshot.monthlyExpenses, snapshot.currency)}`,
    `Savings rate: ${snapshot.savingsRate.toFixed(1)}%`,
    `Top spending categories: ${topCategoriesText}`,
    `This month's net: ${formatCurrency(snapshot.netThisMonth, snapshot.currency)}`,
  ].join("\n");
}
