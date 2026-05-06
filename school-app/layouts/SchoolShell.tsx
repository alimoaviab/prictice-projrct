"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { PageHeader, Breadcrumb } from "../components/ui";
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
      { label: "Homework", href: "/admin/homework", icon: "assignment" },
      { label: "Exams", href: "/admin/exams", icon: "quiz" },
      { label: "Results", href: "/admin/results", icon: "leaderboard" },
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
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: "campaign" },
      { label: "Events", href: "/admin/events", icon: "event" },
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
    ],
  },
  {
    label: "Students",
    items: [
      { label: "Behavior", href: "/teacher/behavior", icon: "gavel" },
      { label: "Homework", href: "/teacher/homework", icon: "assignment" },
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
      { label: "Homework", href: "/student/homework", icon: "assignment" },
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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="flex min-h-screen bg-[#F5F8FF]">
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} bg-white/95 border-r border-blue-100 flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out flex-shrink-0 z-20 shadow-[0_1px_8px_rgba(15,23,42,0.06)]`}
      >
        {/* Logo */}
        <div className={`px-3 h-14 flex items-center gap-2 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-600/25">
              <span className="material-symbols-outlined text-white text-base font-black">school</span>
            </div>
            {!isCollapsed && (
              <span className="text-base font-black tracking-tight text-gray-900">Eduplexo</span>
            )}
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-base">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2.5 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.label] !== false;
            return (
              <div key={group.label} className="space-y-0.5">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-[0.14em] hover:text-blue-700 transition-colors group"
                  >
                    <span>{group.label}</span>
                    <span className={`material-symbols-outlined text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                )}
                <div className={`space-y-0.5 transition-all duration-300 overflow-hidden ${!isCollapsed && !isExpanded ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                    return isCollapsed ? (
                      <Tooltip key={item.href} text={item.label}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-center w-9 h-9 mx-auto rounded-lg transition-all duration-200 ${isActive
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                        >
                          <span className={`material-symbols-outlined text-[19px] ${isActive ? "font-black" : ""}`}>
                            {item.icon}
                          </span>
                        </Link>
                      </Tooltip>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-200 group relative ${isActive
                          ? "bg-blue-600 text-white font-semibold shadow-sm"
                          : "text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-700"
                          }`}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${isActive ? "font-black" : "text-slate-400 group-hover:text-blue-600 transition-colors"}`}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={`p-2.5 border-t border-blue-100 mt-auto ${isCollapsed ? "flex justify-center" : ""}`}>
          <div
            className={`flex items-center gap-2.5 w-full p-2 rounded-lg bg-blue-50/40 border border-blue-100/60 transition-colors group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-[10px] font-black text-white">{user.email.substring(0, 2).toUpperCase()}</span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="text-xs font-semibold text-gray-900 truncate">{user.email.split('@')[0]}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.12em]">{user.role.replace('_', ' ')}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b border-blue-100 bg-white/95 backdrop-blur flex items-center justify-between px-4 md:px-5 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-md hover:bg-blue-50 transition-colors lg:hidden"
            >
              <span className="material-symbols-outlined text-slate-700">menu</span>
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input 
                type="text" 
                placeholder="Global search (Students, Classes, Teachers...)" 
                className="w-full bg-white border border-blue-100 rounded-lg py-1.5 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-300 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-white rounded-lg border border-blue-100">
                <span className="material-symbols-outlined text-slate-500 text-base">calendar_today</span>
                <select
                  value={selectedAcademyCareId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setSelectedAcademyCareIdState(nextId);
                    setSelectedAcademyCareId(nextId);
                    window.location.reload();
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  {academyYears.map((row) => (
                    <option key={row._id} value={row._id}>
                      {row.year}{row.is_active ? " (Active)" : ""}
                    </option>
                  ))}
                </select>
            </div>

            <div className="w-px h-5 bg-blue-100 mx-1 hidden sm:block" />

            <button className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all relative group">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </button>
            
            <button className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all">
              <span className="material-symbols-outlined">help</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-300 transition-colors">
               <span className="text-[10px] font-bold text-slate-700">{user.email.substring(0, 2).toUpperCase()}</span>
            </div>
          </div>
        </header>

        <div key={pathname} className="p-4 md:p-5 max-w-[1200px] mx-auto w-full animate-fade-in-up">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-[0.12em] mb-0.5">{eyebrow}</p>
              <h1 className="text-[26px] leading-tight font-bold text-black">{title}</h1>
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
