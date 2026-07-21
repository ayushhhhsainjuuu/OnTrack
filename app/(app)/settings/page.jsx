"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Briefcase,
  Bell,
  CalendarDays,
  Clock3,
  LockKeyhole,
  LogOut,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

function PreferenceToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled ? "bg-[#2563eb]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    user,
    name,
    role,
    initials,
    isLoading,
    logout,
    logoutError,
  } = useAuth();

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [scheduleNotifications, setScheduleNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out of OnTrack?"
    );

    if (!confirmed) return;

    setIsLoggingOut(true);

    const success = await logout();

    if (!success) {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-gray-500">
          <Loader2 className="animate-spin" size={20} />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Account
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your profile, notifications, security, and account.
        </p>
      </div>

      {/* Profile */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-bold text-gray-900">
            Profile information
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Your OnTrack account and assigned role.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#2563eb] text-2xl font-bold text-white shadow-lg shadow-blue-200">
              {initials}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-xl font-bold text-gray-900">
                {name}
              </h3>

              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1d4ed8]">
                <ShieldCheck size={14} />
                {role}
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    Full name
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {name}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                  <Mail size={18} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500">
                    Email address
                  </p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {user?.email || "No email available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                  <Briefcase size={18} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Assigned role
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {role}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm">
                  <ShieldCheck size={18} />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Account status
                  </p>
                  <p className="text-sm font-semibold text-green-700">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-gray-200 bg-white px-6 shadow-sm">
        <div className="border-b border-gray-100 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-[#2563eb]">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Choose which updates you would like to receive.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          <PreferenceToggle
            label="Email notifications"
            description="Receive important OnTrack account updates by email."
            enabled={emailNotifications}
            onChange={setEmailNotifications}
          />

          <PreferenceToggle
            label="Schedule updates"
            description="Receive alerts when your schedule or assigned shift changes."
            enabled={scheduleNotifications}
            onChange={setScheduleNotifications}
          />

          <PreferenceToggle
            label="Attendance reminders"
            description="Receive reminders related to clocking in and clocking out."
            enabled={attendanceReminders}
            onChange={setAttendanceReminders}
          />
        </div>
      </section>

      {/* Account and security */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gray-100 p-2.5 text-gray-600">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">
              Account and security
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage your password and account security.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
          >
            <LockKeyhole size={18} className="text-gray-500" />

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Change password
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Update your account password.
              </p>
            </div>
          </button>

          <button
            type="button"
            className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
          >
            <CalendarDays size={18} className="text-gray-500" />

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Work preferences
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                View your scheduling preferences.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock3 size={17} className="mt-0.5 shrink-0 text-amber-700" />

          <p className="text-xs leading-5 text-amber-800">
            Password changes and work preferences are currently display-only.
            Backend functionality can be connected later.
          </p>
        </div>
      </section>

      {/* Logout */}
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Log out of OnTrack
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              End your current session and return to the login page.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={17} />
                Log out
              </>
            )}
          </button>
        </div>

        {logoutError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {logoutError}
          </div>
        )}
      </section>
    </div>
  );
}