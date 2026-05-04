"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader, Breadcrumb } from "../components/ui";
import { getSelectedAcademyCareId, setSelectedAcademyCareId } from "../services/academy-care-context";

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
      { label: "Attendance", href: "/admin/attendance", icon: "fact_check" },
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
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [academyYears, setAcademyYears] = useState<Array<{ _id: string; year: string; is_active: boolean }>>([]);
  const [selectedAcademyCareId, setSelectedAcademyCareIdState] = useState<string>("");
  const isDevelopment = process.env.NODE_ENV !== "production";

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved) setIsCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (isDevelopment) {
      setIsSessionChecked(true);
      return;
    }
    const token = window.localStorage.getItem("token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    setIsSessionChecked(true);
  }, [isDevelopment, router]);

  useEffect(() => {
    if (!isSessionChecked) {
      return;
    }

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
        if (!defaultId) {
          return;
        }

        setSelectedAcademyCareIdState(defaultId);
        setSelectedAcademyCareId(defaultId);
      } catch {
        // Ignore selector loading failure and keep shell interactive.
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isSessionChecked]);

  if (!isSessionChecked) {
    return null;
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
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="material-symbols-outlined text-white/70 text-lg">
                {isCollapsed ? "chevron_right" : "chevron_left"}
              </span>
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-4 mb-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            title="Expand sidebar"
          >
            <span className="material-symbols-outlined text-white/60 text-lg">chevron_right</span>
          </button>
        )}

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
          {isCollapsed ? (
            <Tooltip text="John Doe — Administrator">
              <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                <span className="text-sm font-bold">JD</span>
              </div>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
                <span className="text-sm font-bold">JD</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-white truncate">John Doe</span>
                <span className="text-xs text-gray-400">Administrator</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
          <Breadcrumb />
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
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

        {/* Page Content */}
        <div key={pathname} className="p-6 max-w-7xl mx-auto w-full animate-fade-in-up">
          <PageHeader title={title} eyebrow={eyebrow} actions={actions} />
          {children}
        </div>
      </main>
    </div>
  );
}
