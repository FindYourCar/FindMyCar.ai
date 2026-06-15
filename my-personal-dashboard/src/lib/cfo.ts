import { EXPENSE_CATEGORIES, FinancialProfile, Transaction } from "@/types";
import { Currency } from "@/lib/currencyConfig";
import { formatCurrency, isIncome } from "@/lib/utils";

export interface MonthTotals {
  income: number;
  expenses: number;
  byCategory: Record<string, number>;
}

export function getMonthTotals(transactions: Transaction[], year: number, month: number): MonthTotals {
  let income = 0;
  let expenses = 0;
  const byCategory: Record<string, number> = {};

  for (const t of transactions) {
    const d = new Date(t.date + "T00:00:00");
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;

    if (isIncome(t)) {
      income += t.amount;
    } else {
      expenses += t.amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
    }
  }

  return { income, expenses, byCategory };
}

export interface HealthScore {
  score: number;
  label: string;
}

export function calculateHealthScore(profile: FinancialProfile, current: MonthTotals): HealthScore {
  const income = profile.monthlyIncome;
  const expenses = current.expenses;
  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Savings rate: 0-50 points
  const savingsRateScore = Math.max(0, Math.min(50, savingsRate));

  // Expenses vs income: 0-30 points
  let balanceScore = 30;
  if (income > 0 && expenses > income) {
    const overspendRatio = (expenses - income) / income;
    balanceScore = Math.max(0, 30 - overspendRatio * 60);
  } else if (income === 0) {
    balanceScore = 15;
  }

  // Savings goal: 0-20 points
  let goalScore = 10;
  if (profile.monthlySavingsGoal > 0) {
    goalScore =
      savings >= profile.monthlySavingsGoal
        ? 20
        : Math.max(0, (savings / profile.monthlySavingsGoal) * 20);
  }

  const score = Math.max(0, Math.min(100, Math.round(savingsRateScore + balanceScore + goalScore)));

  let label = "Needs Attention";
  if (score >= 75) label = "Excellent";
  else if (score >= 50) label = "Good";

  return { score, label };
}

export type InsightTone = "danger" | "warning" | "success" | "info";

export interface Insight {
  tone: InsightTone;
  title: string;
  description: string;
}

