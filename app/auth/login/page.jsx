"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import TextInput from "@/components/auth/TextInput";
import PasswordInput from "@/components/auth/PasswordInput";
import {
  REMEMBER_ME_KEY,
  supabase,
} from "@/lib/supabase";

const REMEMBERED_EMAIL_KEY = "ontrack-remembered-email";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedRememberPreference =
      window.localStorage.getItem(REMEMBER_ME_KEY);

    const savedEmail =
      window.localStorage.getItem(REMEMBERED_EMAIL_KEY);

    const shouldRemember =
      savedRememberPreference === "true";

    setRememberMe(shouldRemember);

    if (shouldRemember && savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleRememberMeChange = (event) => {
    const checked = event.target.checked;

    setRememberMe(checked);

    if (!checked) {
      window.localStorage.removeItem(
        REMEMBERED_EMAIL_KEY
      );
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password.trim()) {
      setErrorMessage(
        "Please enter both your email and password."
      );
      return;
    }

    setIsLoading(true);

    window.localStorage.setItem(
      REMEMBER_ME_KEY,
      rememberMe ? "true" : "false"
    );

    if (rememberMe) {
      window.localStorage.setItem(
        REMEMBERED_EMAIL_KEY,
        cleanEmail
      );
    } else {
      window.localStorage.removeItem(
        REMEMBERED_EMAIL_KEY
      );
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (error) {
      setErrorMessage(
        "Invalid email or password. Please try again."
      );
      setIsLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <AuthShell
      badge="Secure Login"
      title="Welcome back"
      subtitle="Sign in to access your OnTrack workspace."
    >
      <form
        onSubmit={handleLogin}
        className="space-y-5"
      >
        <TextInput
          label="Work email"
          type="email"
          name="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <div className="space-y-3">
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#0A3C86]"
              />

              Remember me
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-sm font-bold text-[#0A3C86] transition hover:text-[#062B63]"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-[#062B63] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#0A3C86] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Access is based on your assigned role:
          Employee, Manager, or Admin.
        </div>
      </form>
    </AuthShell>
  );
}