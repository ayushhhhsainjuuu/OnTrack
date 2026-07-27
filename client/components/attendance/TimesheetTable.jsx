"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  FileClock,
  RotateCcw,
} from "lucide-react";

const statusStyles = {
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",

  Pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",

  "Needs Review":
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

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

export default function TimesheetTable({
  initialTimesheets = [],
}) {
  const [timesheets, setTimesheets] = useState(
    initialTimesheets
  );

  useEffect(() => {
    setTimesheets(initialTimesheets);
  }, [initialTimesheets]);

  const updateStatus = (timesheetId, status) => {
    setTimesheets((currentTimesheets) =>
      currentTimesheets.map((timesheet) =>
        timesheet.id === timesheetId
          ? { ...timesheet, status }
          : timesheet
      )
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Employee Timesheets
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Review regular hours, overtime, totals, and approval status.
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
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/60">
                {[
                  "Employee",
                  "Pay Period",
                  "Regular Hours",
                  "Overtime",
                  "Total Hours",
                  "Status",
                  "Actions",
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

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {timesheets.map((timesheet) => (
                <tr
                  key={timesheet.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
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

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[timesheet.status] || ""
                      }`}
                    >
                      {timesheet.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Eye size={13} />
                        View
                      </button>

                      {timesheet.status !== "Approved" ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              timesheet.id,
                              "Approved"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          <Check size={13} />
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              timesheet.id,
                              "Pending"
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          <RotateCcw size={13} />
                          Reopen
                        </button>
                      )}
                    </div>
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