export function generateInsights(
  transactions: Transaction[],
  profile: FinancialProfile,
  now: Date,
  currency: Currency
): Insight[] {
  const insights: Insight[] = [];
  const year = now.getFullYear();
  const month = now.getMonth();
  const current = getMonthTotals(transactions, year, month);
  const lastMonthDate = new Date(year, month - 1, 1);
  const last = getMonthTotals(transactions, lastMonthDate.getFullYear(), lastMonthDate.getMonth());

  // High concentration in a single category
  if (current.expenses > 0) {
    for (const [category, amount] of Object.entries(current.byCategory)) {
      const pct = (amount / current.expenses) * 100;
      if (pct > 30) {
        insights.push({
          tone: "warning",
          title: "High category spending",
          description: `You spent ${pct.toFixed(0)}% of your budget on ${category} this month.`,
        });
      }
    }
  }

  // Overspending vs income
  if (profile.monthlyIncome > 0 && current.expenses > profile.monthlyIncome) {
    insights.push({
      tone: "danger",
      title: "Overspending alert",
      description: "You are spending more than you earn this month.",
    });
  }

  // Savings goal progress
  const actualSavings = profile.monthlyIncome - current.expenses;
  if (profile.monthlySavingsGoal > 0) {
    if (actualSavings >= profile.monthlySavingsGoal) {
      insights.push({
        tone: "success",
        title: "Savings goal on track",
        description: "Nice work — you're on track to hit your monthly savings goal.",
      });
    } else {
      const shortfall = profile.monthlySavingsGoal - actualSavings;
      insights.push({
        tone: "warning",
        title: "Savings goal at risk",
        description: `You need to save an extra ${formatCurrency(
          shortfall,
          currency
        )} this month to hit your savings goal.`,
      });
    }
  }

  // Top 3 spending categories
  const sortedCategories = Object.entries(current.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  if (sortedCategories.length > 0) {
    insights.push({
      tone: "info",
      title: "Top spending categories",
      description: sortedCategories
        .map(([cat, amount], i) => `${i + 1}. ${cat} — ${formatCurrency(amount, currency)}`)
        .join("   "),
    });
  }

  // Month-over-month comparison
  if (last.expenses > 0) {
    const diff = current.expenses - last.expenses;
    const pct = (diff / last.expenses) * 100;
    insights.push({
      tone: diff > 0 ? "warning" : "success",
      title: "Compared to last month",
      description: `Your spending is ${diff >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(
        0
      )}% compared to last month.`,
    });
  }

  return insights;
}

export interface BudgetGroup {
  label: string;
  categories: readonly string[];
  recommendedPct: number;
  actual: number;
  recommended: number;
}

export function getBudgetSplit(
  transactions: Transaction[],
  profile: FinancialProfile,
  now: Date
): BudgetGroup[] {
  const current = getMonthTotals(transactions, now.getFullYear(), now.getMonth());
  const income = profile.monthlyIncome;

  const NEEDS = ["Rent", "Food", "Transport", "University"];
  const WANTS = ["Entertainment", "Shopping", "Other"];

  const sumCategories = (cats: readonly string[]) =>
    cats.reduce((sum, cat) => sum + (current.byCategory[cat] ?? 0), 0);

  const needsActual = sumCategories(NEEDS);
  const wantsActual = sumCategories(WANTS);
  const savingsActual = income - current.expenses;

  return [
    {
      label: "Needs",
      categories: NEEDS,
      recommendedPct: 50,
      actual: needsActual,
      recommended: income * 0.5,
    },
    {
      label: "Wants",
      categories: WANTS,
      recommendedPct: 30,
      actual: wantsActual,
      recommended: income * 0.3,
    },
    {
      label: "Savings & Investments",
      categories: EXPENSE_CATEGORIES,
      recommendedPct: 20,
      actual: savingsActual,
      recommended: income * 0.2,
    },
  ];
}

export const MONEY_TIPS: string[] = [
  "As a student in the Netherlands you may be eligible for zorgtoeslag (healthcare allowance) — check if you qualify at toeslagen.nl.",
  "DEGIRO offers commission-free ETF trades on certain funds — a great way to start investing with small amounts.",
  "Set up an automatic transfer to savings on payday so you save before you have a chance to spend.",
  "Track every expense for one week — most people are surprised where 10-15% of their money quietly goes.",
  "If you're a student, ask about studentenkorting (student discounts) — many Dutch services offer them.",
  "Build an emergency fund covering 3 months of expenses before investing aggressively.",
  "Compare energy and phone contracts yearly — switching providers in NL can save €100s per year.",
  "Use a high-interest savings account (Bunq, Openbank) for your emergency fund instead of a regular checking account.",
  "Cook in batches on Sundays — meal prepping can cut your food budget by 20-30%.",
  "Avoid lifestyle inflation: when your income grows, increase your savings rate before your spending.",
  "Check if your municipality offers a 'collectiviteitskorting' on health insurance for students or low incomes.",
  "Pay off high-interest debt before investing — guaranteed interest savings often beat market returns.",
  "Use the 50/30/20 rule as a starting point: 50% needs, 30% wants, 20% savings — then adjust to your life.",
  "Second-hand marketplaces (Marktplaats, Vinted) are great for furniture and clothes when living on a student budget.",
  "Set a specific, dated savings goal (e.g. '€1,000 by December') — specific goals are far more motivating.",
  "Review your subscriptions every quarter — cancel anything you haven't used in the last 30 days.",
  "If you freelance, set aside 20-30% of every payment for taxes in a separate account immediately.",
  "Diversify: don't put all your savings into a single stock or coin, even one you believe in.",
  "Take advantage of free university resources — software licenses, gym memberships, and career services often included in tuition.",
  "Automate small recurring investments (even €10/month) — consistency matters more than amount when starting out.",
  "Non-EU students: keep track of your 16-hour weekly work limit — fines for exceeding it can hit your employer and your residence permit.",
  "DUO student finance is a loan, not free money — every euro you borrow now comes with interest later, so only borrow what you need.",
  "In the Netherlands, Box 3 has a tax-free savings/investment threshold — check the current allowance so small balances aren't taxed unnecessarily.",
  "Open a fee-free Dutch bank account (bunq, ING Student) to avoid monthly account fees eating into a tight student budget.",
  "Buy a 'ov-jaarkaart' or student travel pass if you commute often — it can be far cheaper than per-trip tickets.",
  "Use price-comparison sites like Pricerunner or Bol.com price trackers before big purchases — prices fluctuate more than you'd think.",
  "Split shared costs (groceries, utilities) with roommates using an app like Splitwise to avoid awkward IOUs piling up.",
  "When investing via DEGIRO or Trading212, stick to UCITS-compliant ETFs (e.g. accumulating VWCE) for simpler EU tax reporting.",
  "Before signing a Dutch rental contract, check if 'huurtoeslag' (rent allowance) applies — many students qualify without realizing it.",
  "Set aside a small 'fun budget' each month — a sustainable budget needs room for enjoyment, or it won't stick.",
];

export function getTipOfTheDay(date: Date): string {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return MONEY_TIPS[dayOfYear % MONEY_TIPS.length];
}
