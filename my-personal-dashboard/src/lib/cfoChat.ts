import { FinancialProfile, Task, Transaction } from "@/types";
import { Currency } from "@/lib/currency";
import { formatCurrency, isIncome } from "@/lib/utils";
import { getBudgetSplit, getMonthTotals, MONEY_TIPS } from "@/lib/cfo";

export interface ChatContext {
  transactions: Transaction[];
  profile: FinancialProfile;
  tasks: Task[];
  currency: Currency;
  now: Date;
}

export const QUICK_REPLIES = [
  "How am I doing?",
  "What to invest in?",
  "Can I spend this weekend?",
  "Am I saving enough?",
];

export const CFO_WELCOME_MESSAGE =
  "Hey Misha! I am your personal CFO. I have looked at your finances and I am ready to help. What would you like to know?";

export const CFO_DEFAULT_RESPONSE =
  "Hmm, not sure I caught that one. Try asking me something like \"How am I doing this month?\", \"What to invest in?\", \"Can I spend this weekend?\", \"Am I saving enough?\", \"What's my biggest expense?\", \"Can I afford €50?\", or \"Give me a financial tip\".";

const WANTS_CATEGORIES = ["Entertainment", "Shopping", "Other"];

function getTotalBalance(transactions: Transaction[], profile: FinancialProfile): number {
  let net = 0;
  for (const t of transactions) net += isIncome(t) ? t.amount : -t.amount;
  return profile.currentBalance + net;
}

function affordAmount(question: string): number | null {
  const match = question.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const value = parseFloat(match[1].replace(",", "."));
  return Number.isNaN(value) ? null : value;
}

