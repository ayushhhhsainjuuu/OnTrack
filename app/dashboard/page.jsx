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

      // 1) try a profile table (change "users" if your table is named differently)
      const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // 2) fall back to auth metadata if no table row
      const metaRole = user.user_metadata?.role || user.app_metadata?.role;

      const role = (profile?.role || metaRole || "").toLowerCase();

      setState({
        loading: false,
        role,
        email: user.email,
        rawProfile: profile,
        metaRole,
        error: error?.message,
      });
    }
    load();
  }, [router]);

  if (state.loading) return <div className="p-6 text-gray-500">Loading…</div>;

  switch (state.role) {
    case "super_admin":
    case "superadmin":
    case "owner":
    case "gm":        return <SuperAdminDashboard />;
    case "admin":
    case "manager":   return <AdminDashboard />;
    case "cleaner":
    case "employee":  return <EmployeeDashboard />;
  }

  // No role matched — show what we found so we can fix it
  return (
    <div className="p-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 max-w-lg">
        <h2 className="font-semibold text-amber-900 mb-2">No role matched — debug info</h2>
        <pre className="text-xs text-amber-800 whitespace-pre-wrap">
{JSON.stringify({
  email: state.email,
  roleFound: state.role || "(empty)",
  fromTable: state.rawProfile,
  fromMetadata: state.metaRole,
  queryError: state.error,
}, null, 2)}
        </pre>
      </div>
    </div>
  );
}