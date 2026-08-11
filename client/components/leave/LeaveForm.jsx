"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Loader2,
  Send,
  X,
} from "lucide-react";

// Default values the form starts with (and resets to)
const initialForm = {
  type: "Annual Leave",
  startDate: "",
  endDate: "",
  reason: "",
};

// List of words to block from the leave reason field
const bannedWords = ["kill", "bitch", "fuck", "shit", "asshole", "bastard"];

// Checks if the given text contains any banned/inappropriate words
function containsProfanity(text) {
  if (!text) return false;
  return bannedWords.some((word) => text.toLowerCase().includes(word));
}

// Count total leave days between two dates (inclusive of both)
function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (end < start) {
    return 0; // invalid range
  }

  const difference =
    end.getTime() - start.getTime();

  // Divide ms by one day (86400000 ms), +1 so both start and end days count
  return Math.floor(difference / 86400000) + 1;
}

// Build the allowed date range: today up to exactly 1 year from today
function getDateLimits() {
  const today = new Date();

  const oneYear = new Date();
  oneYear.setFullYear(today.getFullYear() + 1); // same date, next year

  // Date inputs need "YYYY-MM-DD" format
  const format = (d) => d.toISOString().split("T")[0];

  return {
    min: format(today),     // earliest selectable = today (no past dates)
    max: format(oneYear),   // latest selectable = 1 year from today
  };
}

export default function LeaveForm({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(initialForm);     // form field values
  const [error, setError] = useState("");            // validation error message
  const [isSubmitting, setIsSubmitting] =
    useState(false);                                 // disables button while submitting

  // Recalculate day count only when the dates change
  const totalDays = useMemo(
    () => calculateDays(form.startDate, form.endDate),
    [form.startDate, form.endDate]
  );

  // Today + 1-year limits, used by both date pickers below
  const dateLimits = getDateLimits();

  // Don't render anything if the modal is closed
  if (!isOpen) {
    return null;
  }

  // Update a single field and clear any existing error
  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  };

  // Clear the form back to defaults
  const resetForm = () => {
    setForm(initialForm);
    setError("");
    setIsSubmitting(false);
  };

  // Reset then close the modal
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Validate inputs, then hand the request off to the parent via onSubmit
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Required fields check
    if (!form.type || !form.startDate || !form.endDate) {
      setError(
        "Please select a leave type and enter both dates."
      );
      return;
    }

    // End date must not be before start date
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError(
        "The end date cannot be before the start date."
      );
      return;
    }

    // Backup check: block dates more than 1 year out (catches manually typed dates)
    if (new Date(form.endDate) > new Date(dateLimits.max)) {
      setError(
        "Leave cannot be requested more than one year in advance."
      );
      return;
    }

    // Reason is required
    if (!form.reason.trim()) {
      setError(
        "Please provide a short reason for your request."
      );
      return;
    }

    // Reason must have a bit of detail
    if (form.reason.trim().length < 5) {
      setError(
        "Please provide a little more detail in the reason."
      );
      return;
    }

    // Block inappropriate language in the reason
    if (containsProfanity(form.reason)) {
      setError(
        "Please remove inappropriate language from your reason."
      );
      return;
    }

    setIsSubmitting(true);

    // Fake delay to show the loading state (replace with real API call later)
    await new Promise((resolve) =>
      setTimeout(resolve, 500)
    );

    // Send the cleaned-up request data up to the parent component
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
    // Full-screen dark overlay behind the modal
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#1E293B]">
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
          {/* Leave type dropdown */}
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
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
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

          {/* Start + end date pickers (side by side on larger screens) */}
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
                min={dateLimits.min}   // can't pick a past date
                max={dateLimits.max}   // can't pick more than 1 year ahead
                onChange={(event) =>
                  updateField(
                    "startDate",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
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
                min={form.startDate || dateLimits.min}  // not before start (or today)
                max={dateLimits.max}                     // not more than 1 year ahead
                onChange={(event) =>
                  updateField(
                    "endDate",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-indigo-950"
              />
            </div>
          </div>

          {/* Live day count — only shows once a valid range is picked */}
          {totalDays > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/30 dark:text-indigo-300">
              <CalendarDays size={17} />

              {totalDays} leave{" "}
              {totalDays === 1 ? "day" : "days"} selected
            </div>
          )}

          {/* Reason text area with a 300 char limit + counter */}
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
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-indigo-950"
            />

            {/* Character counter */}
            <p className="mt-1 text-right text-xs text-gray-400 dark:text-slate-500">
              {form.reason.length}/300
            </p>
          </div>

          {/* Validation error message (only shows when there's an error) */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Footer: Cancel + Submit buttons */}
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {/* Swap button label/icon based on submitting state */}
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