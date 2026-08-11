import Image from "next/image";

export default function AuthShell({ title, subtitle, badge, children }) {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-900">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-180px] h-[480px] w-[480px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#123b73_0%,transparent_35%),linear-gradient(135deg,#020817_0%,#07182f_45%,#020817_100%)]" />

        <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[400px]">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl">
                  <Image
                    src="/ontrack-logo.png"
                    alt="OnTrack logo"
                    width={90}
                    height={90}
                    className="h-[72px] w-[72px] object-cover"
                    priority
                  />
                </div>

                <div>
                  <p className="text-xl font-semibold text-white">OnTrack</p>
                  <p className="text-sm font-normal text-slate-300">
                    Secure workforce access
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/20 bg-white p-7 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
              {badge && (
                <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#0A3C86]">
                  {badge}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h2>

                <p className="mt-2 text-sm font-normal leading-6 text-slate-500">
                  {subtitle}
                </p>
              </div>

              {children}
            </div>

            <p className="mt-4 text-center text-xs font-normal text-slate-400">
              © 2026 OnTrack. Secure workforce management.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}