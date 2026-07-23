"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  CheckSquare,
  Settings,
  Bell,
  Menu,
  FolderKanban,
  Loader2,
  CheckCheck,
  CalendarClock,
  ClipboardCheck,
  ClipboardClock,
  Clock3,
  X,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

const baseNav = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/schedule",
    label: "Schedule & Leave",
    icon: CalendarRange,
  },
  {
    href: "/task",
    label: "Tasks",
    icon: CheckSquare,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

const projectsNavItem = {
  href: "/projects",
  label: "Projects",
  icon: FolderKanban,
};

const attendanceNavItem = {
  href: "/attendance",
  label: "Attendance",
  icon: ClipboardClock,
};

const initialNotifications = [
  {
    id: 1,
    title: "Schedule updated",
    message: "Your Tuesday shift now starts at 10:00 AM.",
    time: "5 min ago",
    read: false,
    type: "schedule",
  },
  {
    id: 2,
    title: "Leave request approved",
    message:
      "Your annual leave request for June 20–21 was approved.",
    time: "1 hr ago",
    read: false,
    type: "leave",
  },
  {
    id: 3,
    title: "New task assigned",
    message:
      "Complete the weekly workplace checklist.",
    time: "3 hrs ago",
    read: false,
    type: "task",
  },
  {
    id: 4,
    title: "Clock-in reminder",
    message:
      "Your next shift begins tomorrow at 9:00 AM.",
    time: "Yesterday",
    read: true,
    type: "attendance",
  },
];

function NotificationIcon({ type }) {
  const sharedClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl";

  if (type === "schedule") {
    return (
      <div
        className={`${sharedClass} bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300`}
      >
        <CalendarClock size={17} />
      </div>
    );
  }

  if (type === "leave") {
    return (
      <div
        className={`${sharedClass} bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300`}
      >
        <CheckCheck size={17} />
      </div>
    );
  }

  if (type === "task") {
    return (
      <div
        className={`${sharedClass} bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300`}
      >
        <ClipboardCheck size={17} />
      </div>
    );
  }

  return (
    <div
      className={`${sharedClass} bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300`}
    >
      <Clock3 size={17} />
    </div>
  );
}

function canViewAttendance(role) {
  const normalizedRole = (role || "")
    .trim()
    .toLowerCase();

  return [
    "owner",
    "general manager (gm)",
    "general manager",
    "gm",
    "foreman",
  ].includes(normalizedRole);
}

function canViewProjects(role) {
  const normalizedRole = (role || "")
    .trim()
    .toLowerCase();

  return [
    "owner",
    "general manager (gm)",
    "general manager",
    "gm",
  ].includes(normalizedRole);
}

export default function DashboardLayout({
  children,
}) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState(initialNotifications);

  const notificationRef = useRef(null);

  const {
    name,
    role,
    initials,
    isLoading,
  } = useAuth();

  const showAttendance =
    !isLoading && canViewAttendance(role);

  const showProjects =
    !isLoading && canViewProjects(role);

  const nav = [
    baseNav[0],
    ...(showProjects ? [projectsNavItem] : []),
    ...(showAttendance ? [attendanceNavItem] : []),
    ...baseNav.slice(1),
  ];

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-200 dark:bg-[#07111f] dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0b1b3f] text-white transition-transform duration-200 dark:bg-[#07152f] md:translate-x-0 ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-6">
          <img
            src="/ontrack-logo.png"
            alt="OnTrack"
            className="h-9 w-9 rounded-xl"
          />

          <span className="text-lg font-bold">
            OnTrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(
            ({
              href,
              label,
              icon: Icon,
            }) => {
              const active =
                pathname === href ||
                pathname.startsWith(
                  `${href}/`
                );

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() =>
                    setOpen(false)
                  }
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[#2563eb] text-white shadow-lg"
                      : "text-slate-300 hover:bg-[#16294f] hover:text-white dark:hover:bg-[#132748]"
                  }`}
                >
                  <Icon size={18} />

                  {label}

                  {active && (
                    <span className="ml-auto text-white/70">
                      ›
                    </span>
                  )}
                </Link>
              );
            }
          )}
        </nav>

        {/* User card */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold">
              {isLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                initials
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {isLoading
                  ? "Loading..."
                  : name}
              </p>

              <p className="truncate text-xs text-slate-400">
                {isLoading
                  ? "Checking account"
                  : role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-gray-200 bg-white/80 px-4 backdrop-blur transition-colors duration-200 dark:border-slate-700 dark:bg-[#111c2d]/90 md:px-8">
          <button
            type="button"
            className="-ml-2 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div
              ref={notificationRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setNotificationsOpen(
                    (current) => !current
                  )
                }
                className="relative rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label={`Notifications, ${unreadCount} unread`}
                aria-expanded={
                  notificationsOpen
                }
              >
                <Bell size={20} />

                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white dark:border-[#111c2d]">
                    {unreadCount > 9
                      ? "9+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed left-4 right-4 top-16 z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111c2d] sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-[390px]">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-slate-700">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        Notifications
                      </h2>

                      <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        {unreadCount === 0
                          ? "You are all caught up"
                          : `${unreadCount} unread notification${
                              unreadCount ===
                              1
                                ? ""
                                : "s"
                            }`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNotificationsOpen(
                          false
                        )
                      }
                      className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      aria-label="Close notifications"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Notification list */}
                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length ===
                    0 ? (
                      <div className="px-6 py-12 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
                          <Bell size={21} />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                          No notifications
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                          New schedule and
                          account updates will
                          appear here.
                        </p>
                      </div>
                    ) : (
                      notifications.map(
                        (notification) => (
                          <button
                            key={
                              notification.id
                            }
                            type="button"
                            onClick={() =>
                              markAsRead(
                                notification.id
                              )
                            }
                            className={`flex w-full gap-3 border-b border-gray-100 px-5 py-4 text-left transition last:border-0 dark:border-slate-700 ${
                              notification.read
                                ? "bg-white hover:bg-gray-50 dark:bg-[#111c2d] dark:hover:bg-slate-800/70"
                                : "bg-blue-50/60 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                            }`}
                          >
                            <NotificationIcon
                              type={
                                notification.type
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.read && (
                                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                )}
                              </div>

                              <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-slate-400">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-1.5 text-[11px] font-medium text-gray-400 dark:text-slate-500">
                                {
                                  notification.time
                                }
                              </p>
                            </div>
                          </button>
                        )
                      )
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={
                          unreadCount === 0
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400 dark:hover:bg-blue-950/30"
                      >
                        <CheckCheck
                          size={15}
                        />
                        Mark all as read
                      </button>

                      <button
                        type="button"
                        onClick={
                          clearNotifications
                        }
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563eb] text-sm font-semibold text-white">
              {isLoading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}