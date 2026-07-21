"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import SuperAdminDashboard from "@/components/dashboard/SuperAdminDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const role = (
        user.user_metadata?.role ||
        user.app_metadata?.role ||
        ""
      ).toLowerCase();

      setState({
        loading: false,
        role,
        email: user.email,
      });
    }

    load();
  }, [router]);

  if (state.loading) {
    return (
      <div className="p-6 text-sm font-medium text-gray-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  switch (state.role) {
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
              email: state.email,
              roleFound: state.role || "(empty)",
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
