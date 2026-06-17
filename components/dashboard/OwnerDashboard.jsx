"use client";

const businessKPIs = [
  { label: "Total Employees", value: "28", change: "+2 this month", accent: "text-white" },
  { label: "Attendance Today", value: "82%", change: "23 of 28 present", accent: "text-emerald-400" },
  { label: "Open Leave Requests", value: "5", change: "Needs approval", accent: "text-amber-400" },
  { label: "Labor Hours (Week)", value: "312h", change: "vs 320h target", accent: "text-blue-300" },
];

const departments = [
  { name: "Front of House", head: "Sarah L.", employees: 12, attendance: 83, status: "understaffed" },
  { name: "Kitchen", head: "Marco R.", employees: 8, attendance: 88, status: "ok" },
  { name: "Bar", head: "Jamie K.", employees: 5, attendance: 100, status: "good" },
  { name: "Management", head: "David R.", employees: 3, attendance: 67, status: "warning" },
];

const activity = [
  { time: "11:23 AM", msg: "Riley Kim's leave request approved (Front of House)" },
  { time: "10:55 AM", msg: "New hire onboarding: Morgan Liu (Bus Staff)" },
  { time: "10:01 AM", msg: "Kitchen hit 100% attendance at shift start" },
  { time: "9:30 AM", msg: "Schedule conflict flagged — Front of House Fri evening" },
  { time: "Yesterday", msg: "Payroll report submitted for period ending Jun 6" },
];

const weeklyData = [
  { day: "Mon", rate: 92, hours: 52 },
  { day: "Tue", rate: 89, hours: 51 },
  { day: "Wed", rate: 85, hours: 48 },
  { day: "Thu", rate: 93, hours: 54 },
  { day: "Fri", rate: 88, hours: 50 },
  { day: "Sat", rate: 78, hours: 44 },
  { day: "Sun", rate: 95, hours: 56 },
];

function KPICard({ label, value, change, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{change}</p>
    </div>
  );
}

function deptStyle(status) {
  const map = {
    good: { badge: "bg-emerald-500/15 text-emerald-400", rate: "text-emerald-400" },
    ok: { badge: "bg-blue-500/15 text-blue-400", rate: "text-blue-400" },
    warning: { badge: "bg-amber-500/15 text-amber-400", rate: "text-amber-400" },
    understaffed: { badge: "bg-rose-500/15 text-rose-400", rate: "text-rose-400" },
  };
  return map[status] || map.ok;
}

const deptStatusLabel = { good: "Good", ok: "OK", warning: "Warning", understaffed: "Understaffed" };

export default function OwnerDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {businessKPIs.map((k, i) => (
          <KPICard key={i} {...k} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Department Health</h3>
          <div className="space-y-3">
            {departments.map((dept, i) => {
              const s = deptStyle(dept.status);
              return (
                <div
                  key={i}
                  className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{dept.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
                        {deptStatusLabel[dept.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Head: {dept.head} · {dept.employees} employees
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${s.rate}`}>{dept.attendance}%</p>
                    <p className="text-xs text-slate-400">attendance</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                <div>
                  <p className="text-sm text-white leading-snug">{item.msg}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Weekly Labor Overview</h3>
          <span className="text-xs text-slate-400">Jun 4–10, 2026</span>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {weeklyData.map((d, i) => {
            const barColor = d.rate >= 90 ? "bg-emerald-500/50" : d.rate >= 80 ? "bg-blue-500/50" : "bg-amber-500/50";
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] text-slate-400">{d.rate}%</span>
                <div className="w-full h-16 rounded-lg bg-white/[0.06] relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 rounded-b-lg ${barColor}`}
                    style={{ height: `${d.rate}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-300">{d.day}</span>
                <span className="text-[10px] text-slate-500">{d.hours}h</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500/60" />≥90%</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500/60" />80–89%</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500/60" />&lt;80%</span>
        </div>
      </div>
    </div>
  );
}
