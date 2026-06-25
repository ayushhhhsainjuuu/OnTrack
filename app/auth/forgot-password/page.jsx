import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import TextInput from "@/components/auth/TextInput";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      badge="Account Recovery"
      title="Forgot password?"
      subtitle="Enter your work email and we will send instructions to reset your password."
    >
      <form className="space-y-5">
        <TextInput
          label="Work email"
          type="email"
          name="email"
          placeholder="you@company.com"
        />

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#062B63] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-[#0A3C86] hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          Send reset link
        </button>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm leading-6 text-slate-600">
          Use the email address connected to your OnTrack account.
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm font-bold text-[#0A3C86] transition hover:text-[#062B63]"
          >
            ← Back to login
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}