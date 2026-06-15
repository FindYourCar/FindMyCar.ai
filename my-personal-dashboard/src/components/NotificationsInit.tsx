"use client";

import { useEffect } from "react";
import { requestNotificationPermission, startNotificationScheduler } from "@/lib/notifications";

/**
 * Mounted once at the root layout. Requests browser notification permission
 * on first visit (if not yet asked) and starts the hourly scheduler that
 * checks for due/overdue tasks and savings goal alerts.
 */
export default function NotificationsInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register the service worker so the app can be installed as a PWA and
    // notifications can be shown via the OS even when the tab isn't focused.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {
        // Ignore registration failures (e.g. unsupported browser).
      });
    }

    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      requestNotificationPermission();
    }

    const stop = startNotificationScheduler();
    return stop;
  }, []);

  return null;
}
