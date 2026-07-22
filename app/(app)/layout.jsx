"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarRange, CheckSquare, Settings, Bell, Menu, FolderKanban } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CAN_VIEW_PROJECTS_ROLES = ["owner", "general manager (gm)"];

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: CAN_VIEW_PROJECTS_ROLES },
  { href: "/schedule", label: "Schedule & Leave", icon: CalendarRange },
  { href: "/task", label: "Tasks", icon: CheckSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [canViewProjects, setCanViewProjects] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = (
        data?.user?.user_metadata?.role ||
        data?.user?.app_metadata?.role ||
        ""
      ).toLowerCase();
      setCanViewProjects(CAN_VIEW_PROJECTS_ROLES.includes(role));
    });
  }, []);

  const nav = baseNav.filter((item) => !item.roles || canViewProjects);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b1b3f] text-white flex flex-col transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo */}
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 h-16 border-b border-white/10">
          <img src="/ontrack-logo.png" alt="OnTrack" className="h-9 w-9 rounded-xl" />
          <span className="font-bold text-lg">OnTrack</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-[#2563eb] text-white shadow-lg"
                    : "text-slate-300 hover:bg-[#16294f] hover:text-white"
                }`}
              >
                <Icon size={18} /> {label}
                {active && <span className="ml-auto text-white/70">›</span>}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="h-9 w-9 rounded-full bg-[#2563eb] flex items-center justify-center text-sm font-semibold">NA</div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Nathan A.</p>
              <p className="text-xs text-slate-400 truncate">Server · Floor 2</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center h-16 px-4 md:px-8 bg-white/80 backdrop-blur border-b border-gray-200">
          <button className="md:hidden p-2 -ml-2 text-gray-600" onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
            </button>
            <div className="h-9 w-9 rounded-full bg-[#2563eb] text-white flex items-center justify-center text-sm font-semibold">NA</div>
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}