import Link from "next/link";
import { LayoutDashboard, Calendar, FileText, CheckSquare, BarChart3, Settings } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/schedule", label: "Schedule", icon: Calendar },
  { href: "/dashboard/leave", label: "Leave", icon: FileText },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 border-r bg-muted/30 p-4 hidden md:block">
        <h1 className="font-bold text-lg px-2 mb-6">OnTrack</h1>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}