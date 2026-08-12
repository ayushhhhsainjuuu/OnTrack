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
  Sun,
  Moon,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";

function PreferenceToggle({
  label,
  description,
  enabled,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-brand"
            : "bg-input"
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

const cardClass =
  "rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 dark:hover:border-border-hover dark:hover:shadow-lg dark:hover:shadow-black/40";

const titleClass =
  "text-lg font-semibold text-foreground";

const descriptionClass =
  "text-sm text-muted-foreground";

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

  const {
    theme,
    isDark,
    isThemeLoading,
    toggleTheme,
  } = useTheme();

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [
    scheduleNotifications,
    setScheduleNotifications,
  ] = useState(true);

  const [
    attendanceReminders,
    setAttendanceReminders,
  ] = useState(true);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

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
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <Loader2
            className="animate-spin"
            size={20}
          />

          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile, notifications,
          appearance, security, and account.
        </p>
      </div>

      {/* Profile */}
      <section
        className={`${cardClass} overflow-hidden`}
      >
        <div className="border-b border-border px-6 py-5">
          <h2 className={titleClass}>
            Profile information
          </h2>

          <p className={`mt-1 ${descriptionClass}`}>
            Your OnTrack account and assigned role.
          </p>
        </div>

        <div className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-semibold text-white shadow-lg shadow-blue-200 dark:shadow-blue-950/40">
              {initials}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {name}
              </h3>

              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-brand-dark dark:bg-blue-950/50 dark:text-blue-300">
                <ShieldCheck size={14} />
                {role}
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            <ProfileItem
              icon={User}
              label="Full name"
              value={name}
            />

            <ProfileItem
              icon={Mail}
              label="Email address"
              value={
                user?.email || "No email available"
              }
            />

            <ProfileItem
              icon={Briefcase}
              label="Assigned role"
              value={role}
            />

            <ProfileItem
              icon={ShieldCheck}
              label="Account status"
              value="Active"
              active
            />
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5 text-brand dark:bg-blue-950/50 dark:text-blue-300">
            {isDark ? (
              <Moon size={20} />
            ) : (
              <Sun size={20} />
            )}
          </div>

          <div>
            <h2 className={titleClass}>
              Appearance
            </h2>

            <p className={`mt-0.5 ${descriptionClass}`}>
              Choose how OnTrack looks on this device.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-between gap-4 rounded-xl border border-border bg-muted p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-card p-2.5 text-muted-foreground shadow-sm">
              {isDark ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                {isDark ? "Dark mode" : "Light mode"}
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Current theme: {theme}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            disabled={isThemeLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isThemeLoading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />
                Loading...
              </>
            ) : isDark ? (
              <>
                <Sun size={17} />
                Switch to light
              </>
            ) : (
              <>
                <Moon size={17} />
                Switch to dark
              </>
            )}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section
        className={`${cardClass} px-6`}
      >
        <div className="border-b border-border py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-brand dark:bg-blue-950/50 dark:text-blue-300">
              <Bell size={20} />
            </div>

            <div>
              <h2 className={titleClass}>
                Notifications
              </h2>

              <p className={`mt-0.5 ${descriptionClass}`}>
                Choose which updates you would like
                to receive.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
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
      <section className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-muted p-2.5 text-muted-foreground">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h2 className={titleClass}>
              Account and security
            </h2>

            <p className={`mt-0.5 ${descriptionClass}`}>
              Manage your password and account
              security.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <SecurityButton
            icon={LockKeyhole}
            title="Change password"
            description="Update your account password."
          />

          <SecurityButton
            icon={CalendarDays}
            title="Work preferences"
            description="View your scheduling preferences."
          />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-950/30">
          <Clock3
            size={17}
            className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400"
          />

          <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
            Password changes and work preferences
            are currently display-only. Backend
            functionality can be connected later.
          </p>
        </div>
      </section>

      {/* Logout */}
      <section className="rounded-2xl border border-red-200 bg-card p-6 shadow-sm transition-all duration-200 dark:border-red-900/70 dark:hover:shadow-lg dark:hover:shadow-black/40">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 className={titleClass}>
              Log out of OnTrack
            </h2>

            <p className={`mt-1 ${descriptionClass}`}>
              End your current session and return to
              the login page.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

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
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
            {logoutError}
          </div>
        )}
      </section>
    </div>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
  active = false,
}) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4 transition-all duration-200 dark:hover:border-border-hover">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-card p-2 text-muted-foreground shadow-sm">
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">
            {label}
          </p>

          <p
            className={`truncate text-sm font-semibold ${
              active
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-foreground"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SecurityButton({
  icon: Icon,
  title,
  description,
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
    >
      <Icon
        size={18}
        className="text-muted-foreground"
      />

      <div>
        <p className="text-sm font-semibold text-foreground">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}