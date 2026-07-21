"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Umbrella,
  Plus,
  CheckCircle2,
  Clock,
} from "lucide-react";

const week = [
  { day: "MON", date: 9, role: "Server", color: "text-blue-600 dark:text-blue-400", time: "9:00 AM", end: "to 5:00 PM" },
  { day: "TUE", date: 10, role: "Server", color: "text-blue-600 dark:text-blue-400", time: "10:00 AM", end: "to 6:00 PM", today: true },
  { day: "WED", date: 11, role: "Server", color: "text-blue-600 dark:text-blue-400", time: "9:00 AM", end: "to 5:00 PM" },
  { day: "THU", date: 12, off: true },
  { day: "FRI", date: 13, role: "Server", color: "text-blue-600 dark:text-blue-400", time: "10:00 AM", end: "to 6:00 PM" },
  { day: "SAT", date: 14, role: "Lead", color: "text-purple-600 dark:text-purple-400", time: "11:00 AM", end: "to 7:00 PM" },
  { day: "SUN", date: 15, off: true },
];

const balances = [
  { label: "Annual", remaining: 12, used: 5, total: 17, bar: "bg-blue-600", pct: 29 },
  { label: "Sick", remaining: 8, used: 2, total: 10, bar: "bg-emerald-500", pct: 20 },
  { label: "Personal", remaining: 2, used: 1, total: 3, bar: "bg-amber-500", pct: 33 },
];

const requests = [
  { type: "Annual Leave", range: "Jun 20 – Jun 21 · 2 days", submitted: "Jun 5", status: "Approved" },
  { type: "Sick Leave", range: "Jun 18 · 1 day", submitted: "Jun 9", status: "Pending" },
  { type: "Annual Leave", range: "Jul 4 – Jul 7 · 4 days", submitted: "Jun 8", status: "Pending" },
];

const cardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]";

export default function SchedulePage() {
  const [tab, setTab] = useState("schedule");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Schedule & Leave
        </p>
        <h1 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">
          Schedule & Leave
        </h1>
      </div>

      <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
        {["schedule", "leave"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === item
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {item === "schedule" ? "My Schedule" : "Leave"}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                June 2025
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Week of Jun 9 – Jun 15
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[ChevronLeft, ChevronRight].map((Icon, index) => (
                <button
                  key={index}
                  type="button"
                  className={`rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 ${
                    index === 1 ? "order-3" : ""
                  }`}
                >
                  <Icon size={16} />
                </button>
              ))}

              <button
                type="button"
                className="order-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Today
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {week.map((day) => (
              <div
                key={day.date}
                className={`rounded-2xl border p-4 shadow-sm transition-colors ${
                  day.today
                    ? "border-blue-300 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/35"
                    : "border-gray-200 bg-white dark:border-slate-700 dark:bg-[#111c2d]"
                }`}
              >
                <p className="text-xs font-medium text-gray-400 dark:text-slate-500">
                  {day.day}
                </p>

                <p
                  className={`text-2xl font-bold ${
                    day.today
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {day.date}
                </p>

                {day.off ? (
                  <div className="mt-6 text-center">
                    <p className="text-lg text-gray-300 dark:text-slate-600">–</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Day off
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${day.color}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {day.role}
                    </span>

                    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      {day.time}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {day.end}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { value: "5", label: "Shifts This Week", sub: "out of 7 days", color: "text-gray-900 dark:text-white" },
              { value: "40h", label: "Total Hours", sub: "scheduled", color: "text-gray-900 dark:text-white" },
              { value: "2", label: "Days Off", sub: "Thu & Sun", color: "text-purple-600 dark:text-purple-400" },
            ].map((item) => (
              <div key={item.label} className={`${cardClass} p-6 text-center`}>
                <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
                <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {balances.map((balance) => (
              <div key={balance.label} className={`${cardClass} p-5`}>
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {balance.label}
                  </p>
                  <Umbrella size={16} className="text-gray-300 dark:text-slate-600" />
                </div>

                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {balance.remaining}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  days remaining
                </p>

                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${balance.bar}`}
                    style={{ width: `${balance.pct}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                  {balance.used} used of {balance.total}
                </p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Leave Requests
            </h2>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              <Plus size={16} />
              New Request
            </button>
          </div>

          <div className={`${cardClass} divide-y divide-gray-100 dark:divide-slate-700`}>
            {requests.map((request) => {
              const approved = request.status === "Approved";

              return (
                <div
                  key={`${request.type}-${request.range}`}
                  className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        approved
                          ? "bg-emerald-100 dark:bg-emerald-950/50"
                          : "bg-amber-100 dark:bg-amber-950/50"
                      }`}
                    >
                      {approved ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {request.type}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {request.range}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 dark:text-slate-500">
                      Submitted {request.submitted}
                    </span>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        approved
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                      }`}
                    >
                      {request.status}
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
