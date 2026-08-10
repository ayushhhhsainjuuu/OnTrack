"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Umbrella,
} from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import WeeklyCalender from "@/components/schedule/WeeklyCalender";
import CreateScheduleForm, {
  getAssignableRolesFor,
} from "@/components/schedule/CreateScheduleForm";
import LeaveForm from "@/components/leave/LeaveForm";
import LeaveTable from "@/components/leave/LeaveTable";
import ManagerReviewQueue from "@/components/leave/ManagerReviewQueue";

/*
  Blue marks an individual-contributor shift (e.g. Cleaner) and
  purple marks a leadership/supervisory shift (e.g. Lead, Foreman).
  This mirrors the color meaning the schedule previously used with
  its mock data, now applied to the logged-in user's real role.
*/
const LEADERSHIP_ROLES = [
  "lead",
  "foreman",
  "supervisor",
  "project manager",
  "general manager",
  "owner",
];

function getShiftRoleColor(role) {
  const normalized = normalizeRole(role);

  return LEADERSHIP_ROLES.includes(normalized)
    ? "text-purple-600 dark:text-purple-400"
    : "text-[#6366F1] dark:text-indigo-400";
}

function formatShiftTime(dateValue) {
  return new Date(dateValue).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildShiftFromSchedule(schedule, role) {
  const isCancelled = schedule.status === "cancelled";

  const hours = Math.max(
    0,
    Math.round(
      (new Date(schedule.end_time) - new Date(schedule.start_time)) /
        3600000
    )
  );

  return {
    role,
    color: getShiftRoleColor(role),
    time: formatShiftTime(schedule.start_time),
    end: `to ${formatShiftTime(schedule.end_time)}`,
    hours,
    off: false,
    cancelled: isCancelled,
    cancelReason: isCancelled
      ? schedule.notes || "Shift cancelled by management."
      : undefined,
  };
}

const balances = [
  {
    label: "Annual",
    remaining: 12,
    used: 5,
    total: 17,
    bar: "bg-[#6366F1]",
    pct: 29,
  },
  {
    label: "Sick",
    remaining: 8,
    used: 2,
    total: 10,
    bar: "bg-emerald-500",
    pct: 20,
  },
  {
    label: "Personal",
    remaining: 2,
    used: 1,
    total: 3,
    bar: "bg-amber-500",
    pct: 33,
  },
];

/*
  Maps between the UI's display labels/statuses and the actual lowercase
  enum values allowed by the leave_requests table's check constraints.
*/
const LEAVE_TYPE_TO_DB = {
  "Annual Leave": "vacation",
  "Sick Leave": "sick",
  "Personal Leave": "personal",
  "Unpaid Leave": "unpaid",
  "Bereavement Leave": "bereavement",
};

const DB_TYPE_TO_LEAVE_LABEL = {
  vacation: "Annual Leave",
  sick: "Sick Leave",
  personal: "Personal Leave",
  unpaid: "Unpaid Leave",
  bereavement: "Bereavement Leave",
};

const STATUS_TO_DB = {
  Pending: "pending",
  Approved: "approved",
  Rejected: "rejected",
  Cancelled: "cancelled",
};

const DB_STATUS_TO_LABEL = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function calculateLeaveDays(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

/*
  Converts a raw leave_requests row (with the joined users row for the
  requester) into the shape LeaveTable / ManagerReviewQueue already expect.
  Keeps every downstream component unchanged.
*/
function mapDbRequestToUi(row) {
  const requester = row.employee_user || {};
  const days = calculateLeaveDays(row.start_date, row.end_date);

  return {
    id: row.id,
    employeeId: row.user_id,
    employee: requester.full_name || "Unknown",
    employeeName: requester.full_name || "Unknown",
    employeeRole: requester.system_role || "",
    type: DB_TYPE_TO_LEAVE_LABEL[row.leave_type] || row.leave_type,
    startDate: row.start_date,
    endDate: row.end_date,
    days,
    range: createRangeLabel(row.start_date, row.end_date, days),
    submitted: formatSubmittedDate(new Date(row.created_at)),
    status: DB_STATUS_TO_LABEL[row.status] || row.status,
    reason: row.reason || "",
    rejectionNote: row.reviewer_notes || undefined,
  };
}


const cardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-[#1E293B]";

function startOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();

  const difference =
    result.getDate() - day + (day === 0 ? -6 : 1);

  result.setDate(difference);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date, numberOfDays) {
  const result = new Date(date);
  result.setDate(result.getDate() + numberOfDays);
  return result;
}

function addWeeks(date, numberOfWeeks) {
  return addDays(date, numberOfWeeks * 7);
}

function sameDate(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function parseLocalDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function isDateWithinRange(date, startDate, endDate) {
  const rangeStart = parseLocalDate(startDate);
  const rangeEnd = parseLocalDate(endDate);

  if (!rangeStart || !rangeEnd) {
    return false;
  }

  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  return dateOnly >= rangeStart && dateOnly <= rangeEnd;
}

function formatSubmittedDate(date) {
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function formatLeaveDate(dateValue) {
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(
    "en-CA",
    {
      month: "short",
      day: "numeric",
    }
  );
}

function createRangeLabel(startDate, endDate, days) {
  const startLabel = formatLeaveDate(startDate);
  const endLabel = formatLeaveDate(endDate);

  const dateLabel =
    startDate === endDate
      ? startLabel
      : `${startLabel} – ${endLabel}`;

  return `${dateLabel} · ${days} ${
    days === 1 ? "day" : "days"
  }`;
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}


export default function SchedulePage() {
  const {
    user,
    name,
    role,
    isLoading,
  } = useAuth();

  const [tab, setTab] = useState("schedule");

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date())
  );

  const [leaveFormOpen, setLeaveFormOpen] =
    useState(false);

  const [allLeaveRequests, setAllLeaveRequests] =
    useState([]);

  const [storageReady, setStorageReady] =
    useState(false);

  /*
    Leave requests now go through the leave-service microservice
    (backend/leave-service, port 4003) via /api/leave instead of
    hitting Supabase directly. null = still checking, so the leave
    section waits for the service's /health to respond before it
    renders any leave data or the New Request form.
  */
  const [leaveServiceUp, setLeaveServiceUp] =
    useState(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [scheduleEntries, setScheduleEntries] =
    useState([]);

  const [scheduleLoading, setScheduleLoading] =
    useState(true);

  const normalizedRole = normalizeRole(role);

  /*
    useAuth returns "General Manager" for the GM account.
    This check also supports GM and General Manager (GM).
  */
  const canReviewLeaveRequests =
    normalizedRole === "owner" ||
    normalizedRole === "foreman" ||
    normalizedRole === "gm" ||
    normalizedRole.includes("general manager");

  /*
    Owner and General Manager are top-level roles with no one above
    them to approve leave, so they cannot file their own leave request.
    They can still review everyone else's requests below.
  */
  const canSubmitLeave =
    normalizedRole !== "owner" &&
    normalizedRole !== "gm" &&
    !normalizedRole.includes("general manager");

  /*
    Hierarchy-based permission: only roles that can manage at least
    one other role (per getAssignableRolesFor) see the Create
    Schedule tab.
  */
  const assignableRoles = useMemo(
    () => getAssignableRolesFor(role),
    [role]
  );

  const canCreateSchedules = assignableRoles.length > 0;

  const availableTabs = canCreateSchedules
    ? ["schedule", "create", "leave"]
    : ["schedule", "leave"];

  /*
    Poll /api/leave/health (proxied to the leave-service microservice,
    port 4003) until it responds. The leave section below waits on
    leaveServiceUp before rendering or loading any data.
  */
  useEffect(() => {
    let cancelled = false;
    let retryTimeoutId;

    async function checkLeaveServiceHealth() {
      let up = false;

      try {
        const response = await fetch("/api/leave/health");
        up = response.ok;
      } catch {
        up = false;
      }

      if (cancelled) {
        return;
      }

      setLeaveServiceUp(up);

      if (!up) {
        retryTimeoutId = window.setTimeout(
          checkLeaveServiceHealth,
          3000
        );
      }
    }

    checkLeaveServiceHealth();

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimeoutId);
    };
  }, []);

  /*
    Load leave requests via /api/leave (proxied to leave-service) once
    the currently authenticated user is known AND the leave service's
    port has confirmed it's up.
  */
  useEffect(() => {
    if (isLoading || !user || leaveServiceUp !== true) {
      return;
    }

    let cancelled = false;

    async function loadLeaveRequests() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let response;

      try {
        response = await fetch("/api/leave", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        });
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to load leave requests:", error);
        setAllLeaveRequests([]);
        setStorageReady(true);
        return;
      }

      const data = await response.json().catch(() => null);

      if (cancelled) {
        return;
      }

      if (!response.ok) {
        console.error(
          "Failed to load leave requests:",
          data?.error || response.statusText
        );
        setAllLeaveRequests([]);
        setStorageReady(true);
        return;
      }

      setAllLeaveRequests((data || []).map(mapDbRequestToUi));
      setStorageReady(true);
    }

    loadLeaveRequests();

    return () => {
      cancelled = true;
    };
  }, [isLoading, user, leaveServiceUp]);

  /*
    A normal employee sees only requests belonging to them.
  */
  const employeeLeaveRequests = useMemo(() => {
    if (!user) {
      return [];
    }

    return allLeaveRequests.filter(
      (request) =>
        request.employeeId === user.id
    );
  }, [allLeaveRequests, user]);

  /*
    Calls the /api/schedule route (proxied to the scheduling
    microservice) for the currently visible week and keeps only
    this user's shifts.
  */
  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    let isCancelledRequest = false;

    const loadSchedule = async () => {
      setScheduleLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const params = new URLSearchParams({
          user_id: user.id,
          start: weekStart.toISOString(),
          end: addDays(weekStart, 6).toISOString(),
        });

        const response = await fetch(
          `/api/schedule?${params.toString()}`,
          {
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : undefined,
          }
        );

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.error || "Could not load your schedule."
          );
        }

        const schedules = Array.isArray(payload)
          ? payload
          : payload?.schedules || [];

        if (!isCancelledRequest) {
          setScheduleEntries(
            schedules.filter(
              (schedule) => schedule.user_id === user.id
            )
          );
        }
      } catch (error) {
        if (!isCancelledRequest) {
          console.error("Could not load schedule:", error);
          setScheduleEntries([]);
        }
      } finally {
        if (!isCancelledRequest) {
          setScheduleLoading(false);
        }
      }
    };

    loadSchedule();

    return () => {
      isCancelledRequest = true;
    };
  }, [isLoading, user, weekStart]);

  /*
    If the user's role no longer permits scheduling others (e.g.
    role changed), fall back to the schedule tab.
  */
  useEffect(() => {
    if (tab === "create" && !canCreateSchedules) {
      setTab("schedule");
    }
  }, [tab, canCreateSchedules]);

  /*
    A manager sees requests from other employees.
    Their own requests remain in "My leave requests."
  */
  const managerLeaveRequests = useMemo(() => {
    if (!user) {
      return [];
    }

    return allLeaveRequests.filter(
      (request) =>
        request.employeeId !== user.id
    );
  }, [allLeaveRequests, user]);

  const today = new Date();

  /*
    OC-103:
    Only approved requests belonging to the logged-in
    employee affect that employee's weekly schedule.
  */
  const week = useMemo(() => {
    const approvedRequests =
      employeeLeaveRequests.filter(
        (request) =>
          request.status === "Approved"
      );

    return Array.from({ length: 7 }).map(
      (_, index) => {
        const fullDate = addDays(
          weekStart,
          index
        );

        const approvedLeave =
          approvedRequests.find(
            (request) =>
              isDateWithinRange(
                fullDate,
                request.startDate,
                request.endDate
              )
          );

        const dateInformation = {
          fullDate,
          day: fullDate
            .toLocaleDateString("en-CA", {
              weekday: "short",
            })
            .toUpperCase(),
          date: fullDate.getDate(),
          today: sameDate(fullDate, today),
        };

        if (approvedLeave) {
          return {
            ...dateInformation,
            role: "Approved Leave",
            color:
              "text-emerald-600 dark:text-emerald-400",
            time: approvedLeave.type,
            end: "",
            hours: 0,
            approvedLeave: true,
            leave: true,
            leaveType: approvedLeave.type,
            leaveReason:
              approvedLeave.reason,
            off: false,
            cancelled: false,
          };
        }

        const scheduleForDay = scheduleEntries.find(
          (schedule) =>
            sameDate(
              new Date(schedule.start_time),
              fullDate
            )
        );

        if (scheduleForDay) {
          return {
            ...dateInformation,
            ...buildShiftFromSchedule(
              scheduleForDay,
              role
            ),
          };
        }

        return {
          ...dateInformation,
          off: true,
          hours: 0,
        };
      }
    );
  }, [
    weekStart,
    employeeLeaveRequests,
    scheduleEntries,
    role,
  ]);

  const weekEnd = addDays(weekStart, 6);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  // Forwards the browser's Supabase session token to /api/leave, same as
  // the schedule-loading effect above does for /api/schedule.
  async function buildLeaveAuthHeaders() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers = { "Content-Type": "application/json" };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  // Submit: POST a new pending leave request through /api/leave (proxied
  // to leave-service), then add the returned row to the list.
  const handleNewLeaveRequest = async (request) => {
    if (!user) {
      return;
    }

    const dbType = LEAVE_TYPE_TO_DB[request.type] || "personal";

    let response;

    try {
      response = await fetch("/api/leave", {
        method: "POST",
        headers: await buildLeaveAuthHeaders(),
        body: JSON.stringify({
          user_id: user.id,
          leave_type: dbType,
          start_date: request.startDate,
          end_date: request.endDate,
          reason: request.reason,
        }),
      });
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      showSuccessMessage(
        "Something went wrong submitting your request. Please try again."
      );
      return;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("Failed to submit leave request:", data?.error);
      showSuccessMessage(
        "Something went wrong submitting your request. Please try again."
      );
      return;
    }

    const created = Array.isArray(data) ? data[0] : data;

    setAllLeaveRequests((current) => [
      mapDbRequestToUi(created),
      ...current,
    ]);

    showSuccessMessage(
      "Your leave request was submitted successfully."
    );
  };

  // Cancel: PATCH the request's status to 'cancelled' via /api/leave.
  // Only works on your own pending request (also enforced by leave-service).
  const handleCancelRequest = async (requestId) => {
    const requestToCancel =
      allLeaveRequests.find(
        (request) =>
          request.id === requestId
      );

    if (
      !requestToCancel ||
      requestToCancel.employeeId !== user?.id ||
      requestToCancel.status !== "Pending"
    ) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );

    if (!confirmed) {
      return;
    }

    let response;

    try {
      response = await fetch(
        `/api/leave?id=${requestId}&action=cancel`,
        {
          method: "PATCH",
          headers: await buildLeaveAuthHeaders(),
          body: JSON.stringify({ user_id: user.id }),
        }
      );
    } catch (error) {
      console.error("Failed to cancel leave request:", error);
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error("Failed to cancel leave request:", data?.error);
      return;
    }

    setAllLeaveRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "Cancelled",
            }
          : request
      )
    );

    showSuccessMessage(
      "Your pending leave request was cancelled."
    );
  };

  /*
    ManagerReviewQueue calls onApprove(request.id).
  */
  // Approve (manager only): PATCH status to 'approved' via /api/leave.
  // leave-service guards against double-review (status must be "pending").
  const handleApproveRequest = async (requestId) => {
    let response;

    try {
      response = await fetch(`/api/leave?id=${requestId}`, {
        method: "PATCH",
        headers: await buildLeaveAuthHeaders(),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: user?.id,
          reviewer_notes: null,
        }),
      });
    } catch (error) {
      console.error("Failed to approve leave request:", error);
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error("Failed to approve leave request:", data?.error);
      return;
    }

    setAllLeaveRequests((current) =>
      current.map((request) =>
        request.id === requestId &&
        request.status === "Pending"
          ? {
              ...request,
              status: "Approved",
              rejectionNote: undefined,
            }
          : request
      )
    );

    showSuccessMessage(
      "The leave request was approved successfully."
    );
  };

  /*
    RejectModal is already rendered inside
    ManagerReviewQueue.

    ManagerReviewQueue calls:
    onReject(requestId, rejectionNote)
  */
  // Reject (manager only): PATCH status to 'rejected' via /api/leave and
  // save the manager's rejection note. Requires a non-empty note.
  const handleRejectRequest = async (
    requestId,
    rejectionNote
  ) => {
    const cleanedNote =
      String(rejectionNote || "").trim();

    if (!cleanedNote) {
      return;
    }

    let response;

    try {
      response = await fetch(`/api/leave?id=${requestId}`, {
        method: "PATCH",
        headers: await buildLeaveAuthHeaders(),
        body: JSON.stringify({
          status: "rejected",
          reviewed_by: user?.id,
          reviewer_notes: cleanedNote,
        }),
      });
    } catch (error) {
      console.error("Failed to reject leave request:", error);
      return;
    }

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      console.error("Failed to reject leave request:", data?.error);
      return;
    }

    setAllLeaveRequests((current) =>
      current.map((request) =>
        request.id === requestId &&
        request.status === "Pending"
          ? {
              ...request,
              status: "Rejected",
              rejectionNote: cleanedNote,
            }
          : request
      )
    );

    showSuccessMessage(
      "The leave request was rejected."
    );
  };

  if (isLoading || scheduleLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Loading schedule...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Schedule & Leave
        </p>

        <h1 className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">
          Schedule & Leave
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Review your weekly shifts and manage your
          leave requests.
        </p>
      </div>

      <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-slate-800">
        {availableTabs.map(
          (item) => (
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
              {item === "schedule"
                ? "My Schedule"
                : item === "create"
                  ? "Create Schedule"
                  : "Leave"}
            </button>
          )
        )}
      </div>

      {tab === "schedule" ? (
        <WeeklyCalender
          week={week}
          weekStart={weekStart}
          weekEnd={weekEnd}
          onPreviousWeek={() =>
            setWeekStart((current) =>
              addWeeks(current, -1)
            )
          }
          onNextWeek={() =>
            setWeekStart((current) =>
              addWeeks(current, 1)
            )
          }
          onToday={() =>
            setWeekStart(
              startOfWeek(new Date())
            )
          }
        />
      ) : tab === "create" ? (
        <div className="space-y-6">
          {successMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 size={19} />
              {successMessage}
            </div>
          )}

          <CreateScheduleForm
            role={role}
            onSuccess={showSuccessMessage}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {successMessage && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-300">
              <CheckCircle2 size={19} />
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {balances.map((balance) => (
              <div
                key={balance.label}
                className={`${cardClass} p-5`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {balance.label}
                  </p>

                  <Umbrella
                    size={16}
                    className="text-gray-300 dark:text-slate-600"
                  />
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
                    style={{
                      width: `${balance.pct}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">
                  {balance.used} used of{" "}
                  {balance.total}
                </p>
              </div>
            ))}
          </div>

          {/*
            Leave requests are served by the leave-service microservice
            (port 4003). Nothing below renders until /api/leave/health
            confirms the service's port is actually up, then waits for
            the initial /api/leave load to finish.
          */}
          {leaveServiceUp !== true ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm font-medium text-gray-500 shadow-sm dark:border-slate-700 dark:bg-[#1E293B] dark:text-slate-400">
              Waiting for the leave service to come online…
            </div>
          ) : !storageReady ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm font-medium text-gray-500 shadow-sm dark:border-slate-700 dark:bg-[#1E293B] dark:text-slate-400">
              Loading leave requests…
            </div>
          ) : (
            <>
              {/* "My leave requests" + New Request button: shown to everyone
                  EXCEPT Owner/GM (they can't file their own leave). */}
              {canSubmitLeave && (
                <section className="space-y-4">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        My leave requests
                      </h2>

                      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                        View pending and previous requests
                        or submit a new one.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setLeaveFormOpen(true)
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6366F1] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4F46E5] dark:bg-[#6366F1] dark:hover:bg-[#4F46E5]"
                    >
                      <Plus size={16} />
                      New Request
                    </button>
                  </div>

                  <LeaveTable
                    requests={
                      employeeLeaveRequests
                    }
                    onCancel={
                      handleCancelRequest
                    }
                  />
                </section>
              )}

              {/* Manager review queue: shown to Owner/GM/Foreman so they can
                  approve or reject other people's leave requests. */}
              {canReviewLeaveRequests && (
                <section className="border-t border-gray-200 pt-6 dark:border-slate-700">
                  <ManagerReviewQueue
                    requests={
                      managerLeaveRequests
                    }
                    onApprove={
                      handleApproveRequest
                    }
                    onReject={
                      handleRejectRequest
                    }
                  />
                </section>
              )}
            </>
          )}
        </div>
      )}

      <LeaveForm
        isOpen={leaveFormOpen}
        onClose={() =>
          setLeaveFormOpen(false)
        }
        onSubmit={
          handleNewLeaveRequest
        }
      />
    </div>
  );
}