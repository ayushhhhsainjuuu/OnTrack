"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  FileClock,
  Search,
  Users,
} from "lucide-react";
import ClockTable from "@/components/attendance/ClockTable";
import TimesheetTable from "@/components/attendance/TimesheetTable";

const clockRecords = [
  {
    id: 1,
    employee: "Maria Lopez",
    role: "Cleaner",
    site: "Tower A",
    date: "Jul 21, 2026",
    clockIn: "8:02 AM",
    clockOut: "4:05 PM",
    breakTime: "30 min",
    totalHours: 7.55,
    status: "On Time",
  },
  {
    id: 2,
    employee: "Henry Tran",
    role: "Foreman",
    site: "Tower B",
    date: "Jul 21, 2026",
    clockIn: "7:45 AM",
    clockOut: "4:10 PM",
    breakTime: "30 min",
    totalHours: 7.92,
    status: "On Time",
  },
  {
    id: 3,
    employee: "Sara Ali",
    role: "Cleaner",
    site: "Plaza",
    date: "Jul 21, 2026",
    clockIn: "8:18 AM",
    clockOut: "4:02 PM",
    breakTime: "30 min",
    totalHours: 7.23,
    status: "Late",
  },
  {
    id: 4,
    employee: "Dev Patel",
    role: "Lead",
    site: "Tower A",
    date: "Jul 20, 2026",
    clockIn: "9:00 AM",
    clockOut: "5:30 PM",
    breakTime: "30 min",
    totalHours: 8,
    status: "On Time",
  },
  {
    id: 5,
    employee: "Anita Rao",
    role: "Cleaner",
    site: "Tower B",
    date: "Jul 20, 2026",
    clockIn: "—",
    clockOut: "—",
    breakTime: "—",
    totalHours: 0,
    status: "Absent",
  },
];

const timesheets = [
  {
    id: 1,
    employee: "Maria Lopez",
    role: "Cleaner",
    period: "Jul 14 – Jul 20",
    regularHours: 38,
    overtimeHours: 2.5,
    totalHours: 40.5,
    status: "Pending",
  },
  {
    id: 2,
    employee: "Henry Tran",
    role: "Foreman",
    period: "Jul 14 – Jul 20",
    regularHours: 40,
    overtimeHours: 4,
    totalHours: 44,
    status: "Approved",
  },
  {
    id: 3,
    employee: "Sara Ali",
    role: "Cleaner",
    period: "Jul 14 – Jul 20",
    regularHours: 32,
    overtimeHours: 0,
    totalHours: 32,
    status: "Pending",
  },
  {
    id: 4,
    employee: "Dev Patel",
    role: "Lead",
    period: "Jul 14 – Jul 20",
    regularHours: 40,
    overtimeHours: 1,
    totalHours: 41,
    status: "Approved",
  },
  {
    id: 5,
    employee: "Anita Rao",
    role: "Cleaner",
    period: "Jul 14 – Jul 20",
    regularHours: 35,
    overtimeHours: 0,
    totalHours: 35,
    status: "Needs Review",
  },
];

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  valueClass = "text-gray-900 dark:text-white",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {label}
          </p>

          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-gray-100 p-2.5 text-gray-500 dark:bg-slate-700 dark:text-slate-300">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState("clock-records");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredClockRecords = useMemo(() => {
    return clockRecords.filter((record) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        record.employee.toLowerCase().includes(searchValue) ||
        record.role.toLowerCase().includes(searchValue) ||
        record.site.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((timesheet) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        timesheet.employee.toLowerCase().includes(searchValue) ||
        timesheet.role.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        timesheet.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const pendingTimesheets = timesheets.filter(
    (timesheet) => timesheet.status === "Pending"
  ).length;

  const totalHours = timesheets.reduce(
    (total, timesheet) => total + timesheet.totalHours,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Clock In/Out
        </p>

        <h1 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">
          Attendance Management
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Review employee clock records and weekly timesheets.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Employees"
          value={timesheets.length}
          description="included in this pay period"
          icon={Users}
        />

        <SummaryCard
          label="Total Hours"
          value={`${totalHours.toFixed(1)}h`}
          description="across all employees"
          icon={Clock3}
          valueClass="text-blue-600 dark:text-blue-400"
        />

        <SummaryCard
          label="Pending Approval"
          value={pendingTimesheets}
          description="timesheets need review"
          icon={FileClock}
          valueClass="text-amber-600 dark:text-amber-400"
        />

        <SummaryCard
          label="Pay Period"
          value="Jul 14–20"
          description="current reporting period"
          icon={CalendarDays}
          valueClass="text-purple-600 dark:text-purple-400"
        />
      </div>

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="inline-flex w-fit rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("clock-records");
              setStatusFilter("All");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "clock-records"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Clock Records
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("timesheets");
              setStatusFilter("All");
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "timesheets"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Timesheets
          </button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />

            <input
              type="search"
              placeholder="Search employee..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-[#111c2d] dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-[#111c2d] dark:text-slate-200 dark:focus:ring-blue-950"
          >
            <option value="All">All statuses</option>

            {activeTab === "clock-records" ? (
              <>
                <option value="On Time">On Time</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </>
            ) : (
              <>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Needs Review">
                  Needs Review
                </option>
              </>
            )}
          </select>
        </div>
      </div>

      {activeTab === "clock-records" ? (
        <ClockTable records={filteredClockRecords} />
      ) : (
        <TimesheetTable
          initialTimesheets={filteredTimesheets}
        />
      )}
    </div>
  );
}