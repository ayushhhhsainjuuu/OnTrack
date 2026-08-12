"use client";

import { useState } from "react";
import { Check, Copy, Loader2, UserPlus, X } from "lucide-react";

import useAuth from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import TextInput from "@/components/auth/TextInput";

const ASSIGNABLE_ROLES = [
  "Project Manager",
  "Accountant Supervisor",
  "Foreman",
  "Lead",
  "Cleaner",
];

const initialForm = {
  email: "",
  full_name: "",
  system_role: ASSIGNABLE_ROLES[0],
};

const PASSWORD_POOLS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  special: "!@#$%^&*",
};

const ALL_PASSWORD_CHARS = Object.values(PASSWORD_POOLS).join("");

function isOwnerOrGM(role) {
  const normalized = role?.toLowerCase() || "";
  return normalized.includes("owner") || normalized.includes("general manager");
}

function randomChar(pool) {
  const [randomValue] = crypto.getRandomValues(new Uint32Array(1));
  return pool[randomValue % pool.length];
}

// Uses the Web Crypto API (not Math.random) since this password is a real credential.
// Guarantees at least one lowercase, uppercase, digit, and special character so it
// always satisfies typical password-complexity requirements, rather than leaving
// that to chance.
function generatePassword(length = 16) {
  const required = Object.values(PASSWORD_POOLS).map(randomChar);
  const remaining = Array.from({ length: length - required.length }, () =>
    randomChar(ALL_PASSWORD_CHARS)
  );

  const chars = [...required, ...remaining];

  // Fisher-Yates shuffle so the guaranteed characters aren't always at the start.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const [randomValue] = crypto.getRandomValues(new Uint32Array(1));
    const j = randomValue % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-1">
      <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <span className="flex-1 truncate font-mono text-sm text-slate-800 dark:text-slate-100">
          {value}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
        >
          {copied ? (
            <Check size={16} className="text-emerald-600" />
          ) : (
            <Copy size={16} />
          )}
        </button>
      </div>
    </div>
  );
}

function CredentialsModal({ credentials, onClose }) {
  const [confirmingClose, setConfirmingClose] = useState(false);

  // The password is only ever shown here, so require a second confirm
  // before closing to lower the risk of accidentally losing it.
  const requestClose = () => {
    if (!confirmingClose) {
      setConfirmingClose(true);
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-[#1E293B]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Employee created
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Make sure to send these credentials to the employee.
            </p>
          </div>

          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <CopyField label="Email" value={credentials.email} />
          <CopyField label="Password" value={credentials.password} />
        </div>

        {confirmingClose ? (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              These Credentials won&apos;t be shown again. Have you copied it?
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingClose(false)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Go back
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl bg-[#0A3C86] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3C86]/90"
              >
                Yes, close
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={requestClose}
            className="mt-5 w-full rounded-2xl bg-[#0A3C86] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3C86]/90"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

export default function AddEmployeeForm() {
  const { role, isLoading } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);

  if (isLoading) {
    return null;
  }

  // Only Owner/GM may add new employees - hide the form entirely otherwise.
  if (!isOwnerOrGM(role)) {
    return null;
  }

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const password = generatePassword();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ ...form, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Could not create employee.");
      }

      setCredentials({ email: form.email, password });
      setForm(initialForm);
    } catch (submitError) {
      console.error("Add employee failed:", submitError);
      setError("Something went wrong while creating the employee. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1E293B]">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <UserPlus size={20} />
        Add Employee
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextInput
          label="Full name"
          name="full_name"
          placeholder="Jane Doe"
          value={form.full_name}
          onChange={updateField("full_name")}
          required
          labelClassName="text-slate-700 dark:text-slate-200"
        />

        <TextInput
          label="Email"
          type="email"
          name="email"
          placeholder="jane@example.com"
          value={form.email}
          onChange={updateField("email")}
          required
          labelClassName="text-slate-700 dark:text-slate-200"
        />

        <label className="block space-y-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Role</span>

          <select
            name="system_role"
            value={form.system_role}
            onChange={updateField("system_role")}
            required
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#0A3C86] focus:ring-4 focus:ring-blue-100"
          >
            {ASSIGNABLE_ROLES.map((assignableRole) => (
              <option key={assignableRole} value={assignableRole}>
                {assignableRole}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A3C86] px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A3C86]/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {submitting ? "Creating..." : "Create employee"}
        </button>
      </form>

      {credentials && (
        <CredentialsModal
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}
