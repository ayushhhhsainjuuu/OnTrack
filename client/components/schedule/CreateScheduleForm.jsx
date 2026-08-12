"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";

import { supabase } from "@/lib/supabase";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-200 dark:border-[#262626] dark:bg-[#121212] dark:hover:border-[#333333] dark:hover:shadow-lg dark:hover:shadow-black/40";

const initialScheduleForm = {
  employeeId: "",
  accountId: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  notes: "",
};

const ROLE_RANK = {
  Owner: 4,
  "General Manager (GM)": 4,
  "Project Manager": 3,
  "Accountant Supervisor": 0,
  Foreman: 2,
  Lead: 2,
  Cleaner: 1,
};

const ASSIGNABLE_SCHEDULE_ROLES = ["Cleaner", "Foreman", "Lead"];

function getRoleRank(role) {
  return ROLE_RANK[role] || 0;
}

export function getAssignableRolesFor(actingRole) {
  const actingRank = getRoleRank(actingRole);

  return ASSIGNABLE_SCHEDULE_ROLES.filter(
    (assignableRole) => actingRank > getRoleRank(assignableRole)
  );
}

export default function CreateScheduleForm({ role, onSuccess }) {
  const assignableRoles = useMemo(
    () => getAssignableRolesFor(role),
    [role]
  );

  const [scheduleForm, setScheduleForm] =
    useState(initialScheduleForm);

  const [assignableEmployees, setAssignableEmployees] =
    useState([]);

  const [assignableEmployeesLoading, setAssignableEmployeesLoading] =
    useState(false);

  const [scheduleAccounts, setScheduleAccounts] =
    useState([]);

  const [createScheduleError, setCreateScheduleError] =
    useState("");

  const [createScheduleSubmitting, setCreateScheduleSubmitting] =
    useState(false);

  const [createScheduleSuccess, setCreateScheduleSuccess] =
    useState(false);

  /*
    Loads the employees this user is allowed to schedule, based on
    the hierarchy above. 
  */
  useEffect(() => {
    if (assignableRoles.length === 0) {
      return;
    }

    let isCancelledRequest = false;

    const loadAssignableEmployees = async () => {
      setAssignableEmployeesLoading(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const response = await fetch(
          `/api/schedule?resource=assignable-employees&roles=${encodeURIComponent(
            assignableRoles.join(",")
          )}`,
          {
            headers: session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {},
          }
        );

        const data = await response.json().catch(() => null);

        if (isCancelledRequest) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.error || "Could not load employees."
          );
        }

        setAssignableEmployees(data || []);
      } catch (error) {
        if (!isCancelledRequest) {
          console.error(
            "Could not load employees for scheduling:",
            error
          );
        }
      } finally {
        if (!isCancelledRequest) {
          setAssignableEmployeesLoading(false);
        }
      }
    };

    loadAssignableEmployees();

    return () => {
      isCancelledRequest = true;
    };
  }, [assignableRoles]);

  /*
    Loads the sites/accounts a schedule can be assigned to. The
    database enforces a "schedules_site_required" check constraint,
    so a site must always be selected when creating a schedule.
  */
  useEffect(() => {
    let isCancelledRequest = false;

    const loadAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from("accounts")
          .select("id, name")
          .eq("is_active", true);

        if (isCancelledRequest) {
          return;
        }

        if (error) throw error;

        setScheduleAccounts(data || []);
      } catch (error) {
        if (!isCancelledRequest) {
          console.error("Could not load sites for scheduling:", error);
        }
      }
    };

    loadAccounts();

    return () => {
      isCancelledRequest = true;
    };
  }, []);

  const updateScheduleField = (field, value) => {
    setScheduleForm((current) => ({
      ...current,
      [field]: value,
    }));

    setCreateScheduleError("");
  };

  /*
    Keeps the end date in sync with the start date until the user
    intentionally picks a different one
  */
  const handleStartDateChange = (value) => {
    setScheduleForm((current) => ({
      ...current,
      startDate: value,
      endDate:
        !current.endDate || current.endDate === current.startDate
          ? value
          : current.endDate,
    }));

    setCreateScheduleError("");
  };

  const handleCreateScheduleSubmit = async (event) => {
    event.preventDefault();
    setCreateScheduleError("");
    setCreateScheduleSuccess(false);

    const {
      employeeId,
      accountId,
      startDate,
      endDate,
      startTime,
      endTime,
      notes,
    } = scheduleForm;

    if (
      !employeeId ||
      !accountId ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime
    ) {
      setCreateScheduleError(
        "Please select an employee, a site, a start/end date, and both shift times."
      );
      return;
    }

    /*
      Manually determines timestamps to prevent weird conversions
    */
    const startTimeIso = `${startDate}T${startTime}:00.000Z`;
    const endTimeIso = `${endDate}T${endTime}:00.000Z`;

    if (new Date(endTimeIso) <= new Date(startTimeIso)) {
      setCreateScheduleError(
        "The end time must be after the start time."
      );
      return;
    }

    setCreateScheduleSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          user_id: employeeId,
          account_id: accountId,
          start_time: startTimeIso,
          end_time: endTimeIso,
          notes: notes.trim() || undefined,
          status: "draft",
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not create the schedule."
        );
      }

      setScheduleForm(initialScheduleForm);

      onSuccess?.("The schedule was created successfully.");        setCreateScheduleSuccess(true);
        window.setTimeout(() => setCreateScheduleSuccess(false), 4000);    } catch (error) {
      setCreateScheduleError(
        error.message || "Could not create the schedule."
      );
    } finally {
      setCreateScheduleSubmitting(false);
    }
  };

  return (
    <div className={`${cardClass} p-6`}>
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        Create schedule
      </h2>

      <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
        Assign a shift to an employee you manage.
        {" "}As {role}, you can schedule:{" "}
        {assignableRoles.join(", ") || "no roles"}.
      </p>

      <form
        onSubmit={handleCreateScheduleSubmit}
        className="mt-5 space-y-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="create-schedule-employee"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Employee
            </label>

          <select
            id="create-schedule-employee"
            value={scheduleForm.employeeId}
            onChange={(event) =>
              updateScheduleField(
                "employeeId",
                event.target.value
              )
            }
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
          >
            <option value="">
              {assignableEmployeesLoading
                ? "Loading employees..."
                : assignableEmployees.length === 0
                ? "No employees available"
                :"Select an employee"}
            </option>
              {assignableEmployees.map((employee) => (
                <option
                  key={employee.id}
                  value={employee.id}
                >
                  {employee.full_name} — {employee.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="create-schedule-account"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Site
            </label>

            <select
              id="create-schedule-account"
              value={scheduleForm.accountId}
              onChange={(event) =>
                updateScheduleField(
                  "accountId",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
            >
              <option value="">
                {scheduleAccounts.length === 0
                  ? "No sites available"
                  : "Select a site"}
              </option>

              {scheduleAccounts.map((account) => (
                <option
                  key={account.id}
                  value={account.id}
                >
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="create-schedule-date"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Start date
            </label>

            <input
              id="create-schedule-date"
              type="date"
              value={scheduleForm.startDate}
              onChange={(event) =>
                handleStartDateChange(event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
            />
          </div>

          <div>
            <label
              htmlFor="create-schedule-start"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Start time
            </label>

            <input
              id="create-schedule-start"
              type="time"
              value={scheduleForm.startTime}
              onChange={(event) =>
                updateScheduleField(
                  "startTime",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="create-schedule-end-date"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              End date
            </label>

            <input
              id="create-schedule-end-date"
              type="date"
              value={scheduleForm.endDate}
              min={scheduleForm.startDate || undefined}
              onChange={(event) =>
                updateScheduleField(
                  "endDate",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
            />

            <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
              Defaults to the start date. Pick the next day for
              overnight shifts.
            </p>
          </div>

          <div>
            <label
              htmlFor="create-schedule-end"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              End time
            </label>

            <input
              id="create-schedule-end"
              type="time"
              value={scheduleForm.endTime}
              onChange={(event) =>
                updateScheduleField(
                  "endTime",
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-blue-950"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="create-schedule-notes"
            className="text-sm font-semibold text-gray-700 dark:text-slate-200"
          >
            Notes (optional)
          </label>

          <textarea
            id="create-schedule-notes"
            rows={3}
            maxLength={300}
            value={scheduleForm.notes}
            onChange={(event) =>
              updateScheduleField(
                "notes",
                event.target.value
              )
            }
            placeholder="Add any details for this shift..."
            className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
          />
        </div>

        {createScheduleError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
            Something went wrong during schedule creation. {createScheduleError}
          </div>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-[#262626]">
          <button
            type="submit"
            disabled={createScheduleSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8]"
          >
            {createScheduleSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create Schedule
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
