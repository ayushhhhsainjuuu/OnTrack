"use client";

import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";

const initialForm = {
  title: "",
  cat: "Foreman",
  due: "",
  by: "",
  priority: "MEDIUM",
};

function formatDueDate(due) {
  if (!due) {
    return "";
  }

  const date = new Date(`${due}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TaskForm({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!form.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!form.due) {
      setError("Please choose a due date.");
      return;
    }

    if (!form.by.trim()) {
      setError("Please enter who assigned this task.");
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    onSubmit({
      title: form.title.trim(),
      cat: form.cat,
      due: formatDueDate(form.due),
      by: form.by.trim(),
      priority: form.priority,
      status: "To Do",
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
              New task
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Add a new task to your list.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Close new task form"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label
              htmlFor="task-title"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Title
            </label>

            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="e.g. Restock condiment station"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-category"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                Category
              </label>

              <select
                id="task-category"
                value={form.cat}
                onChange={(event) => updateField("cat", event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
              >
                <option value="Foreman">Foreman</option>
                <option value="Cleaner">Cleaner</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                Priority
              </label>

              <select
                id="task-priority"
                value={form.priority}
                onChange={(event) => updateField("priority", event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-due"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                Due date
              </label>

              <input
                id="task-due"
                type="date"
                value={form.due}
                onChange={(event) => updateField("due", event.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
              />
            </div>

            <div>
              <label
                htmlFor="task-by"
                className="text-sm font-semibold text-gray-700 dark:text-slate-200"
              >
                Assigned by
              </label>

              <input
                id="task-by"
                type="text"
                value={form.by}
                onChange={(event) => updateField("by", event.target.value)}
                placeholder="e.g. Manager"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950"
              />
            </div>
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
                  <Loader2 size={16} className="animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Add task
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
