export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "University",
  "Entertainment",
  "Shopping",
  "Rent",
  "Other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investment",
  "Gift",
  "Other Income",
] as const;
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const TRANSACTION_TYPES = ["expense", "income"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export interface Transaction {
  id: string;
  amount: number;
  category: TransactionCategory;
  description: string;
  date: string;
  type: TransactionType;
}

export interface FinancialProfile {
  currentBalance: number;
  monthlyIncome: number;
  monthlySavingsGoal: number;
}

export const TASK_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_CATEGORIES = [
  "University",
  "Startup",
  "Personal",
  "Finance",
  "Other",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_STATUSES = ["todo", "in-progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string;
  status: TaskStatus;
  createdAt?: string;
}

export const ASSET_TYPES = ["Stock", "ETF", "Crypto"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export interface PortfolioHolding {
  id: string;
  ticker: string;
  assetType: AssetType;
  quantity: number;
  avgBuyPrice: number;
  date: string;
}

export interface WeeklyGoal {
  id: string;
  text: string;
  done: boolean;
}

export interface WeeklyGoalsState {
  weekKey: string;
  goals: WeeklyGoal[];
}
