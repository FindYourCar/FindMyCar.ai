import { FinancialProfile, PortfolioHolding, Task, Transaction, WeeklyGoal, WeeklyGoalsState } from "@/types";

export const TRANSACTIONS_KEY = "budget_transactions";
export const TASKS_KEY = "tasks";
export const FINANCIAL_PROFILE_KEY = "financial_profile";
export const PORTFOLIO_HOLDINGS_KEY = "portfolio_holdings";
export const WEEKLY_GOALS_KEY = "weekly_goals";

export const DEFAULT_FINANCIAL_PROFILE: FinancialProfile = {
  currentBalance: 0,
  monthlyIncome: 0,
  monthlySavingsGoal: 0,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      window.localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadTransactions(): Transaction[] {
  return loadFromStorage<Transaction[]>(TRANSACTIONS_KEY, []);
}

export function saveTransactions(transactions: Transaction[]) {
  saveToStorage(TRANSACTIONS_KEY, transactions);
}

export function loadTasks(): Task[] {
  return loadFromStorage<Task[]>(TASKS_KEY, []);
}

export function saveTasks(tasks: Task[]) {
  saveToStorage(TASKS_KEY, tasks);
}

export function loadFinancialProfile(): FinancialProfile {
  return loadFromStorage<FinancialProfile>(FINANCIAL_PROFILE_KEY, DEFAULT_FINANCIAL_PROFILE);
}

export function saveFinancialProfile(profile: FinancialProfile) {
  saveToStorage(FINANCIAL_PROFILE_KEY, profile);
}

export function loadPortfolioHoldings(): PortfolioHolding[] {
  return loadFromStorage<PortfolioHolding[]>(PORTFOLIO_HOLDINGS_KEY, []);
}

export function savePortfolioHoldings(holdings: PortfolioHolding[]) {
  saveToStorage(PORTFOLIO_HOLDINGS_KEY, holdings);
}

export function getCurrentWeekKey(now: Date = new Date()): string {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  const day = (date.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  date.setDate(date.getDate() - day);
  return date.toISOString().slice(0, 10);
}

const DEFAULT_WEEKLY_GOALS: WeeklyGoal[] = [
  { id: "1", text: "", done: false },
  { id: "2", text: "", done: false },
  { id: "3", text: "", done: false },
];

export function loadWeeklyGoals(now: Date = new Date()): WeeklyGoalsState {
  const currentWeekKey = getCurrentWeekKey(now);
  const stored = loadFromStorage<WeeklyGoalsState>(WEEKLY_GOALS_KEY, {
    weekKey: currentWeekKey,
    goals: DEFAULT_WEEKLY_GOALS,
  });

  if (stored.weekKey !== currentWeekKey) {
    const reset: WeeklyGoalsState = {
      weekKey: currentWeekKey,
      goals: stored.goals.map((g) => ({ ...g, done: false })),
    };
    saveToStorage(WEEKLY_GOALS_KEY, reset);
    return reset;
  }

  return stored;
}

export function saveWeeklyGoals(state: WeeklyGoalsState) {
  saveToStorage(WEEKLY_GOALS_KEY, state);
}
