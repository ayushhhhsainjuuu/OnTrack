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

const activityDot = {
  approval: "bg-emerald-500",
  schedule: "bg-blue-500",
  system: "bg-gray-400",
  request: "bg-amber-500",
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

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Super Admin
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Platform-wide overview across all companies
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Companies" value="2" sub="both active" icon={Building2} />
        <StatCard label="Total Staff" value="87" sub="+8 this month" accent="text-blue-600 dark:text-blue-400" icon={Users} />
        <StatCard label="On Shift Now" value="59" sub="across all sites" accent="text-emerald-600 dark:text-emerald-400" icon={Activity} />
        <StatCard label="Pending Approvals" value="7" sub="needs attention" accent="text-amber-600 dark:text-amber-400" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Companies
          </h3>

          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.name}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {company.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {company.staff} staff · {company.sites} sites
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {company.active} on shift
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {company.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>

          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={`${activity.who}-${activity.when}`} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityDot[activity.type]}`} />

                <div>
                  <p className="text-sm text-gray-900 dark:text-slate-100">
                    <span className="font-medium">{activity.who}</span>{" "}
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {activity.when}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
