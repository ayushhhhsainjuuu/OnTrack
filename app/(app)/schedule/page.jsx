"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Plus,
  Umbrella,
  CalendarPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import useAuth from "@/hooks/useAuth";
import WeeklyCalender from "@/components/schedule/WeeklyCalender";
import LeaveForm from "@/components/leave/LeaveForm";
import LeaveTable from "@/components/leave/LeaveTable";
import ManagerReviewQueue from "@/components/leave/ManagerReviewQueue";

const LEAVE_STORAGE_KEY = "ontrack-leave-requests";

const shiftPattern = [
  {
    role: "Cleaner",
    color: "text-blue-600 dark:text-blue-400",
    time: "9:00 AM",
    end: "to 5:00 PM",
    hours: 8,
  },
  {
    role: "Cleaner",
    color: "text-blue-600 dark:text-blue-400",
    time: "10:00 AM",
    end: "to 6:00 PM",
    hours: 8,
  },
  {
    role: "Cleaner",
    color: "text-blue-600 dark:text-blue-400",
    time: "9:00 AM",
    end: "to 5:00 PM",
    hours: 8,
  },
  {
    off: true,
    hours: 0,
  },
  {
    role: "Cleaner",
    color: "text-blue-600 dark:text-blue-400",
    time: "10:00 AM",
    end: "to 6:00 PM",
    hours: 8,
    cancelled: true,
    cancelReason: "Shift cancelled by management.",
  },
  {
    role: "Lead",
    color: "text-purple-600 dark:text-purple-400",
    time: "11:00 AM",
    end: "to 7:00 PM",
    hours: 8,
  },
  {
    off: true,
    hours: 0,
  },
];

