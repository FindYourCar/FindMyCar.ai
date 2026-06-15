"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  isNotificationsEnabled,
  requestNotificationPermission,
  setNotificationsEnabled,
} from "@/lib/notifications";

export default function NotificationsToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isNotificationsEnabled());
  }, []);

  async function toggle() {
    const next = !enabled;
    setEnabled(next);
    setNotificationsEnabled(next);

    if (next && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await requestNotificationPermission();
      }
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg hover:bg-surface transition-colors"
      aria-pressed={enabled}
    >
      <span className="flex items-center gap-2 text-xs text-gray-400">
        {enabled ? <Bell size={14} /> : <BellOff size={14} />}
        Notifications
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? "bg-[#d4af37]" : "bg-[#262626]"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}
