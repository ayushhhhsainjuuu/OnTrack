"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

// Popup where a manager types a note before rejecting a leave request
export default function RejectModal({
  request,
  isOpen,
  onClose,
  onConfirm,
}) {
  const [note, setNote] = useState("");    // the rejection note text
  const [error, setError] = useState("");  // validation error message

  // Don't render if closed, or if no request was passed in
  if (!isOpen || !request) {
    return null;
  }

  // Clear the note + error, then close the modal
  const handleClose = () => {
    setNote("");
    setError("");
    onClose();
  };

  // Validate the note, then send the rejection up to the parent
  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedNote = note.trim();

    // Note is required
    if (!cleanedNote) {
      setError("A rejection note is required.");
      return;
    }

    // Note must have some detail
    if (cleanedNote.length < 5) {
      setError("Please provide a more detailed rejection note.");
      return;
    }

    // Passes the request id + note back to ManagerReviewQueue
    onConfirm(request.id, cleanedNote);
    setNote("");
    setError("");
  };

  return (
    // Full-screen dark overlay (z-80 so it sits above other modals)
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111c2d]">
        {/* Header: warning icon, title, close button */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Reject leave request
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Add a note explaining why the request is being rejected.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-white"
            aria-label="Close rejection window"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {/* Summary of which request is being rejected */}
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-slate-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {request.employee}
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {request.type} · {request.range}
            </p>
          </div>

          {/* Rejection note text area with 300 char limit + counter */}
          <div>
            <label
              htmlFor="rejection-note"
              className="text-sm font-semibold text-gray-700 dark:text-slate-200"
            >
              Rejection note
            </label>

            <textarea
              id="rejection-note"
              rows={4}
              maxLength={300}
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setError("");   // clear error as they type
              }}
              placeholder="Explain why this leave request cannot be approved..."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-red-950"
            />

            {/* Character counter */}
            <p className="mt-1 text-right text-xs text-gray-400 dark:text-slate-500">
              {note.length}/300
            </p>
          </div>

          {/* Validation error message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Footer: Go back (cancel) + Reject request (confirm) */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Go back
            </button>

            <button
              type="submit"
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Reject request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}