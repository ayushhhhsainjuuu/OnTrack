import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import TextInput from "@/components/auth/TextInput";
import PasswordInput from "@/components/auth/PasswordInput";

export default function LoginPage() {
  return (
    <AuthShell
      badge="Secure Login"
      title="Welcome back"
      subtitle="Sign in to access your OnTrack workspace."
    >
      <form className="space-y-5">
        <TextInput
          label="Work email"
          type="email"
          name="email"
          placeholder="you@company.com"
        />

        <div className="space-y-3">
          <PasswordInput
            label="Password"
            name="password"
            placeholder="Enter your password"
          />

          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-[#0A3C86]"
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

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#062B63] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#0A3C86] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          Sign in
        </button>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Access is based on your assigned role: Employee, Manager, or Admin.
        </div>
      </form>
    </AuthShell>
  );
}