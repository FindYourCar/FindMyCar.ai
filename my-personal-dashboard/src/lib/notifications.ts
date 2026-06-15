import { Task } from "@/types";
import { uid, formatCurrency, formatDate } from "@/lib/utils";
import { CURRENCIES, Currency, PREFERRED_CURRENCY_KEY } from "@/lib/currency";
import { getMonthTotals } from "@/lib/cfo";
import { loadFinancialProfile, loadTasks, loadTransactions } from "@/lib/storage";

export const NOTIFICATION_PERMISSION_KEY = "notification_permission";
export const NOTIFICATIONS_ENABLED_KEY = "notifications_enabled";
export const NOTIFICATION_HISTORY_KEY = "notification_history";
export const NOTIFICATION_SCHEDULE_KEY = "notification_schedule_state";

export interface NotificationRecord {
  id: string;
  message: string;
  timestamp: string;
}

interface ScheduleState {
  morningDate?: string;
  weeklyReviewWeek?: string;
  savingsAlertMonth?: string;
  overdueNotified?: string[];
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getCurrentCurrency(): Currency {
  if (typeof window === "undefined") return "EUR";
  const saved = window.localStorage.getItem(PREFERRED_CURRENCY_KEY);
  return (CURRENCIES as readonly string[]).includes(saved ?? "") ? (saved as Currency) : "EUR";
}

function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isLastDayOfMonth(d: Date): boolean {
  const tomorrow = new Date(d);
  tomorrow.setDate(d.getDate() + 1);
  return tomorrow.getMonth() !== d.getMonth();
}

function getWeekKey(d: Date): string {
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d.getTime() - oneJan.getTime()) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + oneJan.getDay()) / 7);
  return `${d.getFullYear()}-W${week}`;
}

/* -------------------------------------------------------------------- */
/* Permission + enabled state                                            */
/* -------------------------------------------------------------------- */

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  try {
    const result = await Notification.requestPermission();
    window.localStorage.setItem(NOTIFICATION_PERMISSION_KEY, result);
    return result;
  } catch {
    return "denied";
  }
}

export function isNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  if (stored === null) return true;
  return stored === "true";
}

export function setNotificationsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
}

/* -------------------------------------------------------------------- */
/* History                                                                */
/* -------------------------------------------------------------------- */

export function getNotificationHistory(): NotificationRecord[] {
  return loadJSON<NotificationRecord[]>(NOTIFICATION_HISTORY_KEY, []);
}

function addNotificationRecord(message: string): NotificationRecord[] {
  const history = getNotificationHistory();
  const record: NotificationRecord = { id: uid(), message, timestamp: new Date().toISOString() };
  const updated = [record, ...history].slice(0, 10);
  saveJSON(NOTIFICATION_HISTORY_KEY, updated);
  return updated;
}

function sendBrowserNotification(message: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!isNotificationsEnabled()) return;

  // Prefer showing via the service worker so the notification can still be
  // delivered when the dashboard tab isn't focused (closer to a real push
  // notification on mobile).
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification("My Dashboard", { body: message, icon: "/icon.svg" }))
      .catch(() => {
        try {
          new Notification("My Dashboard", { body: message });
        } catch {
          // Ignore — Notification API can throw in some environments (e.g. insecure context).
        }
      });
    return;
  }

  try {
    new Notification("My Dashboard", { body: message });
  } catch {
    // Notification API can throw in some environments (e.g. insecure context) — ignore.
  }
}

function notify(message: string) {
  addNotificationRecord(message);
  sendBrowserNotification(message);
}

/* -------------------------------------------------------------------- */
/* Task helpers                                                          */
/* -------------------------------------------------------------------- */

export function getOverdueTasks(tasks: Task[], now: Date): Task[] {
  const today = dateOnly(now);
  return tasks.filter((t) => t.status !== "done" && !!t.dueDate && t.dueDate < today);
}

