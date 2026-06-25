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
  "On Shift": "bg-emerald-100 text-emerald-700",
  "On Leave": "bg-amber-100 text-amber-700",
  "Off": "bg-gray-100 text-gray-600",
};

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={18} className="text-gray-400" />}
      </div>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage your team, shifts, and approvals</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Team Size" value="12" sub="2 sites" icon={Users} />
        <StatCard label="On Shift Now" value="7" sub="of 12" accent="text-emerald-600" icon={Clock} />
        <StatCard label="Shifts This Week" value="48" sub="3 unfilled" accent="text-blue-600" icon={CalendarCheck} />
        <StatCard label="Pending Approvals" value="3" sub="needs review" accent="text-amber-600" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Team</h3>
          <div className="space-y-2">
            {team.map((w, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {w.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.name}</p>
                    <p className="text-xs text-gray-500">{w.role} · {w.site}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusPill[w.status] || ""}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-3">
            {approvals.map((a, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <span className="text-xs text-gray-400">{a.when}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.type} · {a.detail}</p>
                <div className="flex gap-2 mt-2">
                  <button className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Approve</button>
                  <button className="text-xs font-medium px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}