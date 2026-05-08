"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, Breadcrumb } from "../components/ui";
import { AIAssistant } from "../components/ai/AIAssistant";
import { getSelectedAcademyCareId, setSelectedAcademyCareId } from "../services/academy-care-context";
import { useAuth, Role } from "../hooks/useAuth";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const adminNavGroups: NavGroup[] = [
  {
    label: "Reports",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" }],
  },
  {
    label: "Academic",
    items: [
      { label: "Academic Years", href: "/admin/academic-years", icon: "calendar_month" },
      { label: "Classes", href: "/admin/classes", icon: "groups" },
      { label: "Subjects", href: "/admin/subjects", icon: "menu_book" },
      { label: "Timetable", href: "/admin/timetable", icon: "schedule" },
      { label: "Attendance", href: "/admin/attendance", icon: "fact_check" },
      { label: "Exams", href: "/admin/exams", icon: "quiz" },
      { label: "Results", href: "/admin/results", icon: "leaderboard" },
      { label: "Live Class", href: "/admin/live-class", icon: "videocam" },
      { label: "Live Exam", href: "/admin/live-exam", icon: "live_tv" },
    ],
  },
  {
    label: "Students",
    items: [
      { label: "Students", href: "/admin/students", icon: "school" },
      { label: "Behavior", href: "/admin/behavior", icon: "gavel" },
    ],
  },
  {
    label: "Staff",
    items: [
      { label: "Teachers", href: "/admin/teachers", icon: "badge" },
      { label: "Leave", href: "/admin/leave", icon: "event_available" },
      { label: "Salary", href: "/admin/salary", icon: "account_balance" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: "campaign" },
      { label: "Events", href: "/admin/events", icon: "event" },
      { label: "AI Copilot", href: "/admin/ai", icon: "smart_toy" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Fee", href: "/admin/fee", icon: "payments" },
      { label: "Expense", href: "/admin/expense", icon: "account_balance_wallet" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Settings", href: "/admin/settings", icon: "settings" }],
  },
];

const teacherNavGroups: NavGroup[] = [
  {
    label: "Reports",
    items: [
      { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
      { label: "My Classes", href: "/teacher/classes", icon: "groups" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Timetable", href: "/teacher/timetable", icon: "schedule" },
      { label: "Exams", href: "/teacher/exams", icon: "quiz" },
      { label: "Results", href: "/teacher/results", icon: "leaderboard" },
      { label: "Attendance", href: "/teacher/attendance", icon: "fact_check" },
      { label: "Live Class", href: "/teacher/live-class", icon: "videocam" },
      { label: "Live Exam", href: "/teacher/live-exam", icon: "live_tv" },
    ],
  },
  {
    label: "Students",
    items: [
      { label: "Behavior", href: "/teacher/behavior", icon: "gavel" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Announcements", href: "/teacher/announcements", icon: "campaign" },
      { label: "Events", href: "/teacher/events", icon: "event" },
    ],
  },
];

const parentNavGroups: NavGroup[] = [
  {
    label: "Dashboard",
    items: [{ label: "My Dashboard", href: "/parent/dashboard", icon: "dashboard" }],
  },
  {
    label: "Academic",
    items: [
      { label: "Timetable", href: "/parent/timetable", icon: "schedule" },
      { label: "Exams", href: "/parent/exams", icon: "quiz" },
      { label: "Results", href: "/parent/results", icon: "leaderboard" },
      { label: "Attendance", href: "/parent/attendance", icon: "fact_check" },
    ],
  },
  {
    label: "School",
    items: [
      { label: "Announcements", href: "/parent/announcements", icon: "campaign" },
      { label: "Events", href: "/parent/events", icon: "event" },
    ],
  },
];

const studentNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
      { label: "Profile", href: "/student/profile", icon: "person" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Timetable", href: "/student/timetable", icon: "schedule" },
      { label: "Exams", href: "/student/exams", icon: "quiz" },
      { label: "Results", href: "/student/results", icon: "leaderboard" },
      { label: "Attendance", href: "/student/attendance", icon: "fact_check" },
      { label: "Live Class", href: "/student/live-class", icon: "videocam" },
      { label: "Live Exam", href: "/student/live-exam", icon: "live_tv" },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Fees", href: "/student/fees", icon: "payments" }],
  },
  {
    label: "School",
    items: [
      { label: "Announcements", href: "/student/announcements", icon: "campaign" },
      { label: "Events", href: "/student/events", icon: "event" },
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

export function SchoolShell({
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
  const { user, loading: authLoading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [academyYears, setAcademyYears] = useState<Array<{ _id: string; year: string; is_active: boolean }>>([]);
  const [selectedAcademyCareId, setSelectedAcademyCareIdState] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const navGroups = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin" || user.role === "super_admin") return adminNavGroups;
    if (user.role === "teacher") return teacherNavGroups;
    if (user.role === "parent") return parentNavGroups;
    if (user.role === "student") return studentNavGroups;
    return [];
  }, [user]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");

    const savedGroups = localStorage.getItem("sidebar-expanded-groups");
    if (savedGroups) {
      setExpandedGroups(JSON.parse(savedGroups));
    } else {
      // Default all groups to expanded
      const initial: Record<string, boolean> = {};
      navGroups.forEach(g => initial[g.label] = true);
      setExpandedGroups(initial);
    }
  }, [navGroups]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (Object.keys(expandedGroups).length > 0) {
      localStorage.setItem("sidebar-expanded-groups", JSON.stringify(expandedGroups));
    }
  }, [expandedGroups]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }

    if (user) {
      const path = pathname;
      if (path.startsWith("/admin") && user.role !== "admin" && user.role !== "super_admin") {
        router.replace(`/${user.role}/dashboard`);
      } else if (path.startsWith("/teacher") && user.role !== "teacher") {
        router.replace(`/${user.role}/dashboard`);
      } else if (path.startsWith("/parent") && user.role !== "parent") {
        router.replace(`/${user.role}/dashboard`);
      }
    }
  }, [authLoading, user, router, pathname]);

  useEffect(() => {
    if (authLoading || !user) return;

    let ignore = false;
    void (async () => {
      try {
        const response = await fetch("/api/academic-years", { credentials: "include" });
        const payload = await response.json();
        if (ignore || !payload?.ok || !Array.isArray(payload?.data)) {
          return;
        }

        const rows = payload.data as Array<{ _id: string; year: string; is_active: boolean }>;
        setAcademyYears(rows);

        const stored = getSelectedAcademyCareId();
        const defaultId = stored || rows.find((row) => row.is_active)?._id || rows[0]?._id || "";
        if (!defaultId) return;

        setSelectedAcademyCareIdState(defaultId);
        setSelectedAcademyCareId(defaultId);
      } catch {
        // Ignore failure
      }
    })();

    return () => {
      ignore = true;
    };
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  const sidebarWidth = isCollapsed ? "w-16" : "w-60";

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <div className="flex min-h-screen bg-background text-slate-900">
      {showAIAssistant && (
        <div className="fixed inset-0 z-40 pointer-events-none">
           <div className="pointer-events-auto">
             <AIAssistant onClose={() => setShowAIAssistant(false)} />
           </div>
        </div>
      )}
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} sticky top-0 z-20 flex h-screen flex-shrink-0 flex-col border-r border-slate-200/80 bg-white/95 shadow-[0_1px_8px_rgba(15,23,42,0.05)] backdrop-blur-sm transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className={`flex h-14 items-center gap-2 px-2.5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-[0_8px_16px_rgba(37,99,235,0.18)]">
              <span className="material-symbols-outlined text-base font-black text-white">school</span>
            </div>
            {!isCollapsed && (
              <span className="text-[14px] font-semibold tracking-tight text-slate-950">Eduplexo</span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 px-3 py-4 custom-scrollbar overflow-y-auto">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.label] !== false;
            return (
              <div key={group.label} className="space-y-1">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="group flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-blue-600"
                  >
                    <span>{group.label}</span>
                    <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </button>
                )}
                <div className={`overflow-hidden space-y-0.5 transition-all duration-300 ${!isCollapsed && !isExpanded ? "max-h-0 opacity-0" : "max-h-[800px] opacity-100"}`}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return isCollapsed ? (
                      <Tooltip key={item.href} text={item.label}>
                        <Link
                          href={item.href}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600"}`}
                        >
                          <span className={`material-symbols-outlined text-[18px] ${isActive ? "font-bold" : ""}`}>
                            {item.icon}
                          </span>
                        </Link>
                      </Tooltip>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`premium-nav-item group relative ${isActive ? "premium-nav-item-active" : ""}`}
                      >
                        <span className={`material-symbols-outlined text-[18px] transition-colors ${isActive ? "font-bold text-white" : "text-slate-400 group-hover:text-blue-600"}`}>
                          {item.icon}
                        </span>
                        <span className="truncate font-medium">{item.label}</span>
                        {isActive && !isCollapsed && <span className="ml-auto h-1 w-1 rounded-full bg-white/80" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`mt-auto border-t border-slate-100 p-2 ${isCollapsed ? "flex justify-center" : ""}`}>
          <div
            className={`flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1.5 transition-colors group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm">
              <span className="text-[10px] font-bold text-white">{user.email.substring(0, 2).toUpperCase()}</span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="truncate text-[11px] font-bold text-slate-900">{user.email.split('@')[0]}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{user.role.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={logout}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#F8FAFF]">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="rounded-lg p-1.5 transition-colors hover:bg-blue-50 lg:hidden"
            >
              <span className="material-symbols-outlined text-slate-600">menu</span>
            </button>
            <div className="relative max-w-xs w-full hidden md:block">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-8 pr-3 text-[13px] text-slate-700 placeholder:text-slate-400 transition-all focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-600/5"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1">
              <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
              <select
                value={selectedAcademyCareId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedAcademyCareIdState(nextId);
                  setSelectedAcademyCareId(nextId);
                  window.location.reload();
                }}
                className="cursor-pointer bg-transparent text-[11px] font-bold text-slate-600 focus:outline-none"
              >
                {academyYears.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.year}{row.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mx-1 hidden h-4 w-px bg-slate-200/60 sm:block" />

            <button className="group relative rounded-lg p-1.5 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border-2 border-white bg-red-500" />
            </button>

            <button className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-blue-50 hover:text-blue-600">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>

            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="rounded-lg p-1.5 text-blue-600 bg-blue-50 transition-all hover:bg-blue-100 shadow-sm flex items-center justify-center gap-1 group"
              aria-label="AI Assistant"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">smart_toy</span>
            </button>

            <div className="flex h-7 w-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white transition-all hover:border-blue-400">
              <span className="text-[10px] font-black text-slate-600">{user.email.substring(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div key={pathname} className="mx-auto w-full max-w-[1400px] animate-fade-in-up px-4 py-6 md:px-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">{eyebrow}</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
