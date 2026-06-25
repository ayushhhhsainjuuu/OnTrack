"use client";

import { useState } from "react";

const mockAttendance = [
  { date: "Mon Jun 9", clockIn: "9:02 AM", clockOut: "5:03 PM", hours: "8.0", status: "On Time" },
  { date: "Sun Jun 8", clockIn: "10:00 AM", clockOut: "6:00 PM", hours: "8.0", status: "On Time" },
  { date: "Sat Jun 7", clockIn: "9:35 AM", clockOut: "5:30 PM", hours: "7.9", status: "Late" },
  { date: "Fri Jun 6", clockIn: "9:00 AM", clockOut: "5:01 PM", hours: "8.0", status: "On Time" },
  { date: "Thu Jun 5", clockIn: "–", clockOut: "–", hours: "0", status: "Day Off" },
];

const mockSchedule = [
  { date: "Tue Jun 10", label: "Today", shift: "10:00 AM – 6:00 PM", role: "Server" },
  { date: "Wed Jun 11", label: "Tomorrow", shift: "9:00 AM – 5:00 PM", role: "Server" },
  { date: "Thu Jun 12", label: "In 2 days", shift: "Day Off", role: "–" },
  { date: "Fri Jun 13", label: "In 3 days", shift: "10:00 AM – 6:00 PM", role: "Server" },
];

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function statusClass(status) {
  if (status === "On Time") return "bg-emerald-100 text-emerald-700";
  if (status === "Late") return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function EmployeeDashboard({ user }) {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState(null);

  function handleClock() {
    if (!clockedIn) {
      setClockTime(new Date().toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }));
    } else {
      setClockTime(null);
    }
    setClockedIn((v) => !v);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Status"
          value={clockedIn ? "Clocked In" : "Clocked Out"}
          sub={clockedIn ? `Since ${clockTime}` : "Not started"}
          accent={clockedIn ? "text-emerald-600" : "text-gray-900"}
        />
        <StatCard label="Hours This Week" value="32.5h" sub="Target: 40h" />
        <StatCard label="Leave Balance" value="12 days" sub="remaining" accent="text-blue-600" />
        <StatCard label="Next Shift" value="Tomorrow" sub="10:00 AM – 6:00 PM" accent="text-purple-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center gap-5">
          <div
            className={`h-24 w-24 rounded-full flex items-center justify-center border-4 shadow-lg transition-all ${clockedIn ? "border-emerald-500 bg-emerald-50 shadow-emerald-200" : "border-gray-300 bg-gray-100 shadow-gray-200"}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-10 h-10 ${clockedIn ? "text-emerald-600" : "text-gray-400"}`}>
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-900">{clockedIn ? "You're clocked in" : "You're clocked out"}</p>
            <p className="text-sm text-gray-500">{clockedIn ? `Started at ${clockTime}` : "GPS verification required"}</p>
          </div>
          <button
            onClick={handleClock}
            className={`w-full max-w-xs rounded-2xl px-6 py-3.5 text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 text-white ${clockedIn ? "bg-rose-600 hover:bg-rose-500" : "bg-blue-700 hover:bg-blue-800"}`}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </button>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            GPS: Verified · Within geofence
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Schedule</h3>
          <div className="space-y-3">
            {mockSchedule.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ${i === 0 ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-100"}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.date}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{s.shift}</p>
                  <p className="text-xs text-gray-500">{s.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Attendance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Clock In</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Clock Out</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Hours</th>
                <th className="text-left text-xs font-medium text-gray-500 pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockAttendance.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-gray-900">{row.date}</td>
                  <td className="py-3 text-gray-600">{row.clockIn}</td>
                  <td className="py-3 text-gray-600">{row.clockOut}</td>
                  <td className="py-3 text-gray-600">{row.hours}h</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}