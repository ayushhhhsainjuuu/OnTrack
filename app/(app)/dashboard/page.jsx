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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // role is stored in Supabase Auth user metadata via SQL update
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

  if (state.loading) return <div className="p-6 text-gray-500">Loading...</div>;

  switch (state.role) {
    case "owner":
    case "general manager (gm)":  return <SuperAdminDashboard />;
    case "project manager":
    case "accountant supervisor":  return <AdminDashboard />;
    case "foreman":
    case "lead":
    case "cleaner":               return <EmployeeDashboard />;
  }

  // no role matched -- show debug info
  return (
    <div className="p-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 max-w-lg">
        <h2 className="font-semibold text-amber-900 mb-2">No role matched -- debug info</h2>
        <pre className="text-xs text-amber-800 whitespace-pre-wrap">
{JSON.stringify({
  email: state.email,
  roleFound: state.role || "(empty)",
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}