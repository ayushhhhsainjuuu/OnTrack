"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import ClockTable from "@/components/attendance/ClockTable";
import TimesheetTable from "@/components/attendance/TimesheetTable";

// Same role hierarchy as CreateScheduleForm/AdminDashboard, but scoped to
// every role the app recognizes rather than just the 3 schedulable roles -
// attendance visibility isn't limited to who can be scheduled.
const ROLE_RANK = {
  Owner: 4,
  "General Manager (GM)": 4,
  "Project Manager": 3,
  "Accountant Supervisor": 0,
  Foreman: 2,
  Lead: 2,
  Cleaner: 1,
};

const ALL_ROLES = Object.keys(ROLE_RANK);
const OVERTIME_THRESHOLD_HOURS = 40;
const RECORD_WINDOW_DAYS = 30;

function getRoleRank(role) {
  return ROLE_RANK[role] || 0;
}

function getVisibleRoles(viewerRole) {
  const rank = getRoleRank(viewerRole);
  return ALL_ROLES.filter((role) => rank > getRoleRank(role));
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function fmtDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(date) {
  return date.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtShort(date) {
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  valueClass = "text-gray-900 dark:text-white",
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#1E293B]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            {label}
          </p>

          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>

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
  const { role, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("clock-records");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  const [siteNames, setSiteNames] = useState({});

  const [clockRecords, setClockRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const visibleRoles = useMemo(() => getVisibleRoles(role), [role]);

  // Real roster, same endpoint CreateScheduleForm's employee picker uses.
  useEffect(() => {
    if (authLoading) return;

    if (visibleRoles.length === 0) {
      setRoster([]);
      setRosterLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const params = new URLSearchParams({
          resource: "assignable-employees",
          roles: visibleRoles.join(","),
        });

        const res = await fetch(`/api/schedule?${params.toString()}`, { headers });
        if (!res.ok) return;

        const rows = await res.json();
        if (!cancelled) setRoster(Array.isArray(rows) ? rows : []);
      } catch {
        // scheduling service unreachable - roster stays empty
      } finally {
        if (!cancelled) setRosterLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, visibleRoles]);

  // Site names, same open-read pattern CreateScheduleForm uses for accounts.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.from("accounts").select("id, name");
      if (!cancelled) {
        const map = {};
        (data || []).forEach((account) => {
          map[account.id] = account.name;
        });
        setSiteNames(map);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // clock_records for the visible roster over the last 30 days - same direct
  // table read the Analytics page uses (clock_records has an open read
  // policy; writes stay locked to the owning employee via clock-services).
  useEffect(() => {
    if (rosterLoading) return;

    if (roster.length === 0) {
      setClockRecords([]);
      setRecordsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setRecordsLoading(true);

      const since = new Date();
      since.setDate(since.getDate() - RECORD_WINDOW_DAYS);

      const { data, error } = await supabase
        .from("clock_records")
        .select("id, user_id, account_id, clock_in_at, clock_out_at, outside_geofence")
        .in("user_id", roster.map((member) => member.id))
        .gte("clock_in_at", since.toISOString())
        .order("clock_in_at", { ascending: false })
        .limit(300);

      if (!cancelled) {
        if (!error) setClockRecords(data || []);
        setRecordsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rosterLoading, roster]);

  const rosterById = useMemo(() => {
    const map = {};
    roster.forEach((member) => {
      map[member.id] = member;
    });
    return map;
  }, [roster]);

  const clockRows = useMemo(
    () =>
      clockRecords.map((record) => {
        const employee = rosterById[record.user_id];
        const start = new Date(record.clock_in_at);
        const end = record.clock_out_at ? new Date(record.clock_out_at) : null;

        let status = "In Progress";
        if (end) status = record.outside_geofence ? "Outside Geofence" : "Completed";

        return {
          id: record.id,
          userId: record.user_id,
          employee: employee?.full_name || "Unknown",
          role: employee?.role || "—",
          site: siteNames[record.account_id] || "Unassigned",
          date: fmtDate(start),
          clockIn: fmtTime(start),
          clockOut: end ? fmtTime(end) : "—",
          totalHours: end ? (end - start) / 3600000 : null,
          status,
        };
      }),
    [clockRecords, rosterById, siteNames]
  );

  const filteredClockRecords = useMemo(() => {
    return clockRows.filter((record) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        record.employee.toLowerCase().includes(searchValue) ||
        record.role.toLowerCase().includes(searchValue) ||
        record.site.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clockRows, search, statusFilter]);

  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const periodLabel = useMemo(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${fmtShort(weekStart)} – ${fmtShort(weekEnd)}`;
  }, [weekStart]);

  const timesheets = useMemo(() => {
    const totals = {};

    clockRecords.forEach((record) => {
      if (!record.clock_out_at) return;

      const start = new Date(record.clock_in_at);
      if (start < weekStart) return;

      const hours = (new Date(record.clock_out_at) - start) / 3600000;
      totals[record.user_id] = (totals[record.user_id] || 0) + hours;
    });

    return roster
      .filter((member) => totals[member.id] > 0)
      .map((member) => {
        const total = totals[member.id];

        return {
          id: member.id,
          employee: member.full_name,
          role: member.role,
          period: periodLabel,
          regularHours: Math.min(total, OVERTIME_THRESHOLD_HOURS),
          overtimeHours: Math.max(0, total - OVERTIME_THRESHOLD_HOURS),
          totalHours: total,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [clockRecords, roster, weekStart, periodLabel]);

  const filteredTimesheets = useMemo(() => {
    const searchValue = search.toLowerCase();

    return timesheets.filter(
      (timesheet) =>
        timesheet.employee.toLowerCase().includes(searchValue) ||
        timesheet.role.toLowerCase().includes(searchValue)
    );
  }, [timesheets, search]);

  const totalHoursThisWeek = timesheets.reduce(
    (total, timesheet) => total + timesheet.totalHours,
    0
  );

  const clockedInNow = clockRows.filter(
    (record) => record.status === "In Progress"
  ).length;

  const loading = rosterLoading || recordsLoading;

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
          Review employee clock records and weekly hours.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Employees"
          value={rosterLoading ? "…" : roster.length}
          description="visible to your role"
          icon={Users}
        />

        <SummaryCard
          label="Total Hours"
          value={loading ? "…" : `${totalHoursThisWeek.toFixed(1)}h`}
          description="this pay period"
          icon={Clock3}
          valueClass="text-[#6366F1] dark:text-indigo-400"
        />

        <SummaryCard
          label="Clocked In Now"
          value={loading ? "…" : clockedInNow}
          description="active shifts right now"
          icon={UserCheck}
          valueClass="text-emerald-600 dark:text-emerald-400"
        />

        <SummaryCard
          label="Pay Period"
          value={periodLabel}
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
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#1E293B] dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-950 sm:w-64"
            />
          </div>

          {activeTab === "clock-records" && (
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-[#1E293B] dark:text-slate-200 dark:focus:ring-indigo-950"
            >
              <option value="All">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Outside Geofence">Outside Geofence</option>
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-[#1E293B]">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : activeTab === "clock-records" ? (
        <ClockTable records={filteredClockRecords} />
      ) : (
        <TimesheetTable timesheets={filteredTimesheets} />
      )}
    </div>
  );
}
