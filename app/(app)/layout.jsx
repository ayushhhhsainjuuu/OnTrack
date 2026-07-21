"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  Settings,
  Bell,
  Menu,
  Loader2,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const nav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/schedule",
    label: "Schedule & Leave",
    icon: CalendarRange,
  },
  {
    href: "/task",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const {
    name,
    role,
    initials,
    isLoading,
  } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0b1b3f] text-white transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
          <img
            src="/ontrack-logo.png"
            alt="OnTrack"
            className="h-9 w-9 rounded-xl"
          />
          <span className="text-lg font-bold">OnTrack</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#2563eb] text-white shadow-lg"
                    : "text-slate-300 hover:bg-[#16294f] hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}

                {active && (
                  <span className="ml-auto text-white/70">
                    ›
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold">
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {isLoading ? "Loading..." : name}
              </p>

              <p className="truncate text-xs text-slate-400">
                {isLoading ? "Checking account" : role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            className="-ml-2 p-2 text-gray-600 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}