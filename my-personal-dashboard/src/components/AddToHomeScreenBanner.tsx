"use client";

import { useEffect, useState } from "react";
import { X, Smartphone } from "lucide-react";

const DISMISSED_KEY = "pwa_banner_dismissed";

export default function AddToHomeScreenBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = window.localStorage.getItem(DISMISSED_KEY);
    if (dismissed !== "true") {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 px-4 pb-4 md:pb-6 md:px-6 flex justify-center">
      <div className="w-full max-w-md bg-surface border border-gold/30 rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
        <div className="w-9 h-9 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
          <Smartphone size={18} />
        </div>
        <p className="text-sm text-gray-200 flex-1">
          Add to Home Screen for the best experience and to receive notifications
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1.5 rounded-lg text-gray-400 hover:bg-[#1c1c1c] hover:text-white transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
