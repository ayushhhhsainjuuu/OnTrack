"use client";

import { FileClock } from "lucide-react";

function Initials({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
      {initials}
    </div>
  );
}

export default function TimesheetTable({ timesheets = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 dark:border-[#262626] dark:bg-[#121212] dark:hover:border-[#333333] dark:hover:shadow-lg dark:hover:shadow-black/40">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-[#262626]">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Employee Timesheets
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Regular vs. overtime hours (over 40h/week), computed from real clock
          records for the current pay period.
        </p>
      </div>

      {timesheets.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <FileClock
            size={28}
            className="mx-auto text-gray-300 dark:text-slate-600"
          />

          <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            No timesheets found
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            No completed shifts yet this pay period, or try changing your search.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-[#262626] dark:bg-[#1a1a1a]/60">
                {[
                  "Employee",
                  "Pay Period",
                  "Regular Hours",
                  "Overtime",
                  "Total Hours",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-[#262626]">
              {timesheets.map((timesheet) => (
                <tr
                  key={timesheet.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={timesheet.employee} />

                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {timesheet.employee}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                          {timesheet.role}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                    {timesheet.period}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                    {timesheet.regularHours.toFixed(1)}h
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-amber-600 dark:text-amber-400">
                    {timesheet.overtimeHours.toFixed(1)}h
                  </td>

                  <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">
                    {timesheet.totalHours.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
