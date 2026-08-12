"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function RejectModal({
  request,
  isOpen,
  onClose,
  onConfirm,
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !request) {
    return null;
  }

  const handleClose = () => {
    setNote("");
    setError("");
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedNote = note.trim();

    if (!cleanedNote) {
      setError("A rejection note is required.");
      return;
    }

    if (cleanedNote.length < 5) {
      setError("Please provide a more detailed rejection note.");
      return;
    }

    onConfirm(request.id, cleanedNote);
    setNote("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <AlertTriangle size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Reject leave request
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add a note explaining why the request is being rejected.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close rejection window"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm font-semibold text-foreground">
              {request.employee}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {request.type} · {request.range}
            </p>
          </div>

          <div>
            <label
              htmlFor="rejection-note"
              className="text-sm font-semibold text-foreground"
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
                setError("");
              }}
              placeholder="Explain why this leave request cannot be approved..."
              className="mt-2 w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950"
            />

            <p className="mt-1 text-right text-xs text-muted-foreground">
              {note.length}/300
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted"
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