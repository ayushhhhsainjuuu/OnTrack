"use client";

import { Users, Clock, CalendarCheck, AlertTriangle } from "lucide-react";

const team = [
  { name: "Maria Lopez", role: "Cleaner", site: "Tower A", status: "On Shift" },
  { name: "Henry Tran", role: "Foreman", site: "Tower B", status: "On Shift" },
  { name: "Sara Ali", role: "Cleaner", site: "Plaza", status: "On Leave" },
  { name: "Dev Patel", role: "Lead", site: "Tower A", status: "Off" },
  { name: "Anita Rao", role: "Cleaner", site: "Tower B", status: "On Shift" },
];

const approvals = [
  { name: "Sara Ali", type: "Leave request", detail: "Jun 14–16 · 3 days", when: "2 hrs ago" },
  { name: "Dev Patel", type: "Shift swap", detail: "Fri → Sat", when: "5 hrs ago" },
  { name: "Anita Rao", type: "Overtime", detail: "+2.5 hrs Thursday", when: "yesterday" },
];

const statusPill = {
  "On Shift": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "On Leave": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Off: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300",
};

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && <Icon size={18} className="text-gray-400 dark:text-slate-500" />}
      </div>

      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900 dark:text-white"}`}>
        {value}
      </p>

      {sub && (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Manage your team, shifts, and approvals
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Team Size" value="12" sub="2 sites" icon={Users} />
        <StatCard label="On Shift Now" value="7" sub="of 12" accent="text-emerald-600 dark:text-emerald-400" icon={Clock} />
        <StatCard label="Shifts This Week" value="48" sub="3 unfilled" accent="text-blue-600 dark:text-blue-400" icon={CalendarCheck} />
        <StatCard label="Pending Approvals" value="3" sub="needs review" accent="text-amber-600 dark:text-amber-400" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Team
          </h3>

          <div className="space-y-2">
            {team.map((worker) => (
              <div
                key={worker.name}
                className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-slate-700 dark:text-slate-200">
                    {worker.name
                      .split(" ")
                      .map((name) => name[0])
                      .join("")}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {worker.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {worker.role} · {worker.site}
                    </p>
                  </div>
                </div>

                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusPill[worker.status] || ""}`}>
                  {worker.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Pending Approvals
          </h3>

          <div className="space-y-3">
            {approvals.map((approval) => (
              <div
                key={`${approval.name}-${approval.when}`}
                className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {approval.name}
                  </p>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {approval.when}
                  </span>
                </div>

                <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                  {approval.type} · {approval.detail}
                </p>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-700"
                  >
                    Approve
                  </button>

                  <button
                    type="button"
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
