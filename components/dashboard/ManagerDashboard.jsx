"use client";

import { useState } from "react";

const mockTeam = [
  { name: "Jordan Park", role: "Server", status: "Clocked In", clockIn: "9:02 AM" },
  { name: "Alex Chen", role: "Cook", status: "Clocked In", clockIn: "8:55 AM" },
  { name: "Sam Torres", role: "Host", status: "Late", clockIn: "–" },
  { name: "Riley Kim", role: "Bartender", status: "On Leave", clockIn: "–" },
  { name: "Casey Nguyen", role: "Server", status: "Clocked In", clockIn: "9:00 AM" },
  { name: "Morgan Liu", role: "Bus Staff", status: "Off Today", clockIn: "–" },
];

const initialLeave = [
  { id: 1, name: "Sam Torres", type: "Sick Leave", dates: "Jun 12–13", days: 2, state: "pending" },
  { id: 2, name: "Alex Chen", type: "Vacation", dates: "Jun 20–27", days: 8, state: "pending" },
  { id: 3, name: "Riley Kim", type: "Personal", dates: "Jun 10", days: 1, state: "pending" },
];

const mockTasks = [
  { label: "Review Q2 schedules", due: "Today", priority: "High" },
  { label: "Approve leave requests", due: "Today", priority: "High" },
  { label: "Submit payroll hours", due: "Jun 13", priority: "Med" },
  { label: "Onboard new server (Morgan)", due: "Jun 15", priority: "Low" },
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-white"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function statusBadgeClass(status) {
  const map = {
    "Clocked In": "bg-emerald-500/15 text-emerald-400",
    Late: "bg-amber-500/15 text-amber-400",
    "On Leave": "bg-blue-500/15 text-blue-400",
    "Off Today": "bg-slate-500/15 text-slate-400",
    Absent: "bg-rose-500/15 text-rose-400",
  };
  return map[status] || "bg-slate-500/15 text-slate-400";
}

export default function ManagerDashboard() {
  const [leaveRequests, setLeaveRequests] = useState(initialLeave);
  const [tasks, setTasks] = useState(mockTasks.map((t) => ({ ...t, done: false })));

  const clockedIn = mockTeam.filter((m) => m.status === "Clocked In").length;
  const onLeave = mockTeam.filter((m) => m.status === "On Leave").length;
  const late = mockTeam.filter((m) => m.status === "Late").length;
  const absent = mockTeam.filter((m) => m.status === "Absent").length;
  const pending = leaveRequests.filter((r) => r.state === "pending").length;

  function resolveLeave(id, action) {
    setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, state: action } : r)));
  }

  function toggleTask(i) {
    setTasks((prev) => prev.map((t, idx) => (idx === i ? { ...t, done: !t.done } : t)));
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Team Size" value={mockTeam.length} sub="total members" />
        <StatCard label="Clocked In" value={clockedIn} sub="active now" accent="text-emerald-400" />
        <StatCard label="On Leave" value={onLeave} sub="today" accent="text-blue-300" />
        <StatCard label="Late / Absent" value={`${late} / ${absent}`} sub="today" accent="text-amber-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Today's Attendance</h3>
            <span className="text-xs text-slate-400">Jun 10, 2026</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Employee</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Clock In</th>
                  <th className="text-left text-xs font-medium text-slate-400 pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {mockTeam.map((member, i) => (
                  <tr key={i} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 text-white font-medium">{member.name}</td>
                    <td className="py-2.5 text-slate-400">{member.role}</td>
                    <td className="py-2.5 text-slate-400">{member.clockIn}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(member.status)}`}>
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Leave Requests</h3>
              {pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400">
                  {pending} pending
                </span>
              )}
            </div>
            <div className="space-y-3">
              {leaveRequests.map((req) => (
                <div key={req.id} className="rounded-xl bg-white/[0.05] border border-white/[0.08] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{req.name}</p>
                      <p className="text-xs text-slate-400">{req.type} · {req.dates} ({req.days}d)</p>
                    </div>
                    {req.state === "pending" ? (
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => resolveLeave(req.id, "approved")}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => resolveLeave(req.id, "denied")}
                          className="px-2 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    ) : (
                      <span className={`text-xs font-semibold shrink-0 ${req.state === "approved" ? "text-emerald-400" : "text-rose-400"}`}>
                        {req.state === "approved" ? "Approved" : "Denied"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white mb-4">Tasks</h3>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(i)}
                    className="h-3.5 w-3.5 rounded accent-blue-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${task.done ? "line-through text-slate-500" : "text-white"}`}>{task.label}</p>
                    <p className="text-xs text-slate-500">Due: {task.due}</p>
                  </div>
                  <span className={`text-xs font-medium shrink-0 ${task.priority === "High" ? "text-rose-400" : task.priority === "Med" ? "text-amber-400" : "text-slate-400"}`}>
                    {task.priority}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