export function getTasksDueToday(tasks: Task[], now: Date): Task[] {
  const today = dateOnly(now);
  return tasks.filter((t) => t.status !== "done" && t.dueDate === today);
}

/* -------------------------------------------------------------------- */
/* Scheduler                                                              */
/* -------------------------------------------------------------------- */

export function runNotificationChecks(now: Date = new Date()) {
  if (typeof window === "undefined") return;
  if (!isNotificationsEnabled()) return;

  const tasks = loadTasks();
  const profile = loadFinancialProfile();
  const transactions = loadTransactions();
  const currency = getCurrentCurrency();
  const state = loadJSON<ScheduleState>(NOTIFICATION_SCHEDULE_KEY, {});

  const today = dateOnly(now);
  const hour = now.getHours();
  const day = now.getDay();

  // 1. Morning summary — every day at/after 9am
  if (hour >= 9 && state.morningDate !== today) {
    const dueToday = getTasksDueToday(tasks, now);
    if (dueToday.length > 0) {
      const priorityRank: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      const mostUrgent = [...dueToday].sort(
        (a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
      )[0];
      notify(
        `Morning Misha! Quick heads up, you have ${dueToday.length} task${
          dueToday.length === 1 ? "" : "s"
        } on your plate today. ${mostUrgent.title} is the most urgent one. You got this!`
      );
    }
    state.morningDate = today;
  }

  // 2. Overdue tasks — notify once per task
  const overdue = getOverdueTasks(tasks, now);
  const notified = new Set(state.overdueNotified ?? []);
  for (const t of overdue) {
    if (!notified.has(t.id)) {
      notify(
        `Hey, just a reminder that ${t.title} was due on ${formatDate(
          t.dueDate
        )} and is still sitting in your To Do list. Worth a look?`
      );
      notified.add(t.id);
    }
  }
  // Drop ids for tasks that no longer exist or are no longer overdue (e.g. completed/edited)
  const overdueIds = new Set(overdue.map((t) => t.id));
  state.overdueNotified = Array.from(notified).filter((id) => overdueIds.has(id));

  // 3. Weekly review — Sunday at/after 6pm
  const weekKey = getWeekKey(now);
  if (day === 0 && hour >= 18 && state.weeklyReviewWeek !== weekKey) {
    const remaining = tasks.filter((t) => t.status !== "done").length;
    notify(
      `Sunday check-in! You have ${remaining} task${
        remaining === 1 ? "" : "s"
      } left this week. Take 10 minutes tonight to plan your week and you will thank yourself later.`
    );
    state.weeklyReviewWeek = weekKey;
  }

  // 4. Savings goal check — last day of month, evening
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (isLastDayOfMonth(now) && hour >= 18 && state.savingsAlertMonth !== monthKey) {
    if (profile.monthlySavingsGoal > 0) {
      const totals = getMonthTotals(transactions, now.getFullYear(), now.getMonth());
      const actualSavings = profile.monthlyIncome - totals.expenses;
      if (actualSavings < profile.monthlySavingsGoal) {
        const shortfall = profile.monthlySavingsGoal - actualSavings;
        const topCategory = Object.entries(totals.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0];
        notify(
          `Finance check: You are ${formatCurrency(
            shortfall,
            currency
          )} away from your savings goal this month.${
            topCategory
              ? ` If you cut back on ${topCategory} a bit you could still make it!`
              : " A small cutback here and there could still get you there!"
          }`
        );
      }
    }
    state.savingsAlertMonth = monthKey;
  }

  saveJSON(NOTIFICATION_SCHEDULE_KEY, state);
}

export function startNotificationScheduler(): () => void {
  if (typeof window === "undefined") return () => {};

  runNotificationChecks(new Date());
  const interval = window.setInterval(() => runNotificationChecks(new Date()), 60 * 60 * 1000);

  return () => window.clearInterval(interval);
}
