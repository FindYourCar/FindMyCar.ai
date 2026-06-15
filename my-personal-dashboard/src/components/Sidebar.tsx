"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Wallet, ListTodo, Menu, X, BrainCircuit, LineChart } from "lucide-react";
import { useState } from "react";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import NotificationBell from "@/components/NotificationBell";
import NotificationsToggle from "@/components/NotificationsToggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/budget", label: "Budget", icon: Wallet },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/cfo", label: "CFO", icon: BrainCircuit },
  { href: "/portfolio", label: "Portfolio", icon: LineChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-[#0d0d0d] sticky top-0 z-40">
        <span className="text-lg font-bold tracking-tight">My Dashboard</span>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <CurrencySwitcher />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="Toggle navigation"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {open && (
        <nav className="md:hidden border-b border-border bg-[#0d0d0d] px-2 py-2 sticky top-[53px] z-40">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                  active
                    ? "bg-surface text-white"
                    : "text-gray-400 hover:bg-surface hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div className="px-3 py-2.5">
            <NotificationsToggle />
          </div>
        </nav>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 border-r border-border bg-[#0d0d0d] px-4 py-6">
        <div className="px-2 mb-8 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight">My Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">Personal Hub</p>
          </div>
          <NotificationBell />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? "bg-surface text-white"
                    : "text-gray-400 hover:bg-surface hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-2 pt-4 flex flex-col gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Currency</p>
            <CurrencySwitcher className="w-full" />
          </div>
          <NotificationsToggle />
        </div>
      </aside>
    </>
  );
}
