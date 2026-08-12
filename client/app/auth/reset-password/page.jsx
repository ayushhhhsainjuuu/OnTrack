import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/auth/PasswordInput";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      badge="New Password"
      title="Reset password"
      subtitle="Create a secure new password for your OnTrack account."
    >
      <form className="space-y-5">
        <PasswordInput
          label="New password"
          name="newPassword"
          placeholder="Enter new password"
        />

        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          placeholder="Re-enter new password"
        />

        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-dark px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-brand hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          Update password
        </button>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Use at least 8 characters with a mix of letters, numbers, and symbols.
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-brand transition hover:text-brand-dark"
          >
            ← Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}