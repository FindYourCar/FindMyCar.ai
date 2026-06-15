"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";

const WORK_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

type Mode = "work" | "break";

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function notify(message: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification("Focus Timer", { body: message, icon: "/icon.svg" }))
      .catch(() => {
        try {
          new Notification("Focus Timer", { body: message });
        } catch {
          // ignore — Notification API can throw in some environments
        }
      });
    return;
  }

  try {
    new Notification("Focus Timer", { body: message });
  } catch {
    // ignore
  }
}

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Timer finished — switch modes
        setMode((prevMode) => {
          if (prevMode === "work") {
            setSessionCount((c) => c + 1);
            notify("Work session complete! Time for a 5-minute break.");
            return "break";
          }
          notify("Break's over! Ready for another focus session?");
          return "work";
        });

        return 0;
      });
    }, 1000);

    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  // When the mode flips after hitting zero, load the new duration.
  useEffect(() => {
    if (secondsLeft === 0) {
      setSecondsLeft(mode === "work" ? WORK_SECONDS : BREAK_SECONDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  function toggleRunning() {
    setRunning((r) => !r);
  }

  function handleReset() {
    setRunning(false);
    setMode("work");
    setSecondsLeft(WORK_SECONDS);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center">
            <Timer size={18} />
          </div>
          <div>
            <h2 className="font-semibold">Focus Timer</h2>
            <p className="text-xs text-gray-500">{mode === "work" ? "Work session" : "Break time"}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">Session #{sessionCount + 1}</span>
      </div>

      <div className="flex items-center justify-center py-2">
        <span className="text-5xl font-bold tabular-nums tracking-tight">{formatTime(secondsLeft)}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleRunning}
          className="flex-1 flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#c9a431] transition-colors text-black font-medium rounded-lg py-2.5 text-sm"
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          onClick={handleReset}
          aria-label="Reset timer"
          className="flex items-center justify-center gap-2 bg-[#1c1c1c] border border-border hover:bg-[#262626] transition-colors text-sm font-medium rounded-lg px-4 py-2.5"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
