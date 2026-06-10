"use client";

import { useState } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import GMDashboard from "@/components/dashboard/GMDashboard";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import { ROLE_LABELS } from "@/utils/roles";

const DEMO_USERS = {
  employee: { name: "Jordan Park", initials: "JP", email: "jordan.park@company.com" },
  manager: { name: "Sarah Liu", initials: "SL", email: "sarah.liu@company.com" },
  gm: { name: "David Reyes", initials: "DR", email: "d.reyes@company.com" },
  owner: { name: "Alex Carter", initials: "AC", email: "alex.carter@company.com" },
};

const PAGE_TITLES = {
  employee: "My Dashboard",
  manager: "Manager Dashboard",
  gm: "GM Overview",
  owner: "Owner Overview",
};

const ROLE_ORDER = ["employee", "manager", "gm", "owner"];

export default function DashboardPage() {
  const [role, setRole] = useState("employee");
  const user = DEMO_USERS[role];

  const dashboards = {
    employee: <EmployeeDashboard user={user} />,
    manager: <ManagerDashboard user={user} />,
    gm: <GMDashboard user={user} />,
    owner: <OwnerDashboard user={user} />,
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dev role switcher */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-1.5 bg-[#07182f]/95 border-b border-blue-900/40 px-4 py-2 backdrop-blur-sm">
        <span className="text-xs text-slate-400 font-medium mr-2 hidden sm:inline">Preview role:</span>
        {ROLE_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              role === key
                ? "bg-[#062B63] text-white shadow-md"
                : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {ROLE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex-1 pt-9">
        <DashboardShell role={role} user={user} currentPage={PAGE_TITLES[role]}>
          {dashboards[role]}
        </DashboardShell>
      </div>
    </div>
  );
}