const balances = [
  {
    label: "Annual",
    remaining: 12,
    used: 5,
    total: 17,
    bar: "bg-blue-600",
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
  These are shared mock requests used to demonstrate
  the manager review queue.
*/
const initialSharedRequests = [
  {
    id: "mock-maria-annual",
    employeeId: "mock-employee-maria",
    employee: "Maria Lopez",
    employeeName: "Maria Lopez",
    employeeRole: "Cleaner",
    type: "Annual Leave",
    startDate: "2026-07-24",
    endDate: "2026-07-25",
    days: 2,
    range: "Jul 24 – Jul 25 · 2 days",
    submitted: "Jul 18",
    status: "Pending",
    reason: "Family event outside Calgary.",
  },
  {
    id: "mock-sara-sick",
    employeeId: "mock-employee-sara",
    employee: "Sara Ali",
    employeeName: "Sara Ali",
    employeeRole: "Cleaner",
    type: "Sick Leave",
    startDate: "2026-07-29",
    endDate: "2026-07-30",
    days: 2,
    range: "Jul 29 – Jul 30 · 2 days",
    submitted: "Jul 19",
    status: "Pending",
    reason: "Medical appointment and recovery.",
  },
  {
    id: "mock-henry-personal",
    employeeId: "mock-employee-henry",
    employee: "Henry Tran",
    employeeName: "Henry Tran",
    employeeRole: "Foreman",
    type: "Personal Leave",
    startDate: "2026-08-03",
    endDate: "2026-08-03",
    days: 1,
    range: "Aug 3 · 1 day",
    submitted: "Jul 16",
    status: "Approved",
    reason: "Important personal appointment.",
  },
  {
    id: "mock-anita-annual",
    employeeId: "mock-employee-anita",
    employee: "Anita Rao",
    employeeName: "Anita Rao",
    employeeRole: "Cleaner",
    type: "Annual Leave",
    startDate: "2026-08-10",
    endDate: "2026-08-12",
    days: 3,
    range: "Aug 10 – Aug 12 · 3 days",
    submitted: "Jul 14",
    status: "Rejected",
    reason: "Previously planned vacation.",
    rejectionNote:
      "Several employees are already unavailable on these dates.",
  },
];

const cardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]";

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

function safelyReadStoredRequests() {
  try {
    const savedRequests =
      window.localStorage.getItem(LEAVE_STORAGE_KEY);

    if (!savedRequests) {
      return null;
    }

    const parsedRequests = JSON.parse(savedRequests);

    return Array.isArray(parsedRequests)
      ? parsedRequests
      : null;
  } catch (error) {
    console.error(
      "Could not read saved leave requests:",
      error
    );

    return null;
  }
}

function saveRequests(requests) {
  try {
    window.localStorage.setItem(
      LEAVE_STORAGE_KEY,
      JSON.stringify(requests)
    );
  } catch (error) {
    console.error(
      "Could not save leave requests:",
      error
    );
  }
}

function createDemoRequestsForUser(user, name, role) {
  return [
    {
      id: `${user.id}-demo-approved`,
      employeeId: user.id,
      employee: name,
      employeeName: name,
      employeeRole: role,
      type: "Annual Leave",
      startDate: "2026-07-22",
      endDate: "2026-07-23",
      days: 2,
      range: "Jul 22 – Jul 23 · 2 days",
      submitted: "Jul 15",
      status: "Approved",
      reason: "Family event outside the city.",
    },
    {
      id: `${user.id}-demo-sick`,
      employeeId: user.id,
      employee: name,
      employeeName: name,
      employeeRole: role,
      type: "Sick Leave",
      startDate: "2026-07-28",
      endDate: "2026-07-28",
      days: 1,
      range: "Jul 28 · 1 day",
      submitted: "Jul 18",
      status: "Pending",
      reason: "Medical appointment and recovery time.",
    },
    {
      id: `${user.id}-demo-annual`,
      employeeId: user.id,
      employee: name,
      employeeName: name,
      employeeRole: role,
      type: "Annual Leave",
      startDate: "2026-08-04",
      endDate: "2026-08-07",
      days: 4,
      range: "Aug 4 – Aug 7 · 4 days",
      submitted: "Jul 19",
      status: "Pending",
      reason: "Previously planned family trip.",
    },
    {
      id: `${user.id}-demo-rejected`,
      employeeId: user.id,
      employee: name,
      employeeName: name,
      employeeRole: role,
      type: "Personal Leave",
      startDate: "2026-06-12",
      endDate: "2026-06-12",
      days: 1,
      range: "Jun 12 · 1 day",
      submitted: "Jun 4",
      status: "Rejected",
      reason: "Personal appointment.",
      rejectionNote:
        "The request overlaps with a high-demand shift.",
    },
  ];
}

export default function SchedulePage() {
  const {
    user,
    name,
    role,
    isLoading,
  } = useAuth();

  const normalizedRole = normalizeRole(role);

  const canCreateSchedule =
    normalizedRole === "foreman" || normalizedRole === "lead";

  const [tab, setTab] = useState("schedule");

  const tabs = canCreateSchedule
    ? ["schedule", "leave", "manage"]
    : ["schedule", "leave"];

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date())
  );

  const [leaveFormOpen, setLeaveFormOpen] =
    useState(false);

  const [allLeaveRequests, setAllLeaveRequests] =
    useState([]);

  const [storageReady, setStorageReady] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

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
    Load shared leave requests after Supabase has loaded
    the currently authenticated user.
  */
  useEffect(() => {
    if (isLoading || !user) {
      return;
    }

    const storedRequests =
      safelyReadStoredRequests();

    let nextRequests =
      storedRequests || [...initialSharedRequests];

    /*
      Give each logged-in user their own initial mock
      request history only once.
    */
    const userAlreadyHasRequests =
      nextRequests.some(
        (request) =>
          request.employeeId === user.id
      );

    if (!userAlreadyHasRequests) {
      nextRequests = [
        ...createDemoRequestsForUser(
          user,
          name,
          role
        ),
        ...nextRequests,
      ];
    }

    setAllLeaveRequests(nextRequests);
    saveRequests(nextRequests);
    setStorageReady(true);
  }, [
    isLoading,
    user,
    name,
    role,
  ]);

  /*
    Save every approval, rejection, cancellation,
    and new request to localStorage.
  */
  useEffect(() => {
    if (!storageReady) {
      return;
    }

    saveRequests(allLeaveRequests);
  }, [allLeaveRequests, storageReady]);

  /*
    This also keeps separate browser tabs synchronized.
  */
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        event.key !== LEAVE_STORAGE_KEY ||
        !event.newValue
      ) {
        return;
      }

      try {
        const updatedRequests =
          JSON.parse(event.newValue);

        if (Array.isArray(updatedRequests)) {
          setAllLeaveRequests(updatedRequests);
        }
      } catch (error) {
        console.error(
          "Could not synchronize leave requests:",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

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

    return shiftPattern.map(
      (shift, index) => {
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

        return {
          ...shift,
          ...dateInformation,
        };
      }
    );
  }, [
    weekStart,
    employeeLeaveRequests,
  ]);

  const weekEnd = addDays(weekStart, 6);

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  const handleNewLeaveRequest = (request) => {
    if (!user) {
      return;
    }

    const newRequest = {
      id: `${user.id}-${Date.now()}`,
      employeeId: user.id,
      employee: name,
      employeeName: name,
      employeeRole: role,
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      days: request.days,
      range: createRangeLabel(
        request.startDate,
        request.endDate,
        request.days
      ),
      submitted: formatSubmittedDate(
        new Date()
      ),
      status: "Pending",
      reason: request.reason,
    };

    setAllLeaveRequests((current) => [
      newRequest,
      ...current,
    ]);

    showSuccessMessage(
      "Your leave request was submitted successfully."
    );
  };

  const handleCancelRequest = (requestId) => {
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
  const handleApproveRequest = (requestId) => {
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
  const handleRejectRequest = (
    requestId,
    rejectionNote
  ) => {
    const cleanedNote =
      String(rejectionNote || "").trim();

    if (!cleanedNote) {
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

  if (isLoading || !storageReady) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
          Loading schedule and leave requests...
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
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {t === "schedule"
              ? "My Schedule"
              : t === "leave"
              ? "Leave"
              : "Create Schedule"}
          </button>
        ))}
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
      ) : tab === "leave" ? (
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] dark:bg-blue-600 dark:hover:bg-blue-500"
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
        </div>
      ) : (
        <ManageSchedules />
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

function Field({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function ManageSchedules() {
  const [form, setForm] = useState({
    user_id: "",
    account_id: "",
    project_id: "",
    start_time: "",
    end_time: "",
    notes: "",
  });
  const [schedules, setSchedules] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function loadSchedules() {
    try {
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (res.ok) setSchedules(json.schedules || []);
    } catch {
      // ignore load errors, form still usable
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ loading: false, error: "You must be logged in.", success: "" });
      return;
    }

    const payload = {
      user_id: form.user_id.trim(),
      created_by: user.id,
      account_id: form.account_id.trim() || undefined,
      project_id: form.project_id.trim() || undefined,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes.trim() || undefined,
    };

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus({ loading: false, error: json.error || "Failed to create schedule.", success: "" });
        return;
      }

      setStatus({ loading: false, error: "", success: "Schedule created." });
      setForm({ user_id: "", account_id: "", project_id: "", start_time: "", end_time: "", notes: "" });
      loadSchedules();
    } catch {
      setStatus({ loading: false, error: "Network error, please try again.", success: "" });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Create Schedule</h2>
        <p className="text-xs text-gray-500">
          Only Foreman/Lead users can create schedules. Requires either an account or project ID.
        </p>

        {status.error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{status.error}</div>
        )}
        {status.success && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{status.success}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Assignee user ID"
            value={form.user_id}
            onChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
            placeholder="UUID of user being scheduled"
            required
          />
          <Field
            label="Account ID (optional)"
            value={form.account_id}
            onChange={(v) => setForm((f) => ({ ...f, account_id: v }))}
            placeholder="UUID"
          />
          <Field
            label="Project ID (optional)"
            value={form.project_id}
            onChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
            placeholder="UUID"
          />
          <Field
            label="Notes (optional)"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Shift notes"
          />
          <Field
            label="Start time"
            type="datetime-local"
            value={form.start_time}
            onChange={(v) => setForm((f) => ({ ...f, start_time: v }))}
            required
          />
          <Field
            label="End time"
            type="datetime-local"
            value={form.end_time}
            onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status.loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition disabled:opacity-50"
        >
          <CalendarPlus size={16} /> {status.loading ? "Creating..." : "Create Schedule"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">All Schedules</h2>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {schedules.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-500">No schedules yet.</p>
          )}
          {schedules.map((s) => (
            <div key={s.id} className="px-5 py-4 text-sm">
              <p className="font-semibold text-gray-900">
                {s.status} · {new Date(s.start_time).toLocaleString()} → {new Date(s.end_time).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                User: {s.user_id}
                {s.account_id ? ` · Account: ${s.account_id}` : ""}
                {s.project_id ? ` · Project: ${s.project_id}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}