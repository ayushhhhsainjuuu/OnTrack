import Image from "next/image";

export default function AuthShell({ title, subtitle, badge, children }) {
  return (
    <main className="min-h-screen bg-[#020817] text-slate-900">
      <div className="relative min-h-screen overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-blue-600/30 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-180px] h-[480px] w-[480px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#123b73_0%,transparent_35%),linear-gradient(135deg,#020817_0%,#07182f_45%,#020817_100%)]" />

        <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left branding section */}
          <section className="hidden flex-col justify-between px-14 py-10 text-white lg:flex">
            <div className="flex items-center gap-5">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl shadow-blue-950/30">
                <Image
                  src="/ontrack-logo.png"
                  alt="OnTrack logo"
                  width={150}
                  height={150}
                  className="h-28 w-28 object-cover"
                  priority
                />
              </div>

              <div>
                <h1 className="text-4xl font-bold tracking-tight">OnTrack</h1>

                <p className="mt-2 text-base text-blue-100">
                  Workforce management made smarter
                </p>
              </div>
            </div>

            <div className="max-w-2xl">
              <h2 className="text-5xl font-bold leading-[1.08] tracking-tight">
                Manage attendance, scheduling, and workforce activity in one
                place.
              </h2>

              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
                OnTrack helps employees clock in securely, managers track
                attendance, and teams stay organized with a simple role-based
                platform.
              </p>

              <div className="mt-10 grid max-w-2xl grid-cols-3 gap-5">
                <div className="rounded-3xl border border-white/15 bg-white/[0.09] p-5 shadow-xl backdrop-blur-xl">
                  <p className="text-sm font-medium text-blue-100">Access</p>
                  <p className="mt-2 text-xl font-bold">Role-based</p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/[0.09] p-5 shadow-xl backdrop-blur-xl">
                  <p className="text-sm font-medium text-blue-100">Clock In</p>
                  <p className="mt-2 text-xl font-bold">GPS verified</p>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/[0.09] p-5 shadow-xl backdrop-blur-xl">
                  <p className="text-sm font-medium text-blue-100">Reports</p>
                  <p className="mt-2 text-xl font-bold">Smart insights</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-400">
              Built for secure, modern workforce operations.
            </p>
          </section>

          {/* Right form section */}
          <section className="flex items-center justify-center px-5 py-8 sm:px-8">
            <div className="w-full max-w-[460px]">
              {/* Mobile logo */}
              <div className="mb-8 flex justify-center lg:hidden">
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl">
                    <Image
                      src="/ontrack-logo.png"
                      alt="OnTrack logo"
                      width={100}
                      height={100}
                      className="h-20 w-20 object-cover"
                      priority
                    />
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-white">OnTrack</p>

                    <p className="text-sm text-slate-300">
                      Secure workforce access
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/20 bg-white p-9 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
                {badge && (
                  <div className="mb-5 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#0A3C86]">
                    {badge}
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-4xl font-bold tracking-tight text-slate-950">
                    {title}
                  </h2>

                  <p className="mt-3 text-base leading-7 text-slate-500">
                    {subtitle}
                  </p>
                </div>

                {children}
              </div>

              <p className="mt-5 text-center text-xs text-slate-400">
                © 2026 OnTrack. Secure workforce management.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}