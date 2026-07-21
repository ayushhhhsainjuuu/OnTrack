"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Umbrella,
  CheckCircle2,
} from "lucide-react";
import WeeklyCalender from "@/components/schedule/WeeklyCalender";
import LeaveForm from "@/components/leave/LeaveForm";
import LeaveTable from "@/components/leave/LeaveTable";

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

const initialRequests = [
  {
    id: 1,
    type: "Annual Leave",
    range: "Jun 20 – Jun 21 · 2 days",
    submitted: "Jun 5",
    status: "Approved",
    reason: "Family event outside the city.",
  },
  {
    id: 2,
    type: "Sick Leave",
    range: "Jun 18 · 1 day",
    submitted: "Jun 9",
    status: "Pending",
    reason: "Medical appointment and recovery time.",
  },
  {
    id: 3,
    type: "Annual Leave",
    range: "Jul 4 – Jul 7 · 4 days",
    submitted: "Jun 8",
    status: "Pending",
    reason: "Previously planned family trip.",
  },
  {
    id: 4,
    type: "Personal Leave",
    range: "May 12 · 1 day",
    submitted: "May 4",
    status: "Rejected",
    reason: "Personal appointment.",
    rejectionNote:
      "The request overlaps with a high-demand shift.",
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

export default function SchedulePage() {
  const [tab, setTab] = useState("schedule");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date())
  );

  const [leaveFormOpen, setLeaveFormOpen] =
    useState(false);

  const [leaveRequests, setLeaveRequests] =
    useState(initialRequests);

  const [successMessage, setSuccessMessage] =
    useState("");

  const today = new Date();

  const week = useMemo(() => {
    return shiftPattern.map((shift, index) => {
      const fullDate = addDays(weekStart, index);

      return {
        ...shift,
        fullDate,
        day: fullDate
          .toLocaleDateString("en-CA", {
            weekday: "short",
          })
          .toUpperCase(),
        date: fullDate.getDate(),
        today: sameDate(fullDate, today),
      };
    });
  }, [weekStart]);

  const weekEnd = addDays(weekStart, 6);

  const handleNewLeaveRequest = (request) => {
    const newRequest = {
      id: Date.now(),
      type: request.type,
      range: createRangeLabel(
        request.startDate,
        request.endDate,
        request.days
      ),
      submitted: formatSubmittedDate(new Date()),
      status: "Pending",
      reason: request.reason,
    };

    setLeaveRequests((current) => [
      newRequest,
      ...current,
    ]);

    setSuccessMessage(
      "Your leave request was submitted successfully."
    );

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);
  };

  const handleCancelRequest = (requestId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this leave request?"
    );

    if (!confirmed) {
      return;
    }

    setLeaveRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "Cancelled",
            }
          : request
      )
    );
  };

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
            {item === "schedule"
              ? "My Schedule"
              : "Leave"}
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
            setWeekStart(startOfWeek(new Date()))
          }
        />
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

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                My leave requests
              </h2>

              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                View pending and previous requests or
                submit a new one.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLeaveFormOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              <Plus size={16} />
              New Request
            </button>
          </div>

          <LeaveTable
            requests={leaveRequests}
            onCancel={handleCancelRequest}
          />
        </div>
      )}

      <LeaveForm
        isOpen={leaveFormOpen}
        onClose={() => setLeaveFormOpen(false)}
        onSubmit={handleNewLeaveRequest}
      />
    </div>
  );
}