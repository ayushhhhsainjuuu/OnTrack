"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function formatRole(role) {
  if (!role) return "Employee";

  return role
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRoleFromUser(user) {
  const metadataRole =
    user?.user_metadata?.role ||
    user?.app_metadata?.role;

  if (metadataRole) {
    return formatRole(metadataRole);
  }

  const emailPrefix = user?.email?.split("@")[0]?.toLowerCase();

  const knownRoles = {
    owner: "Owner",
    gm: "General Manager",
    foreman: "Foreman",
    cleaner: "Cleaner",
  };

  return knownRoles[emailPrefix] || "Employee";
}

function getNameFromUser(user) {
  const metadataName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name;

  if (metadataName) {
    return metadataName;
  }

  const emailPrefix = user?.email?.split("@")[0];

  if (!emailPrefix) {
    return "OnTrack User";
  }

  return emailPrefix
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getInitials(name) {
  if (!name) return "OU";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "OU";
}

export default function useAuth() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLogoutError("");

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError("We could not log you out. Please try again.");
      return false;
    }

    router.replace("/auth/login");
    router.refresh();

    return true;
  };

  const name = getNameFromUser(user);
  const role = getRoleFromUser(user);
  const initials = getInitials(name);

  return {
    user,
    name,
    role,
    initials,
    isLoading,
    logout,
    logoutError,
  };
}