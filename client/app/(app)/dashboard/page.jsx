"use client";

import { useRouter } from "next/navigation";

import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";
import useAuth from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="p-6 text-sm font-medium text-gray-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  if (!user) {
    router.replace("/auth/login");
    return null;
  }

  const normalizedRole = (role || "").toLowerCase();

  switch (normalizedRole) {
    case "owner":
    case "general manager (gm)":
      return <SuperAdminDashboard />;

    case "project manager":
    case "accountant supervisor":
      return <AdminDashboard />;

    case "foreman":
    case "lead":
    case "cleaner":
      return <EmployeeDashboard />;
  }

  return (
    <div className="p-6">
      <div className="max-w-lg rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/30">
        <h2 className="mb-2 font-semibold text-amber-900 dark:text-amber-200">
          No role matched — debug info
        </h2>

        <pre className="whitespace-pre-wrap text-xs text-amber-800 dark:text-amber-300">
          {JSON.stringify(
            {
              email: user.email,
              roleFound: role || "(empty)",
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}