"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { loadTasks } from "@/lib/storage";
import {
  getNotificationHistory,
  getOverdueTasks,
  getTasksDueToday,
  NotificationRecord,
} from "@/lib/notifications";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [history, setHistory] = useState<NotificationRecord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function refresh() {
      const tasks = loadTasks();
      const now = new Date();
      const count = getOverdueTasks(tasks, now).length + getTasksDueToday(tasks, now).length;
      setBadgeCount(count);
      setHistory(getNotificationHistory());
    }

    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          setOpen((o) => !o);
          setHistory(getNotificationHistory());
        }}
        className="relative p-2 rounded-lg text-gray-400 hover:bg-surface hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">Notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Last {history.length} alerts</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 px-4 py-6 text-center">
                No notifications yet.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {history.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <p className="text-sm text-gray-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimestamp(n.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
