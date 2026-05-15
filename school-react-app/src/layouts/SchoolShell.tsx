/**
 * Ported from old-app/school-app/layouts/SchoolShell.tsx.
 *
 * UI is preserved verbatim. Replacements:
 *   - next/link  → react-router-dom Link
 *   - usePathname / useRouter → useLocation / useNavigate
 *   - "use client" directive removed (no SSR in Vite)
 *   - AIAssistant placeholder rendered as a no-op until AI subsystem is ported
 *
 * Business logic preserved:
 *   - Role-driven nav groups (admin/teacher/parent/student)
 *   - Academic-year selector that calls POST /api/academic-years/switch and
 *     re-issues the JWT
 *   - Cross-tenant guard relies on useAuth (already ported)
 *   - SelectedChildProvider wraps the parent role
 *   - Sidebar collapse + group expansion persisted to localStorage
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/ui";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AIAssistant } from "@/components/ai/AIAssistant";
import {
  getSelectedAcademicYearId,
  setSelectedAcademicYearId,
} from "@/services/academic-year-context";
import { useAuth, type Role } from "@/hooks/useAuth";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";
import { SelectedChildProvider } from "@/contexts/SelectedChildContext";

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
      { label: "Academic years", href: "/admin/academic-years", icon: "calendar_month" },
      { label: "Classes", href: "/admin/classes", icon: "groups" },
      { label: "Timetable", href: "/admin/timetable", icon: "schedule" },
      { label: "Attendance", href: "/admin/attendance", icon: "fact_check" },
      { label: "Exams", href: "/admin/exams", icon: "quiz" },
      { label: "Tests", href: "/admin/tests", icon: "assignment_turned_in" },
      { label: "Results", href: "/admin/results", icon: "leaderboard" },
      { label: "Live classes", href: "/admin/live-class", icon: "videocam" },
      { label: "Homework", href: "/admin/homework", icon: "assignment" },
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
    items: [{ label: "Events", href: "/admin/events", icon: "event" }],
  },
  {
    label: "Finance",
    items: [{ label: "Fee", href: "/admin/fee", icon: "payments" }],
  },
  {
    label: "Subscription",
    items: [{ label: "Subscription", href: "/admin/subscription", icon: "card_membership" }],
  },
  {
    label: "Domain",
    items: [{ label: "Connect Domain", href: "/admin/connect-domain", icon: "language" }],
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
      { label: "Tests", href: "/teacher/tests", icon: "assignment_turned_in" },
      { label: "Results", href: "/teacher/results", icon: "leaderboard" },
      { label: "Attendance", href: "/teacher/attendance", icon: "fact_check" },
      { label: "Live classes", href: "/teacher/live-class", icon: "videocam" },
      { label: "Homework", href: "/teacher/homework", icon: "assignment" },
      { label: "Leave", href: "/teacher/leave", icon: "event_available" },
    ],
  },
  {
    label: "Students",
    items: [{ label: "Behavior", href: "/teacher/behavior", icon: "gavel" }],
  },
  {
    label: "Communication",
    items: [{ label: "Events", href: "/teacher/events", icon: "event" }],
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
      { label: "Homework", href: "/parent/homework", icon: "assignment" },
      { label: "Fee Ledger", href: "/parent/fees", icon: "receipt_long" },
    ],
  },
  {
    label: "School",
    items: [{ label: "Events", href: "/parent/events", icon: "event" }],
  },
];

const studentNavGroups: NavGroup[] = [
  {
    label: "Parent Portal",
    items: [
      { label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
      { label: "My Profile", href: "/student/profile", icon: "person" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Timetable", href: "/student/timetable", icon: "schedule" },
      { label: "Exams", href: "/student/exams", icon: "quiz" },
      { label: "Results", href: "/student/results", icon: "leaderboard" },
      { label: "Attendance", href: "/student/attendance", icon: "fact_check" },
      { label: "Live classes", href: "/student/live-class", icon: "videocam" },
      { label: "Homework", href: "/student/homework", icon: "assignment" },
      { label: "Leave", href: "/student/leave", icon: "event_available" },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Fees", href: "/student/fees", icon: "payments" }],
  },
  {
    label: "School",
    items: [{ label: "Events", href: "/student/events", icon: "event" }],
  },
];

function navGroupsForRole(role: Role | undefined): NavGroup[] {
  if (!role) return [];
  if (role === "admin" || role === "super_admin") return adminNavGroups;
  if (role === "teacher") return teacherNavGroups;
  if (role === "parent") return parentNavGroups;
  if (role === "student") return studentNavGroups;
  return [];
}

function AdminActions() {
  const actions = [
    { label: "Student", icon: "person_add", href: "/admin/students?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Attendance", icon: "how_to_reg", href: "/admin/attendance", color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Exam", icon: "add_task", href: "/admin/exams?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
    { label: "Broadcast", icon: "campaign", href: "/admin/announcements?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50" },
  ];

  return (
    <div className="hidden lg:flex items-center gap-2">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border bg-white transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color} shadow-sm`}
        >
          <span className="material-symbols-outlined text-[15px]">{action.icon}</span>
          <span className="text-[10px] font-bold normal-case tracking-tight">{action.label}</span>
        </Link>
      ))}
      <div className="flex gap-1 ml-1">
        <Link to="/admin/results" className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all" title="Results">
          <span className="material-symbols-outlined text-[18px]">leaderboard</span>
        </Link>
        <Link to="/admin/timetable" className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all" title="Timetable">
          <span className="material-symbols-outlined text-[18px]">calendar_view_week</span>
        </Link>
      </div>
    </div>
  );
}

function Tooltip({ children, text }: { children: ReactNode; text: string }) {
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

interface SchoolShellProps {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
}

interface AcademicYearRow {
  _id: string;
  id?: string;
  year: string;
  is_active: boolean;
}

export function SchoolShell({ children, title, eyebrow, description, actions }: SchoolShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const { user, loading: authLoading, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Default collapsed on mobile, expanded on desktop
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null) return saved === "true";
      return window.innerWidth < 768;
    }
    return false;
  });
  const [academyYears, setAcademyYears] = useState<AcademicYearRow[]>([]);
  const [selectedAcademyYearId, setSelectedAcademicYearIdState] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const navGroups = useMemo(() => navGroupsForRole(user?.role), [user]);

  useEffect(() => {
    const savedGroups = localStorage.getItem("sidebar-expanded-groups");
    if (savedGroups) {
      try {
        setExpandedGroups(JSON.parse(savedGroups));
      } catch {
        // ignore corrupted entry
      }
    } else {
      const initial: Record<string, boolean> = {};
      navGroups.forEach((g) => (initial[g.label] = true));
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
      navigate("/auth/login", { replace: true });
      return;
    }

    if (user) {
      const path = pathname;
      if (path.startsWith("/admin") && user.role !== "admin" && user.role !== "super_admin") {
        navigate(`/${user.role}/dashboard`, { replace: true });
      } else if (path.startsWith("/teacher") && user.role !== "teacher") {
        navigate(`/${user.role}/dashboard`, { replace: true });
      } else if (path.startsWith("/parent") && user.role !== "parent") {
        navigate(`/${user.role}/dashboard`, { replace: true });
      } else if (path.startsWith("/student") && user.role !== "student") {
        navigate(`/${user.role}/dashboard`, { replace: true });
      }
    }
  }, [authLoading, user, navigate, pathname]);

  useEffect(() => {
    if (authLoading || !user) return;

    let ignore = false;
    void (async () => {
      try {
        const response = await fetch("/api/academic-years", {
          credentials: "include",
          headers: {
            authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
          },
        });
        const payload = await response.json();
        if (ignore || !payload?.ok) return;

        const data = payload?.data;
        const rows: AcademicYearRow[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];
        if (!rows.length) return;

        setAcademyYears(rows);

        const stored = getSelectedAcademicYearId();
        const hasStored = !!stored && rows.some((row) => (row._id || row.id) === stored);
        const defaultId =
          (hasStored ? stored : undefined) ||
          rows.find((row) => row.is_active)?._id ||
          rows[0]?._id ||
          rows.find((row) => row.id)?._id ||
          "";
        if (!defaultId) return;

        if (!hasStored && stored) {
          localStorage.removeItem("academic_year_id");
        }

        setSelectedAcademicYearIdState(defaultId);
        setSelectedAcademicYearId(defaultId);
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

  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const content = (
    <div className="flex h-screen bg-background text-slate-900 font-sans overflow-hidden">
      {showAIAssistant ? (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <AIAssistant onClose={() => setShowAIAssistant(false)} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAIAssistant(true)}
          className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-2xl hover:scale-105 transition-transform animate-glow"
          aria-label="Open AI Assistant"
        >
          <span className="material-symbols-outlined text-[28px]">smart_toy</span>
        </button>
      )}
      {/* Sidebar */}
      {/* Mobile overlay backdrop */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm md:hidden"
          onClick={() => setIsCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${sidebarWidth} fixed md:sticky top-0 z-40 md:z-20 flex h-screen flex-shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[0_1px_5px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out ${
          isCollapsed ? "-translate-x-full md:translate-x-0 md:w-16" : "translate-x-0"
        }`}
      >
        <div className={`flex h-11 items-center gap-2 px-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-5.5 w-5.5 flex-shrink-0 items-center justify-center rounded bg-blue-600 shadow-sm">
              <span className="material-symbols-outlined text-[12px] font-bold text-white">school</span>
            </div>
            {!isCollapsed && (
              <span className="text-[13px] font-bold tracking-tight text-slate-900">Eduplexo</span>
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

        <nav className="flex-1 space-y-1.5 px-2 py-2.5 custom-scrollbar overflow-y-auto">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.label] !== false;
            return (
              <div key={group.label} className="space-y-0.5">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="group flex w-full items-center justify-between px-2 py-1 text-[8px] font-bold normal-case tracking-[0.15em] text-blue-600/40 transition-colors hover:text-blue-600"
                  >
                    <span>{group.label}</span>
                    <span className={`material-symbols-outlined text-[10px] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
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
                          to={item.href}
                          className={`flex h-7 w-7 items-center justify-center rounded transition-all duration-200 ${isActive ? "bg-blue-600 text-white shadow-sm" : "text-blue-600/50 hover:bg-blue-50 hover:text-blue-600"}`}
                        >
                          <span className={`material-symbols-outlined text-[15px] ${isActive ? "font-bold" : ""}`}>
                            {item.icon}
                          </span>
                        </Link>
                      </Tooltip>
                    ) : (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`premium-nav-item group flex h-6.5 items-center gap-2 px-2.5 py-1 text-[11px] font-bold ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-600 hover:bg-blue-50/50 hover:text-blue-600"}`}
                      >
                        <span className={`material-symbols-outlined text-[14px] transition-colors ${isActive ? "font-bold text-white" : "text-slate-400 group-hover:text-blue-600"}`}>
                          {item.icon}
                        </span>
                        <span className="truncate tracking-tight">{item.label}</span>
                        {isActive && !isCollapsed && <span className="ml-auto h-1 w-1 rounded-full bg-white/60" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className={`mt-auto border-t border-slate-50 p-1.5 ${isCollapsed ? "flex justify-center" : ""}`}>
          <div className={`flex w-full items-center gap-2 rounded border border-slate-50 bg-slate-50/30 px-2 py-1 transition-colors group ${isCollapsed ? "justify-center" : ""}`}>
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-blue-600 shadow-sm">
              <span className="text-[9px] font-bold text-white">
                {(user.email || "--").substring(0, 2).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="truncate text-[10px] font-bold text-slate-900">
                    {(user.email || "user").split("@")[0]}
                  </span>
                  <span className="text-[8px] font-bold normal-case  text-slate-400">
                    {user.role === "student" ? "Parent/Student" : user.role.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="rounded p-0.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <span className="material-symbols-outlined text-[14px]">logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col bg-background h-screen overflow-hidden relative z-0">
        <header className="sticky top-0 z-50 flex h-10 items-center justify-between border-b border-slate-200/40 bg-white/70 px-4 backdrop-blur-md overflow-visible">
          <div className="flex items-center gap-3 flex-1 overflow-visible">
            <button
              onClick={() => setIsCollapsed(false)}
              className="rounded p-1 transition-colors hover:bg-blue-50 md:hidden"
            >
              <span className="material-symbols-outlined text-slate-600 text-[18px]">menu</span>
            </button>
            <div className="relative max-w-[420px] w-full hidden xl:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">search</span>
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-1.5 pl-9 pr-3 text-[11px] font-bold text-slate-600 placeholder:text-slate-400/60 transition-all focus:border-blue-200 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-[100] overflow-visible">
            {user.role === "parent" && <ChildSwitcher />}

            <div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-100 bg-white px-2 py-1">
              <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
              <select
                value={selectedAcademyYearId}
                disabled={user.role === "student"}
                onChange={async (event) => {
                  const nextId = event.target.value;
                  setSelectedAcademicYearIdState(nextId);
                  setSelectedAcademicYearId(nextId);
                  // CRITICAL: Re-issue JWT with the new active_academic_year_id
                  // so the server (not the client) controls the active year.
                  try {
                    const response = await fetch("/api/academic-years/switch", {
                      method: "POST",
                      credentials: "include",
                      headers: {
                        "Content-Type": "application/json",
                        authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                      },
                      body: JSON.stringify({ academic_year_id: nextId }),
                    });
                    const result = await response.json();
                    if (result?.ok && result?.data?.token) {
                      localStorage.setItem("token", result.data.token);
                    }
                  } catch (err) {
                    console.warn("[AcademicYear] switch failed", err);
                  }
                  window.location.reload();
                }}
                className={`bg-transparent text-[10px] font-black tracking-widest text-slate-500 focus:outline-none ${user.role === "student" ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                {academyYears.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.year}{row.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mx-0.5 hidden h-3 w-px bg-slate-200/40 sm:block" />

            <div className="flex items-center gap-2">
              {user.role === "admin" && <AdminActions />}

              <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 active:scale-95 shadow-sm">
                <span className="material-symbols-outlined text-[19px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              </button>
            </div>
          </div>
        </header>

        <div key={pathname} className="w-full flex-1 overflow-y-auto animate-fade-in-up px-4 py-3 md:px-8 md:pt-4 custom-scrollbar relative z-10">
          <ErrorBoundary
            title="This page ran into a problem"
            message="A part of this page failed to render. Try the action again, or refresh the page."
          >
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );

  // Wrap with SelectedChildProvider for parent role
  if (user.role === "parent") {
    return <SelectedChildProvider>{content}</SelectedChildProvider>;
  }

  // Suppress unused-import warning for Breadcrumb until module pages opt in.
  void Breadcrumb;

  return content;
}
