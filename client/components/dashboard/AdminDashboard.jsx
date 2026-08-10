"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, Clock, CalendarCheck, Umbrella } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// Mirrors the role hierarchy in components/schedule/CreateScheduleForm.jsx -
// a Project Manager manages Cleaner/Foreman/Lead, an Accountant Supervisor
// (rank 0) manages no one. Duplicated locally rather than imported so this
// dashboard doesn't pull in the whole schedule-creation form.
const ROLE_RANK = {
  Owner: 4,
  "General Manager (GM)": 4,
  "Project Manager": 3,
  "Accountant Supervisor": 0,
  Foreman: 2,
  Lead: 2,
  Cleaner: 1,
};

const MANAGEABLE_ROLES = ["Cleaner", "Foreman", "Lead"];

function getRoleRank(role) {
  return ROLE_RANK[role] || 0;
}

function getManagedRoles(role) {
  const rank = getRoleRank(role);
  return MANAGEABLE_ROLES.filter((managed) => rank > getRoleRank(managed));
}

const LEAVE_TYPE_LABEL = {
  vacation: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  unpaid: "Unpaid Leave",
  bereavement: "Bereavement Leave",
};

const LEAVE_STATUS_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const leaveStatusClass = {
  Pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  Cancelled: "bg-gray-100 text-gray-600 dark:bg-[#1a1a1a] dark:text-slate-300",
};

const teamStatusClass = {
  "On Shift": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  "On Leave": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Off: "bg-gray-100 text-gray-600 dark:bg-[#1a1a1a] dark:text-slate-300",
};

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diffFromMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatLeaveDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function leaveRangeLabel(startDate, endDate) {
  const start = formatLeaveDate(startDate);
  const end = formatLeaveDate(endDate);
  return startDate === endDate ? start : `${start} – ${end}`;
}

