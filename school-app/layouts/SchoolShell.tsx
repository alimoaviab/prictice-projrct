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
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg whitespace-nowrap z-50 shadow-xl">
          {text}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
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
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

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

  const sidebarWidth = isCollapsed ? "w-20" : "w-72";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside
        className={`${sidebarWidth} bg-[#0F172A] text-white flex flex-col sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out flex-shrink-0`}
      >
        {/* Logo */}
        <div className={`p-5 flex items-center gap-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
              <span className="material-symbols-outlined text-white text-lg">school</span>
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold tracking-tight">Eduplexo</span>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-white/70 text-lg">
                {isCollapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {group.label}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return isCollapsed ? (
                    <Tooltip key={item.href} text={item.label}>
                      <Link
                        href={item.href}
                        className={`flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                      >
                        <span className={`material-symbols-outlined text-xl ${isActive ? "font-bold" : ""}`}>
                          {item.icon}
                        </span>
                      </Link>
                    </Tooltip>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative ${isActive
                        ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                      )}
                      <span className={`material-symbols-outlined text-xl ${isActive ? "font-bold" : ""}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t border-white/10 mt-auto ${isCollapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={logout}
            className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/5 transition-colors group ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold">{user.email.substring(0, 2).toUpperCase()}</span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="text-sm font-semibold text-white truncate">{user.email.split('@')[0]}</span>
                  <span className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <span className="material-symbols-outlined text-gray-400 text-lg group-hover:text-red-400 transition-colors">
                  logout
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
          <Breadcrumb />
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 font-medium text-sm"
              title="Logout"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <label className="text-sm font-medium text-gray-600">Year</label>
            <select
              value={selectedAcademyCareId}
              onChange={(event) => {
                const nextId = event.target.value;
                setSelectedAcademyCareIdState(nextId);
                setSelectedAcademyCareId(nextId);
                window.location.reload();
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              {academyYears.map((row) => (
                <option key={row._id} value={row._id}>
                  {row.year}{row.is_active ? " (Active)" : ""}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div key={pathname} className="p-6 max-w-7xl mx-auto w-full animate-fade-in-up">
          <PageHeader title={title} eyebrow={eyebrow} actions={actions} />
          {children}
        </div>
      </main>
    </div>
  );
}
