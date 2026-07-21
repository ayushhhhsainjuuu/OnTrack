"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Send,
  X,
} from "lucide-react";

const initialForm = {
  type: "Annual Leave",
  startDate: "",
  endDate: "",
  reason: "",
};

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (end < start) {
    return 0;
  }

  const difference =
    end.getTime() - start.getTime();

  return Math.floor(difference / 86400000) + 1;
}

export default function LeaveForm({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const totalDays = useMemo(
    () => calculateDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  if (!isOpen) {
    return null;
  }

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.type || !form.startDate || !form.endDate) {
      setError(
        "Please select a leave type and enter both dates."
      );
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError(
        "The end date cannot be before the start date."
      );
      return;
    }

    if (!form.reason.trim()) {
      setError(
        "Please provide a short reason for your request."
      );
      return;
    }

    if (form.reason.trim().length < 5) {
      setError(
        "Please provide a little more detail in the reason."
      );
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    onSubmit({
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
      days: totalDays,
    });

    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111c2d]">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Request leave
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Submit a new leave request for manager
              review.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Close leave request form"
          >
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >
          <div>
            <label
              htmlFor="leave-type"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Leave type
            </label>

            <select
              id="leave-type"
              value={form.type}
              onChange={(event) =>
                updateField("type", event.target.value)
              }
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
            >
              <option value="Annual Leave">
                Annual Leave
              </option>
              <option value="Sick Leave">
                Sick Leave
              </option>
              <option value="Personal Leave">
                Personal Leave
              </option>
              <option value="Unpaid Leave">
                Unpaid Leave
              </option>
              <option value="Bereavement Leave">
                Bereavement Leave
              </option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="leave-start-date"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                Start date
              </label>

              <input
                id="leave-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField(
                    "startDate",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
              />
            </div>

            <div>
              <label
                htmlFor="leave-end-date"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                End date
              </label>

              <input
                id="leave-end-date"
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(event) =>
                  updateField(
                    "endDate",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-blue-300">
              <CalendarDays size={17} />

              {totalDays} leave{" "}
              {totalDays === 1 ? "day" : "days"} selected
            </div>
          )}

          <div>
            <label
              htmlFor="leave-reason"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Reason
            </label>

            <textarea
              id="leave-reason"
              rows={4}
              maxLength={300}
              value={form.reason}
              onChange={(event) =>
                updateField("reason", event.target.value)
              }
              placeholder="Briefly explain the reason for your leave request..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
            />

            <p className="mt-1 text-right text-xs text-gray-400 dark:text-slate-500">
              {form.reason.length}/300
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}