function initialsFor(name) {
  return (name || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatCard({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && <Icon size={18} className="text-gray-400 dark:text-slate-500" />}
      </div>

      <p className={`mt-2 text-3xl font-bold ${accent || "text-gray-900 dark:text-white"}`}>
        {value}
      </p>

      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const { role, isLoading: authLoading } = useAuth();

  const [team, setTeam] = useState([]);
  const [teamLoading, setTeamLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);

  const managedRoles = useMemo(() => getManagedRoles(role), [role]);

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  // Real roster, scoped to the roles this manager is allowed to schedule -
  // same endpoint and role math CreateScheduleForm uses for its employee
  // picker (backend/scheduling-service/authUsers.js).
  useEffect(() => {
    if (authLoading) return;

    if (managedRoles.length === 0) {
      setTeam([]);
      setTeamLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const params = new URLSearchParams({
          resource: "assignable-employees",
          roles: managedRoles.join(","),
        });

        const res = await fetch(`/api/schedule?${params.toString()}`, { headers });
        if (!res.ok) return;

        const rows = await res.json();
        if (!cancelled) setTeam(Array.isArray(rows) ? rows : []);
      } catch {
        // scheduling service unreachable - team list stays empty
      } finally {
        if (!cancelled) setTeamLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, managedRoles]);

  // The scheduling service returns every schedule in the system (no
  // server-side filtering) - narrowed to this manager's team below.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const res = await fetch("/api/schedule", { headers });
        if (!res.ok) return;

        const rows = await res.json();
        if (!cancelled) setSchedules(Array.isArray(rows) ? rows : []);
      } catch {
        // scheduling service unreachable - shift stats stay empty
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

  // Same situation for leave: /api/leave returns every request platform-wide.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const res = await fetch("/api/leave", { headers });
        if (!res.ok) return;

        const rows = await res.json();
        if (!cancelled) setLeaveRequests(Array.isArray(rows) ? rows : []);
      } catch {
        // leave service unreachable - leave panel stays empty
      } finally {
        if (!cancelled) setLeaveLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

  const teamIds = useMemo(() => new Set(team.map((member) => member.id)), [team]);

  const teamSchedules = useMemo(
    () => schedules.filter((s) => teamIds.has(s.user_id) && s.status !== "cancelled"),
    [schedules, teamIds]
  );

  const teamLeaveRequests = useMemo(
    () => leaveRequests.filter((request) => teamIds.has(request.user_id)),
    [leaveRequests, teamIds]
  );

  const shiftsThisWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date()).getTime();
    const weekEnd = weekStart + 7 * 86400000;

    return teamSchedules.filter((s) => {
      const start = new Date(s.start_time).getTime();
      return start >= weekStart && start < weekEnd;
    }).length;
  }, [teamSchedules]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const nowMs = Date.now();

  // "On Shift" here means "inside a currently active, scheduled shift
  // window" - there's no live clock-in feed available to a manager (clock
  // records are locked to the owning employee at the API level), so this is
  // schedule-based, not GPS-verified like the employee dashboard's status.
  const onShiftIds = useMemo(() => {
    const ids = new Set();
    teamSchedules.forEach((s) => {
      const start = new Date(s.start_time).getTime();
      const end = new Date(s.end_time).getTime();
      if (nowMs >= start && nowMs <= end) ids.add(s.user_id);
    });
    return ids;
  }, [teamSchedules, nowMs]);

  const onLeaveIds = useMemo(() => {
    const ids = new Set();
    teamLeaveRequests.forEach((request) => {
      if (
        request.status === "approved" &&
        request.start_date <= todayIso &&
        request.end_date >= todayIso
      ) {
        ids.add(request.user_id);
      }
    });
    return ids;
  }, [teamLeaveRequests, todayIso]);

  const teamWithStatus = useMemo(
    () =>
      team.map((member) => ({
        ...member,
        status: onLeaveIds.has(member.id)
          ? "On Leave"
          : onShiftIds.has(member.id)
            ? "On Shift"
            : "Off",
      })),
    [team, onLeaveIds, onShiftIds]
  );

  const onShiftCount = teamWithStatus.filter((member) => member.status === "On Shift").length;

  // Leave approval is restricted to Owner/Foreman/GM on the real Schedule &
  // Leave page (canReviewLeaveRequests) - a Project Manager or Accountant
  // Supervisor isn't authorized to act on these, so this is read-only.
  const recentTeamLeave = useMemo(
    () =>
      [...teamLeaveRequests]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 5),
    [teamLeaveRequests]
  );

  const pendingTeamLeaveCount = useMemo(
    () => teamLeaveRequests.filter((request) => request.status === "pending").length,
    [teamLeaveRequests]
  );

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 p-4 dark:bg-black md:-m-8 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Manage your team, shifts, and approvals
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Team Size"
          icon={Users}
          value={teamLoading ? "…" : team.length}
          sub={managedRoles.length > 0 ? managedRoles.join(", ") : "No team assigned"}
        />

        <StatCard
          label="On Shift Now"
          icon={Clock}
          value={teamLoading || scheduleLoading ? "…" : onShiftCount}
          sub={`of ${team.length}`}
          accent="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          label="Shifts This Week"
          icon={CalendarCheck}
          value={scheduleLoading ? "…" : shiftsThisWeek}
          sub="across your team"
          accent="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          label="Pending Leave"
          icon={Umbrella}
          value={leaveLoading ? "…" : pendingTeamLeaveCount}
          sub="view only · reviewed by GM/Owner"
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Team
          </h3>

          {teamLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1a1a]" />
              ))}
            </div>
          ) : teamWithStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              {managedRoles.length === 0
                ? "You don't currently manage any team members."
                : "No employees found for your managed roles."}
            </p>
          ) : (
            <div className="space-y-2">
              {teamWithStatus.map((worker) => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-[#262626]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-[#1a1a1a] dark:text-slate-200">
                      {initialsFor(worker.full_name)}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {worker.full_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {worker.role}
                      </p>
                    </div>
                  </div>

                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${teamStatusClass[worker.status]}`}>
                    {worker.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Team Leave Requests
          </h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-slate-400">
            For visibility only – reviewed by Owner, GM, or Foreman.
          </p>

          {leaveLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-[#1a1a1a]" />
              ))}
            </div>
          ) : recentTeamLeave.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              No leave requests from your team.
            </p>
          ) : (
            <div className="space-y-3">
              {recentTeamLeave.map((request) => {
                const status = LEAVE_STATUS_LABEL[request.status] || request.status;

                return (
                  <div
                    key={request.id}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-[#262626] dark:bg-[#1a1a1a]/60"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.employee_user?.full_name || "Unknown"}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${leaveStatusClass[status] || ""}`}>
                        {status}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                      {LEAVE_TYPE_LABEL[request.leave_type] || request.leave_type} ·{" "}
                      {leaveRangeLabel(request.start_date, request.end_date)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
