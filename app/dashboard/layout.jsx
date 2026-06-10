"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ROLE_ROUTE_MAP = {
  owner: "/dashboard/superadmin",
  gm: "/dashboard/superadmin",
  pm: "/dashboard/admin",
  supervisor: "/dashboard/admin",
  foreman: "/dashboard/employer",
  lead: "/dashboard/employer",
  cleaner: "/dashboard/cleaner",
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/auth/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const destination = ROLE_ROUTE_MAP[profile?.role];

      if (destination && !window.location.pathname.startsWith(destination)) {
        router.replace(destination);
        return;
      }

      setIsCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/auth/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-700">
            Checking your session...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Please wait while we verify your access.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