export function generateCfoResponse(input: string, ctx: ChatContext): string {
  const q = input.toLowerCase().trim();
  const { transactions, profile, currency, now } = ctx;

  const totalBalance = getTotalBalance(transactions, profile);
  const current = getMonthTotals(transactions, now.getFullYear(), now.getMonth());
  const savingsRate =
    profile.monthlyIncome > 0
      ? ((profile.monthlyIncome - current.expenses) / profile.monthlyIncome) * 100
      : 0;

  // "Can I afford X" — check before other matches since it includes a number
  if (q.includes("afford")) {
    const amount = affordAmount(q);
    if (amount === null) {
      return "Throw a number at me and I'll check it for you — something like \"Can I afford €50?\"";
    }

    const referenceLeftover =
      profile.monthlyIncome > 0 ? profile.monthlyIncome - current.expenses : current.income - current.expenses;

    if (amount > totalBalance) {
      return `Your current balance is ${formatCurrency(
        totalBalance,
        currency
      )}, so spending ${formatCurrency(amount, currency)} would actually put you in the red. I would wait until next month if I were you.`;
    }

    if (amount <= referenceLeftover && referenceLeftover - amount >= (profile.monthlySavingsGoal || 0)) {
      return `Your current balance is ${formatCurrency(
        totalBalance,
        currency
      )} and after your regular monthly expenses you usually have about ${formatCurrency(
        Math.max(referenceLeftover, 0),
        currency
      )} left over. So yes, you can comfortably afford that.`;
    }

    return `Your current balance is ${formatCurrency(
      totalBalance,
      currency
    )} and after your regular monthly expenses you usually have about ${formatCurrency(
      Math.max(referenceLeftover, 0),
      currency
    )} left over. So yes, but it will cut into your savings a bit — just keep that in mind.`;
  }

  // "How much can I spend this weekend"
  if (q.includes("weekend")) {
    if (profile.monthlyIncome === 0) {
      return "I'd love to work that out, but I need your monthly income set in your Financial Profile first — pop it in on the Budget page and ask me again.";
    }

    const groups = getBudgetSplit(transactions, profile, now);
    const wants = groups.find((g) => g.label === "Wants");

    if (!wants) {
      return CFO_DEFAULT_RESPONSE;
    }

    const remainingWants = wants.recommended - wants.actual;

    if (remainingWants <= 0) {
      return `Honestly, you've already used up your "fun money" for this month — ${formatCurrency(
        wants.actual,
        currency
      )} of your ${formatCurrency(
        wants.recommended,
        currency
      )} budget. I'd keep this weekend low-key, maybe a free hangout instead of spending.`;
    }

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let weekendsLeft = 0;
    for (let d = now.getDate(); d <= daysInMonth; d++) {
      const day = new Date(now.getFullYear(), now.getMonth(), d).getDay();
      if (day === 6) weekendsLeft++;
    }
    if (weekendsLeft === 0) weekendsLeft = 1;

    const weekendAllowance = remainingWants / weekendsLeft;

    return `You've got about ${formatCurrency(
      remainingWants,
      currency
    )} left in your "wants" budget for the rest of the month. Spread across the weekends left, that's roughly ${formatCurrency(
      weekendAllowance,
      currency
    )} you could comfortably spend this weekend without throwing off your budget.`;
  }

  // "Am I on track for my savings goal" / "Am I saving enough"
  if ((q.includes("saving") || q.includes("savings")) && (q.includes("enough") || q.includes("goal") || q.includes("track"))) {
    if (profile.monthlySavingsGoal <= 0) {
      return "You haven't set a savings goal yet — head to your Financial Profile on the Budget page, set one, and I'll keep track of it for you.";
    }

    const savedSoFar = current.income - current.expenses;
    const pct = (savedSoFar / profile.monthlySavingsGoal) * 100;

    if (savedSoFar >= profile.monthlySavingsGoal) {
      return `Nice! You've already saved ${formatCurrency(
        savedSoFar,
        currency
      )} this month, which is past your ${formatCurrency(
        profile.monthlySavingsGoal,
        currency
      )} goal. Great job staying ahead — keep it up!`;
    }

    if (pct >= 70) {
      return `You're at ${formatCurrency(savedSoFar, currency)} of your ${formatCurrency(
        profile.monthlySavingsGoal,
        currency
      )} goal so far this month — that's ${pct.toFixed(
        0
      )}%. You're basically on track, just keep things steady and you'll get there.`;
    }

    const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    return `Right now you've saved ${formatCurrency(savedSoFar, currency)} of your ${formatCurrency(
      profile.monthlySavingsGoal,
      currency
    )} goal — that's ${Math.max(0, pct).toFixed(
      0
    )}%, so you're a bit behind. With ${daysLeft} day${
      daysLeft === 1 ? "" : "s"
    } left this month, trimming back on the small extras could still get you there.`;
  }

  // "Give me a financial tip"
  if (q.includes("tip")) {
    const tip = MONEY_TIPS[Math.floor(Math.random() * MONEY_TIPS.length)];
    return `Here's one for you: ${tip}`;
  }

  // Investment advice
  if (q.includes("invest")) {
    if (totalBalance <= 0) {
      return "Honestly, with your balance where it is right now, I'd hold off on investing and focus on building up a small cushion first. Come back and ask me again once you've got a bit of breathing room!";
    }

    if (savingsRate < 5) {
      return `I get that investing sounds exciting, but your savings rate is only around ${savingsRate.toFixed(
        0
      )}% right now. I'd start by tucking extra cash into a high-interest savings account (Bunq or Openbank, around 2.5-3%) before locking anything away in investments.`;
    }

    const suggestedMonthly = Math.max(10, Math.round((totalBalance * 0.02) / 5) * 5);

    if (totalBalance >= 1000 && savingsRate >= 15) {
      return `Based on your current balance of ${formatCurrency(
        totalBalance,
        currency
      )} and your savings rate of ${savingsRate.toFixed(
        0
      )}%, you're in a really solid spot. I'd put the bulk into a low-cost index fund like VWCE on DEGIRO, keep your emergency fund in a high-interest savings account, and if you're feeling adventurous maybe 5-10% into something higher risk like crypto. Want me to break down how that could grow over 5 years?`;
    }

    return `Based on your current balance of ${formatCurrency(
      totalBalance,
      currency
    )} and your savings rate of ${savingsRate.toFixed(
      0
    )}%, I'd suggest starting with something low risk like the VWCE ETF on DEGIRO. You could put aside about ${formatCurrency(
      suggestedMonthly,
      currency
    )} a month and barely notice it's gone. Want me to break down how much that could grow in 5 years?`;
  }

  // Monthly summary
  if (q.includes("how am i doing") || q.includes("monthly summary") || q.includes("this month")) {
    if (current.income === 0 && current.expenses === 0) {
      return "You haven't logged any transactions yet this month — pop a few into the Budget page and I'll give you the full rundown.";
    }

    const net = current.income - current.expenses;
    const entries = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1]);

    let splurgeLine = "";
    if (entries.length > 0) {
      const [category, amount] = entries[0];
      const pct = current.expenses > 0 ? (amount / current.expenses) * 100 : 0;
      splurgeLine = ` Your biggest splurge was ${category}, which took up about ${pct.toFixed(0)}% of your spending.`;
    }

    const verdict =
      net >= 0
        ? "Overall, good job — you're keeping things in check!"
        : "Overall, I'd say you need to watch your spending a bit this month.";

    return `So this month you earned ${formatCurrency(current.income, currency)} and spent ${formatCurrency(
      current.expenses,
      currency
    )}. That means you ${net >= 0 ? "saved" : "overspent by"} ${formatCurrency(
      Math.abs(net),
      currency
    )}.${splurgeLine} ${verdict}`;
  }

  // Biggest expense
  if (q.includes("biggest expense") || q.includes("top expense") || q.includes("spending most")) {
    const entries = Object.entries(current.byCategory).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) {
      return "You haven't logged any expenses yet this month, so I can't really say — add a few transactions on the Budget page and ask me again.";
    }
    const [category, amount] = entries[0];
    const pct = current.expenses > 0 ? (amount / current.expenses) * 100 : 0;
    return `Your biggest expense this month is ${category} at ${formatCurrency(
      amount,
      currency
    )} — that's about ${pct.toFixed(0)}% of everything you've spent so far.`;
  }

  // Total saved
  if (q.includes("how much") && (q.includes("saved") || q.includes("savings"))) {
    return `Right now you've got ${formatCurrency(
      totalBalance,
      currency
    )} saved up in total, based on your balance and transaction history. ${
      totalBalance > 0 ? "Nice cushion to keep building on!" : "Let's work on building that up together."
    }`;
  }

  // Budget advice (50/30/20)
  if (q.includes("budget")) {
    if (profile.monthlyIncome === 0) {
      return "Set your monthly income in your Financial Profile on the Budget page, and I'll compare your spending to the 50/30/20 rule for you.";
    }

    const groups = getBudgetSplit(transactions, profile, now);
    const needs = groups.find((g) => g.label === "Needs");
    const wants = groups.find((g) => g.label === "Wants");
    const savings = groups.find((g) => g.label === "Savings & Investments");
    const income = profile.monthlyIncome;

    const needsPct = needs ? (needs.actual / income) * 100 : 0;
    const wantsPct = wants ? (wants.actual / income) * 100 : 0;
    const savingsPct = savings ? (savings.actual / income) * 100 : 0;

    let verdict: string;
    let suggestion: string;

    if (wantsPct > 35) {
      const wantsEntries = Object.entries(current.byCategory)
        .filter(([cat]) => WANTS_CATEGORIES.includes(cat))
        .sort((a, b) => b[1] - a[1]);
      const topWants = wantsEntries[0]?.[0] ?? "wants";
      verdict = "you're overspending a bit on wants";
      suggestion = `try trimming back on ${topWants} a little — even cutting it by 10-15% would bring you a lot closer to that 30% target`;
    } else if (savingsPct < 15) {
      verdict = "you're not quite hitting your savings target";
      suggestion = "try setting up an automatic transfer to savings right after payday, even a small amount to start builds the habit";
    } else {
      verdict = "you're on track";
      suggestion = "just keep doing what you're doing";
    }

    return `Looking at your spending, you're using about ${needsPct.toFixed(0)}% on needs, ${wantsPct.toFixed(
      0
    )}% on wants, and ${savingsPct.toFixed(
      0
    )}% on savings. The golden rule is 50/30/20, so ${verdict}. My suggestion would be to ${suggestion}.`;
  }

  return CFO_DEFAULT_RESPONSE;
}
