"use client";

import { Building2, Users, Activity, AlertTriangle } from "lucide-react";

const companies = [
  { name: "ServiceMaster Janitorial", staff: 42, sites: 5, active: 28, status: "Healthy" },
  { name: "24-Hour Facility Maint.", staff: 45, sites: 6, active: 31, status: "Healthy" },
];

const recentActivity = [
  { who: "Sara Ali", action: "approved 3 leave requests", when: "12 min ago", type: "approval" },
  { who: "Henry Tran", action: "published next week's schedule", when: "1 hr ago", type: "schedule" },
  { who: "System", action: "ServiceMaster payroll export completed", when: "3 hrs ago", type: "system" },
  { who: "Maria Lopez", action: "submitted a leave request", when: "5 hrs ago", type: "request" },
];

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

const activityDot = {
  approval: "bg-emerald-500",
  schedule: "bg-blue-500",
  system: "bg-gray-400",
  request: "bg-amber-500",
};

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin</h1>
        <p className="text-sm text-gray-500">Platform-wide overview across all companies</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Companies" value="2" sub="both active" icon={Building2} />
        <StatCard label="Total Staff" value="87" sub="+8 this month" accent="text-blue-600" icon={Users} />
        <StatCard label="On Shift Now" value="59" sub="across all sites" accent="text-emerald-600" icon={Activity} />
        <StatCard label="Pending Approvals" value="7" sub="needs attention" accent="text-amber-600" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Companies</h3>
          <div className="space-y-3">
            {companies.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.staff} staff · {c.sites} sites</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">{c.active} on shift</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${activityDot[a.type]}`} />
                <div>
                  <p className="text-sm text-gray-900"><span className="font-medium">{a.who}</span> {a.action}</p>
                  <p className="text-xs text-gray-400">{a.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}