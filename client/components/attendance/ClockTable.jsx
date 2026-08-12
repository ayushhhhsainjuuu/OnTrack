"use client";

import { Clock3, MapPin } from "lucide-react";

const statusStyles = {
  Completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",

  "In Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",

  "Outside Geofence":
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
};

function Initials({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
      {initials}
    </div>
  );
}

export default function ClockTable({ records = [] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 dark:border-[#262626] dark:bg-[#121212] dark:hover:border-[#333333] dark:hover:shadow-lg dark:hover:shadow-black/40">
      <div className="border-b border-gray-100 px-5 py-4 dark:border-[#262626]">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Employee Clock Records
        </h2>

        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
          Clock-in, clock-out, and worked-hour records from the last 30 days.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <Clock3
            size={28}
            className="mx-auto text-gray-300 dark:text-slate-600"
          />

          <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
            No clock records found
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-[#262626] dark:bg-[#1a1a1a]/60">
                {[
                  "Employee",
                  "Date",
                  "Clock In",
                  "Clock Out",
                  "Total",
                  "Status",
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
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="transition hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={record.employee} />

                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {record.employee}
                        </p>

                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                          <MapPin size={11} />
                          {record.role} · {record.site}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-600 dark:text-slate-300">
                    {record.date}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {record.clockIn}
                  </td>

                  <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {record.clockOut}
                  </td>

                  <td className="px-5 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                    {record.totalHours == null
                      ? "—"
                      : `${record.totalHours.toFixed(2)}h`}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[record.status] || ""
                      }`}
                    >
                      {record.status}
                    </span>
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
