"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Umbrella, Plus, CheckCircle2, Clock } from "lucide-react";

const week = [
  { day: "MON", date: 9,  role: "Server", color: "text-blue-600",   time: "9:00 AM", end: "to 5:00 PM" },
  { day: "TUE", date: 10, role: "Server", color: "text-blue-600",   time: "10:00 AM", end: "to 6:00 PM", today: true },
  { day: "WED", date: 11, role: "Server", color: "text-blue-600",   time: "9:00 AM", end: "to 5:00 PM" },
  { day: "THU", date: 12, off: true },
  { day: "FRI", date: 13, role: "Server", color: "text-blue-600",   time: "10:00 AM", end: "to 6:00 PM" },
  { day: "SAT", date: 14, role: "Lead",   color: "text-purple-600", time: "11:00 AM", end: "to 7:00 PM" },
  { day: "SUN", date: 15, off: true },
];

const balances = [
  { label: "Annual",   remaining: 12, used: 5, total: 17, bar: "bg-blue-600",    pct: 29 },
  { label: "Sick",     remaining: 8,  used: 2, total: 10, bar: "bg-emerald-500", pct: 20 },
  { label: "Personal", remaining: 2,  used: 1, total: 3,  bar: "bg-amber-500",   pct: 33 },
];

const requests = [
  { type: "Annual Leave", range: "Jun 20 – Jun 21 · 2 days", submitted: "Jun 5", status: "Approved" },
  { type: "Sick Leave",   range: "Jun 18 · 1 day",           submitted: "Jun 9", status: "Pending" },
  { type: "Annual Leave", range: "Jul 4 – Jul 7 · 4 days",   submitted: "Jun 8", status: "Pending" },
];

export default function SchedulePage() {
  const [tab, setTab] = useState("schedule");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule & Leave</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Schedule & Leave</h1>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1">
        {["schedule", "leave"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "schedule" ? "My Schedule" : "Leave"}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <>
          {/* Week header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">June 2025</h2>
              <p className="text-xs text-gray-500">Week of Jun 9 – Jun 15</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={16} /></button>
              <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Today</button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {week.map((d) => (
              <div
                key={d.date}
                className={`rounded-2xl border p-4 ${d.today ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white"} shadow-sm`}
              >
                <p className="text-xs font-medium text-gray-400">{d.day}</p>
                <p className={`text-2xl font-bold ${d.today ? "text-blue-600" : "text-gray-900"}`}>{d.date}</p>
                {d.off ? (
                  <div className="mt-6 text-center">
                    <p className="text-gray-300 text-lg">–</p>
                    <p className="text-xs text-gray-400">Day off</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.color}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {d.role}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-2">{d.time}</p>
                    <p className="text-xs text-gray-500">{d.end}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { v: "5", l: "Shifts This Week", s: "out of 7 days", c: "text-gray-900" },
              { v: "40h", l: "Total Hours", s: "scheduled", c: "text-gray-900" },
              { v: "2", l: "Days Off", s: "Thu & Sun", c: "text-purple-600" },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <p className={`text-3xl font-bold ${x.c}`}>{x.v}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{x.l}</p>
                <p className="text-xs text-gray-400">{x.s}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Leave balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {balances.map((b) => (
              <div key={b.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{b.label}</p>
                  <Umbrella size={16} className="text-gray-300" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{b.remaining}</p>
                <p className="text-xs text-gray-500">days remaining</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${b.pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{b.used} used of {b.total}</p>
              </div>
            ))}
          </div>

          {/* Requests */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Leave Requests</h2>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition">
              <Plus size={16} /> New Request
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {requests.map((r, i) => {
              const approved = r.status === "Approved";
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${approved ? "bg-emerald-100" : "bg-amber-100"}`}>
                      {approved ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Clock size={16} className="text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.type}</p>
                      <p className="text-xs text-gray-500">{r.range}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Submitted {r.submitted}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}