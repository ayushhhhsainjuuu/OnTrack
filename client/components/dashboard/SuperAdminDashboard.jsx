"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Users, Clock, Umbrella, ArrowRight } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// Every role label the app routes to a dashboard for (see the switch in
// app/(app)/dashboard/page.jsx) - requested from the assignable-employees
// endpoint to build a platform-wide staff roster for Owner/GM.
const ALL_ROLES = [
  "Owner",
  "General Manager (GM)",
  "Project Manager",
  "Accountant Supervisor",
  "Foreman",
  "Lead",
  "Cleaner",
];

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

function formatSubmittedDate(dateValue) {
  return new Date(dateValue).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
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

export default function SuperAdminDashboard() {
  const { isLoading: authLoading } = useAuth();

  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);

  const [sites, setSites] = useState([]);
  const [siteMemberCounts, setSiteMemberCounts] = useState({});
  const [sitesLoading, setSitesLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveLoading, setLeaveLoading] = useState(true);

  async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  // Platform-wide staff roster, same endpoint CreateScheduleForm's employee
  // picker uses - Owner/GM sit above every role in the hierarchy, so they're
  // requesting every role label the app recognizes.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers) return;

        const params = new URLSearchParams({
          resource: "assignable-employees",
          roles: ALL_ROLES.join(","),
        });

        const res = await fetch(`/api/schedule?${params.toString()}`, { headers });
        if (!res.ok) return;

        const rows = await res.json();
        if (!cancelled) setStaff(Array.isArray(rows) ? rows : []);
      } catch {
        // scheduling service unreachable - staff count stays empty
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

  // Sites (accounts) plus an active-membership count per site - same open
  // read pattern CreateScheduleForm and EmployeeDashboard already use.
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      const { data: accountRows } = await supabase
        .from("accounts")
        .select("id, name, is_active")
        .eq("is_active", true);

      if (cancelled) return;
      setSites(accountRows || []);

      const { data: memberRows } = await supabase
        .from("account_members")
        .select("account_id")
        .is("end_date", null);

      if (cancelled) return;

      const counts = {};
      (memberRows || []).forEach((row) => {
        counts[row.account_id] = (counts[row.account_id] || 0) + 1;
      });

      setSiteMemberCounts(counts);
      setSitesLoading(false);
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

  // Every schedule in the system - the scheduling service doesn't filter
  // server-side, same situation EmployeeDashboard and AdminDashboard hit.
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
        // scheduling service unreachable - "scheduled now" stays empty
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

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
        // leave service unreachable - activity panel stays empty
      } finally {
        if (!cancelled) setLeaveLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading]);

  // "Scheduled Now" = inside an active, non-cancelled shift window right
  // now. There's no live clock-in feed across users (clock records are
  // locked to the owning employee at the API level), so this is
  // schedule-based, not GPS-verified.
  const scheduledNowCount = useMemo(() => {
    const nowMs = Date.now();
    const ids = new Set();

    schedules
      .filter((s) => s.status !== "cancelled")
      .forEach((s) => {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        if (nowMs >= start && nowMs <= end) ids.add(s.user_id);
      });

    return ids.size;
  }, [schedules]);

  const pendingLeaveCount = useMemo(
    () => leaveRequests.filter((request) => request.status === "pending").length,
    [leaveRequests]
  );

  const recentLeaveActivity = useMemo(
    () =>
      [...leaveRequests]
        .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
        .slice(0, 5),
    [leaveRequests]
  );

  return (
    <div className="-m-4 min-h-[calc(100vh-4rem)] space-y-6 p-4 dark:bg-black md:-m-8 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Super Admin
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Platform-wide overview across all sites
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sites"
          icon={Building2}
          value={sitesLoading ? "…" : sites.length}
          sub="active"
        />

        <StatCard
          label="Total Staff"
          icon={Users}
          value={staffLoading ? "…" : staff.length}
          sub="across all sites"
          accent="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          label="Scheduled Now"
          icon={Clock}
          value={scheduleLoading ? "…" : scheduledNowCount}
          sub={`of ${staffLoading ? "…" : staff.length}`}
          accent="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          label="Pending Approvals"
          icon={Umbrella}
          value={leaveLoading ? "…" : pendingLeaveCount}
          sub="leave requests"
          accent="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
            Sites
          </h3>

          {sitesLoading ? (
            <div className="space-y-3">
              {[0, 1].map((key) => (
                <div key={key} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-[#1a1a1a]" />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              No active sites yet.
            </p>
          ) : (
            <div className="space-y-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-[#262626] dark:bg-[#1a1a1a]/60"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {site.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {siteMemberCounts[site.id] || 0} staff assigned
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-[#262626] dark:bg-[#121212]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Recent Leave Activity
            </h3>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Review
              <ArrowRight size={13} />
            </Link>
          </div>

          {leaveLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-[#1a1a1a]" />
              ))}
            </div>
          ) : recentLeaveActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
              No leave requests yet.
            </p>
          ) : (
            <div className="space-y-4">
              {recentLeaveActivity.map((request) => {
                const status = LEAVE_STATUS_LABEL[request.status] || request.status;

                return (
                  <div key={request.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-slate-100">
                        <span className="font-medium">
                          {request.employee_user?.full_name || "Unknown"}
                        </span>{" "}
                        requested {LEAVE_TYPE_LABEL[request.leave_type] || request.leave_type}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        {leaveRangeLabel(request.start_date, request.end_date)} · submitted{" "}
                        {formatSubmittedDate(request.created_at)}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${leaveStatusClass[status] || ""}`}>
                      {status}
                    </span>
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
