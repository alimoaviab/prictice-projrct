"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Schools", href: "/schools", icon: "school" },
      { label: "Subscriptions", href: "/subscriptions", icon: "workspace_premium" },
      { label: "Revenue", href: "/revenue", icon: "payments" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { label: "Audit Logs", href: "/audit-logs", icon: "history" },
      { label: "System Health", href: "/system-health", icon: "monitor_heart" },
      { label: "Notifications", href: "/notifications", icon: "notifications" },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Settings", href: "/settings", icon: "settings" },
    ],
  },
];

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-md whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}

export function PlatformShell({
  children,
  title,
  eyebrow,
  actions,
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [adminEmail, setAdminEmail] = useState("admin@eduplexo.com");

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");

    const savedGroups = localStorage.getItem("sidebar-expanded-groups");
    if (savedGroups) {
      setExpandedGroups(JSON.parse(savedGroups));
    } else {
      const initial: Record<string, boolean> = {};
      navGroups.forEach((g) => (initial[g.label] = true));
      setExpandedGroups(initial);
    }

    // Check auth
    const token = localStorage.getItem("super_admin_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (Object.keys(expandedGroups).length > 0) {
      localStorage.setItem("sidebar-expanded-groups", JSON.stringify(expandedGroups));
    }
  }, [expandedGroups]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("super_admin_token");
    router.replace("/login");
  };

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <div className="flex h-screen bg-background text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} sticky top-0 z-20 flex h-screen flex-shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[0_1px_5px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div
          className={`flex h-11 items-center gap-2 px-3 ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm">
              <span className="material-symbols-outlined text-[12px] font-bold text-white">
                shield_person
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-[13px] font-bold tracking-tight text-slate-900">
                  Eduplexo
                </span>
                <span className="text-[8px] font-bold tracking-widest text-blue-600 uppercase">
                  Super Admin
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-blue-600"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-[15px]">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-2 py-2.5 custom-scrollbar overflow-y-auto">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.label] !== false;
            return (
              <div key={group.label} className="space-y-0.5">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="group flex w-full items-center justify-between px-2 py-1 text-[8px] font-bold normal-case tracking-[0.15em] text-slate-400 transition-colors hover:text-blue-600"
                  >
                    <span>{group.label}</span>
                    <span
                      className={`material-symbols-outlined text-[10px] transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                )}
                <div
                  className={`overflow-hidden space-y-0.5 transition-all duration-300 ${
                    !isCollapsed && !isExpanded
                      ? "max-h-0 opacity-0"
                      : "max-h-[800px] opacity-100"
                  }`}
                >
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + "/");
                    return isCollapsed ? (
                      <Tooltip key={item.href} text={item.label}>
                        <Link
                          href={item.href}
                          className={`flex h-7 w-7 items-center justify-center rounded transition-all duration-200 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-sm"
                              : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[15px] ${
                              isActive ? "font-bold" : ""
                            }`}
                          >
                            {item.icon}
                          </span>
                        </Link>
                      </Tooltip>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`premium-nav-item group flex h-7.5 items-center gap-2 px-2.5 py-1 text-[12px] font-bold ${
                          isActive
                            ? "premium-nav-item-active"
                            : "text-black hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[15px] transition-colors ${
                            isActive
                              ? "font-bold text-white"
                              : "text-black/70 group-hover:text-blue-600"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate tracking-tight">{item.label}</span>
                        {isActive && !isCollapsed && (
                          <span className="ml-auto h-1 w-1 rounded-full bg-white/80" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          className={`mt-auto border-t border-slate-50 p-1.5 ${
            isCollapsed ? "flex justify-center" : ""
          }`}
        >
          <div
            className={`flex w-full items-center gap-2 rounded border border-slate-50 bg-slate-50/30 px-2 py-1 transition-colors group ${
              isCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm">
              <span className="material-symbols-outlined text-[12px] text-white">
                admin_panel_settings
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="truncate text-[10px] font-bold text-slate-900">
                    {adminEmail.split("@")[0]}
                  </span>
                  <span className="text-[8px] font-bold normal-case text-blue-600 uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded p-0.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Logout"
                >
                  <span className="material-symbols-outlined text-[14px]">logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col bg-background h-screen overflow-hidden">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-slate-200/40 bg-white/70 px-4 backdrop-blur-md md:px-5">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col leading-tight">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                {eyebrow}
              </span>
              <h1 className="text-[16px] font-bold text-slate-900 tracking-tight">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Live
              </span>
            </div>

            <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 active:scale-95 shadow-sm">
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
            </button>
          </div>
        </header>

        <div
          key={pathname}
          className="w-full flex-1 overflow-y-auto animate-fade-in-up px-4 py-4 custom-scrollbar"
        >
          {actions && (
            <div className="mb-4 flex items-center justify-end gap-2">{actions}</div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
