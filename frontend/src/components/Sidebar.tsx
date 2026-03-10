"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Upload, Search, BarChart3, ShieldAlert,
  Camera, LogOut, Cpu, ChevronRight
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/search", label: "Search", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/alerts", label: "Alerts", icon: ShieldAlert },
  { href: "/cameras", label: "Cameras", icon: Camera },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-dark-800 border-r border-[rgba(42,82,130,0.3)] relative">
      {/* Logo */}
      <div className="p-5 border-b border-[rgba(42,82,130,0.2)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-white leading-tight">ANPR Platform</div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">AI Detection System</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? "bg-brand-600/20 text-brand-400 border border-brand-600/30"
                  : "text-[#6b8aad] hover:text-white hover:bg-[rgba(43,163,245,0.06)]"
              }`}
            >
              <Icon size={17} className={active ? "text-brand-400" : "group-hover:text-brand-400 transition-colors"} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-[rgba(42,82,130,0.2)]">
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-700 to-brand-500 flex items-center justify-center text-xs font-bold text-white uppercase">
              {user?.username?.[0] || "A"}
            </div>
            <div>
              <div className="text-xs font-semibold text-white">{user?.username || "Admin"}</div>
              <div className="text-[10px] text-[var(--text-muted)] capitalize">{user?.role || "admin"}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs text-[#6b8aad] hover:text-accent-red transition-colors py-1"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
