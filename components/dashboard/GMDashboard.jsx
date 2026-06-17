"use client";

const mockDepartments = [
  { name: "Front of House", manager: "Sarah L.", total: 12, present: 10, onLeave: 1, absent: 1, rate: 83 },
  { name: "Kitchen", manager: "Marco R.", total: 8, present: 7, onLeave: 0, absent: 1, rate: 88 },
  { name: "Bar", manager: "Jamie K.", total: 5, present: 5, onLeave: 0, absent: 0, rate: 100 },
  { name: "Management", manager: "–", total: 3, present: 2, onLeave: 1, absent: 0, rate: 67 },
];

const mockAlerts = [
  { type: "warning", message: "Front of House understaffed for Friday evening (Jun 13)" },
  { type: "info", message: "3 leave requests pending approval across 2 departments" },
  { type: "warning", message: "Kitchen has 1 unscheduled absence today" },
];

const weeklyRates = [85, 91, 88, 93, 89, 78, 95];
const weekDays = ["M", "T", "W", "T", "F", "S", "S"];

function StatCard({ label, value, change, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-white"}`}>{value}</p>
      {change && <p className="mt-1 text-xs text-slate-400">{change}</p>}
    </div>
  );
}

function RateBar({ pct }) {
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-rose-500";
  const text = pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-amber-400" : "text-rose-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold shrink-0 ${text}`}>{pct}%</span>
    </div>
  );
}

export default function GMDashboard() {
  const totalStaff = mockDepartments.reduce((s, d) => s + d.total, 0);
  const totalPresent = mockDepartments.reduce((s, d) => s + d.present, 0);
  const overallRate = Math.round((totalPresent / totalStaff) * 100);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Employees" value={totalStaff} change="+2 this month" />
        <StatCard label="Attendance Rate" value={`${overallRate}%`} change="all departments" accent="text-emerald-400" />
        <StatCard label="Pending Approvals" value="5" change="3 leave · 2 schedule" accent="text-amber-400" />
        <StatCard label="Departments" value={mockDepartments.length} change="all active" accent="text-purple-300" />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white mb-4">Department Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Department</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3">Manager</th>
                <th className="text-center text-xs font-medium text-slate-400 pb-3">Total</th>
                <th className="text-center text-xs font-medium text-slate-400 pb-3">Present</th>
                <th className="text-center text-xs font-medium text-slate-400 pb-3">On Leave</th>
                <th className="text-center text-xs font-medium text-slate-400 pb-3">Absent</th>
                <th className="text-left text-xs font-medium text-slate-400 pb-3 min-w-[140px]">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {mockDepartments.map((dept, i) => (
                <tr key={i} className="hover:bg-white/[0.03]">
                  <td className="py-3 text-white font-medium">{dept.name}</td>
                  <td className="py-3 text-slate-400">{dept.manager}</td>
                  <td className="py-3 text-center text-slate-300">{dept.total}</td>
                  <td className="py-3 text-center text-emerald-400 font-medium">{dept.present}</td>
                  <td className="py-3 text-center text-blue-400">{dept.onLeave}</td>
                  <td className="py-3 text-center text-rose-400">{dept.absent}</td>
                  <td className="py-3">
                    <RateBar pct={dept.rate} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Alerts & Notices</h3>
          <div className="space-y-3">
            {mockAlerts.map((alert, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 border text-sm leading-relaxed ${
                  alert.type === "warning"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Weekly Attendance Trend</h3>
            <span className="text-xs text-slate-400">Jun 4–10</span>
          </div>
          <div className="flex items-end gap-2.5 h-28">
            {weeklyRates.map((pct, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">{pct}%</span>
                <div
                  className={`w-full rounded-t-lg ${pct >= 90 ? "bg-emerald-500/60" : pct >= 80 ? "bg-blue-500/60" : "bg-amber-500/60"}`}
                  style={{ height: `${(pct / 100) * 72}px` }}
                />
                <span className="text-[10px] text-slate-400">{weekDays[i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">All departments · Jun 4–10, 2026</p>
        </div>
      </div>
    </div>
  );
}
