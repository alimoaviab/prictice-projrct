import { AppIcon } from "shared/ui/AppIcon";
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
import {
  getSelectedAcademicYearId,
  setSelectedAcademicYearId,
} from "@/services/academic-year-context";
import { useAuth, type Role } from "@/hooks/useAuth";
import { useSchoolBranding } from "@/hooks/useSchoolBranding";
import { ChildSwitcher } from "@/components/parent/ChildSwitcher";

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
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: "dashboard" },
    ],
  },
  {
    label: "Academic Setup",
    items: [
      { label: "Academic years", href: "/admin/academic-years", icon: "calendar_month" },
      { label: "Classes", href: "/admin/classes", icon: "groups" },
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
    label: "Students",
    items: [
      { label: "Students", href: "/admin/students", icon: "school" },
      { label: "Behavior", href: "/admin/behavior", icon: "gavel" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Timetable", href: "/admin/timetable", icon: "schedule" },
      { label: "Attendance", href: "/admin/attendance", icon: "fact_check" },
      { label: "Homework", href: "/admin/homework", icon: "assignment" },
      { label: "Exams", href: "/admin/exams", icon: "quiz" },
      { label: "Tests", href: "/admin/tests", icon: "assignment_turned_in" },
      { label: "Results", href: "/admin/results", icon: "leaderboard" },
      { label: "Question Papers", href: "/admin/question-papers", icon: "description" },
      { label: "Live classes", href: "/admin/live-class", icon: "videocam" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Announcements", href: "/admin/announcements", icon: "campaign" },
      { label: "Certificates", href: "/admin/certificates", icon: "workspace_premium" },
    ],
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
    label: "Settings",
    items: [
      { label: "Schedule", href: "/admin/schedule", icon: "calendar_month" },
      { label: "Conversations", href: "/admin/messages", icon: "chat" },
      { label: "Settings", href: "/admin/settings", icon: "settings" },
    ],
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
      { label: "Question Papers", href: "/teacher/question-papers", icon: "description" },
      { label: "Leave", href: "/teacher/leave", icon: "event_available" },
    ],
  },
  {
    label: "Students",
    items: [{ label: "Behavior", href: "/teacher/behavior", icon: "gavel" }],
  },
  {
    label: "Communication",
    items: [
      { label: "Schedule", href: "/teacher/schedule", icon: "calendar_month" },
      { label: "Conversations", href: "/teacher/messages", icon: "chat" },
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
      { label: "Homework", href: "/parent/homework", icon: "assignment" },
      { label: "Live Classes", href: "/parent/live-classes", icon: "videocam" },
      { label: "Fee Ledger", href: "/parent/fees", icon: "receipt_long" },
    ],
  },
  {
    label: "Requests",
    items: [{ label: "Leave", href: "/parent/leave", icon: "event_busy" }],
  },
  {
    label: "Communication",
    items: [{ label: "Conversations", href: "/parent/messages", icon: "chat" }],
  },
  {
    label: "School",
    items: [{ label: "Announcements", href: "/parent/announcements", icon: "campaign" }],
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
      { label: "Certificates", href: "/student/certificates", icon: "workspace_premium" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Conversations", href: "/student/messages", icon: "chat" },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Fees", href: "/student/fees", icon: "payments" }],
  },
  {
    label: "School",
    items: [{ label: "Announcements", href: "/student/announcements", icon: "campaign" }],
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

function AdminActions({ allowedModules }: { allowedModules: Record<string, boolean> | null }) {
  const actions = [
    { label: "Student", icon: "person_add", href: "/admin/students?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50", module: "students" },
    { label: "Attendance", icon: "how_to_reg", href: "/admin/attendance", color: "text-blue-600 border-blue-200 hover:bg-blue-50", module: "attendance" },
    { label: "Exam", icon: "add_task", href: "/admin/exams?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50", module: "exams" },
    { label: "Broadcast", icon: "campaign", href: "/admin/announcements?action=new", color: "text-blue-600 border-blue-200 hover:bg-blue-50", module: "announcements" },
  ];

  const filteredActions = actions.filter((action) => {
    if (!allowedModules) return true;
    return allowedModules[action.module] !== false;
  });

  return (
    <div className="hidden lg:flex items-center gap-2">
      {filteredActions.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border bg-white transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color} shadow-sm`}
        >
          <AppIcon name={action.icon} size={15} />
          <span className="text-[10px] font-bold normal-case tracking-tight">{action.label}</span>
        </Link>
      ))}
      <div className="flex gap-1 ml-1">
        {(!allowedModules || allowedModules["results"] !== false) && (
          <Link to="/admin/results" className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all" title="Results">
            <AppIcon name="Leaderboard" size={18} />
          </Link>
        )}
        {(!allowedModules || allowedModules["timetable"] !== false) && (
          <Link to="/admin/timetable" className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-all" title="Timetable">
            <AppIcon name="CalendarDays" size={18} />
          </Link>
        )}
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

const routeToModuleMap: Record<string, string> = {
  "/admin/dashboard": "dashboard",
  "/admin/academic-years": "academic-years",
  "/admin/classes": "classes",
  "/admin/teachers": "teachers",
  "/admin/leave": "leave",
  "/admin/students": "students",
  "/admin/behavior": "behavior",
  "/admin/timetable": "timetable",
  "/admin/attendance": "attendance",
  "/admin/homework": "homework",
  "/admin/exams": "exams",
  "/admin/tests": "tests",
  "/admin/results": "results",
  "/admin/question-papers": "question-papers",
  "/admin/live-class": "live-classes",
  "/admin/announcements": "announcements",
  "/admin/certificates": "certificates",
  "/admin/fee": "fee",
  "/admin/subscription": "subscription",
  "/admin/schedule": "schedule",
  "/admin/messages": "conversations",
  "/admin/settings": "settings",
  
  "/teacher/dashboard": "dashboard",
  "/teacher/classes": "classes",
  "/teacher/timetable": "timetable",
  "/teacher/exams": "exams",
  "/teacher/tests": "tests",
  "/teacher/results": "results",
  "/teacher/attendance": "attendance",
  "/teacher/live-class": "live-classes",
  "/teacher/homework": "homework",
  "/teacher/question-papers": "question-papers",
  "/teacher/leave": "leave",
  "/teacher/behavior": "behavior",
  "/teacher/schedule": "schedule",
  "/teacher/messages": "conversations",
  
  "/parent/dashboard": "dashboard",
  "/parent/timetable": "timetable",
  "/parent/exams": "exams",
  "/parent/results": "results",
  "/parent/attendance": "attendance",
  "/parent/homework": "homework",
  "/parent/live-classes": "live-classes",
  "/parent/fees": "fee",
  "/parent/leave": "leave",
  "/parent/messages": "conversations",
  "/parent/announcements": "announcements",
  
  "/student/dashboard": "dashboard",
  "/student/profile": "dashboard",
  "/student/timetable": "timetable",
  "/student/exams": "exams",
  "/student/results": "results",
  "/student/attendance": "attendance",
  "/student/live-class": "live-classes",
  "/student/homework": "homework",
  "/student/leave": "leave",
  "/student/certificates": "certificates",
  "/student/messages": "conversations",
  "/student/fees": "fee",
  "/student/announcements": "announcements",
};

const MODULE_NAMES: Record<string, string> = {
  "academic-years": "Academic Years Setup",
  "classes": "Classes Setup",
  "teachers": "Teachers Directory",
  "students": "Students Directory",
  "subjects": "Subjects Configuration",
  "homework": "Homework & Assignments",
  "exams": "Exam Management",
  "tests": "Class Tests",
  "results": "Results & Marksheets",
  "question-papers": "Question Papers Generator",
  "question-bank": "Question Bank Repository",
  "academic-analytics": "Academic Analytics",
  "attendance": "Attendance Tracking",
  "leave": "Leave Management",
  "timetable": "Timetable Scheduler",
  "behavior": "Behavior Tracking & Incident Reports",
  "fee": "Fee & Invoicing Collection",
  "announcements": "School Announcements & Noticeboards",
  "conversations": "Instant Conversations & Chat",
  "live-classes": "Live Classes Integration (Jitsi)",
  "certificates": "Student Certificate Generator",
  "schedule": "Event Calendar Schedules",
};

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
  const { schoolName: brandedName, logoUrl: brandedLogo } = useSchoolBranding();
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
  const [selectedAcademicYearId, setSelectedAcademicYearIdState] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [allowedModules, setAllowedModules] = useState<Record<string, boolean> | null>(null);
  const [subBuilderRequired, setSubBuilderRequired] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(["academic"]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [studentLimit, setStudentLimit] = useState<number>(100);

  const navGroups = useMemo(() => navGroupsForRole(user?.role), [user]);

  const filteredNavGroups = useMemo(() => {
    if (!allowedModules || user?.role === "super_admin") return navGroups;

    return navGroups
      .map((group) => {
        const items = group.items.filter((item) => {
          const moduleKey = routeToModuleMap[item.href];
          if (moduleKey && !allowedModules[moduleKey]) {
            return false;
          }
          return true;
        });
        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  }, [navGroups, allowedModules, user]);

  useEffect(() => {
    if (user && user.role !== "super_admin") {
      fetch("/api/subscription/current", {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
      })
        .then((res) => res.json())
        .then((payload) => {
          if (payload?.ok && payload?.data) {
            const data = payload.data;
            if (data.allowed_modules) {
              setAllowedModules(data.allowed_modules);
            }
            if (data.available_packages) {
              setAvailablePackages(data.available_packages);
            }
            if (data.package_builder_required && user.role === "admin") {
              setSubBuilderRequired(true);
            }
            if (data.selected_packages) {
              setSelectedItems(data.selected_packages);
            }
            if (data.students_limit && data.students_limit > 0) {
              setStudentLimit(data.students_limit);
            }
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleToggleModule = (pkgId: string, moduleId: string, mandatory: boolean) => {
    if (mandatory) return;
    setSelectedItems((prev) => {
      let next = [...prev];
      if (next.includes(moduleId)) {
        next = next.filter((x) => x !== moduleId);
        next = next.filter((x) => x !== pkgId);
      } else {
        next.push(moduleId);
        const pkg = availablePackages.find((p) => p.id === pkgId);
        if (pkg) {
          const allModulesChecked = pkg.modules.every((m: string) => next.includes(m));
          if (allModulesChecked && !next.includes(pkgId)) {
            next.push(pkgId);
          }
        }
      }
      return next;
    });
  };

  const handleTogglePackage = (pkgId: string, mandatory: boolean) => {
    if (mandatory) return;
    const pkg = availablePackages.find((p) => p.id === pkgId);
    if (!pkg) return;
    
    setSelectedItems((prev) => {
      let next = [...prev];
      const isSelected = next.includes(pkgId);
      if (isSelected) {
        next = next.filter((x) => x !== pkgId && !pkg.modules.includes(x));
      } else {
        if (!next.includes(pkgId)) next.push(pkgId);
        pkg.modules.forEach((m: string) => {
          if (!next.includes(m)) next.push(m);
        });
      }
      return next;
    });
  };

  const totalRateForDisplay = useMemo(() => {
    if (!availablePackages.length) return 0;
    let totalRate = 0;
    availablePackages.forEach((pkg) => {
      if (pkg.mandatory) {
        totalRate += pkg.rate;
        return;
      }
      let pkgSelectedRate = 0;
      pkg.modules.forEach((m: string) => {
        if (selectedItems.includes(m)) {
          const rate = m === "fee" ? 4 : 1;
          pkgSelectedRate += rate;
        }
      });
      if (pkgSelectedRate > pkg.rate) {
        pkgSelectedRate = pkg.rate;
      }
      totalRate += pkgSelectedRate;
    });
    return totalRate;
  }, [availablePackages, selectedItems]);

  const estimatedCost = useMemo(() => {
    const cost = studentLimit * totalRateForDisplay;
    return cost < 500 ? 500 : cost;
  }, [studentLimit, totalRateForDisplay]);

  const handleSavePlan = async () => {
    setSavingPlan(true);
    try {
      const response = await fetch("/api/subscription/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
        },
        body: JSON.stringify({
          selected_packages: selectedItems,
          student_limit: studentLimit,
        }),
      });
      const payload = await response.json();
      if (payload?.ok && payload?.data) {
        if (payload.data.allowed_modules) {
          setAllowedModules(payload.data.allowed_modules);
        }
        setSubBuilderRequired(false);
      } else {
        alert("Failed to save plan. Please try again.");
      }
    } catch {
      alert("Failed to save plan. Please check your network.");
    } finally {
      setSavingPlan(false);
    }
  };

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
      filteredNavGroups.forEach((g) => (initial[g.label] = true));
      setExpandedGroups(initial);
    }
  }, [filteredNavGroups]);

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

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const content = (
    <div className="flex h-screen bg-background text-slate-900 font-sans overflow-hidden">
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
        className={`fixed top-0 z-40 flex h-screen flex-shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-[0_1px_5px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out ${
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:sticky md:w-16 w-64"
            : "translate-x-0 w-64 md:sticky md:w-64"
        }`}
      >
        <div className={`flex h-11 items-center gap-2 px-3 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
              <img src="/logo.jpeg" alt="Eduplexo" className="h-full w-full object-cover" />
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
            <AppIcon name={isCollapsed ? "chevron_right" : "chevron_left"} size={15} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-2 py-2.5 custom-scrollbar overflow-y-auto">
          {filteredNavGroups.map((group) => (
            <div key={group.label} className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return isCollapsed ? (
                  <Tooltip key={item.href} text={item.label}>
                    <Link
                      to={item.href}
                      className={`flex h-7 w-7 items-center justify-center rounded transition-all duration-200 ${isActive ? "bg-blue-600 !text-white shadow-sm" : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"}`}
                    >
                      <AppIcon name={item.icon} size={16} className={` text-[16px] ${isActive ? "font-bold" : ""} `} />
                    </Link>
                  </Tooltip>
                ) : (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`group flex h-7 items-center gap-2.5 px-2.5 py-1 text-[10px] font-extrabold transition-all duration-200 rounded-lg ${isActive ? "bg-blue-600 !text-white shadow-md shadow-blue-600/20" : "text-slate-700 hover:bg-blue-50/50 hover:text-blue-600"}`}
                  >
                    <AppIcon name={item.icon} size={16} className={` text-[16px] transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"} `} />
                    <span className="truncate tracking-tight font-extrabold">{item.label}</span>
                    {isActive && !isCollapsed && <span className="ml-auto h-1 w-1 rounded-full bg-white/60" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`mt-auto border-t border-slate-50 p-1.5 space-y-1 ${isCollapsed ? "flex flex-col items-center" : ""}`}>
          <div className={`flex w-full items-center gap-2.5 rounded-lg border border-slate-50 bg-slate-50/30 px-2.5 py-1.5 transition-colors group ${isCollapsed ? "justify-center" : ""}`}>
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-blue-600 shadow-sm">
              {brandedLogo ? (
                <img
                  src={brandedLogo}
                  alt={brandedName || "School logo"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-white">
                  {(brandedName || user.email || "--").substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {!isCollapsed && (
              <>
                <div className="flex flex-col min-w-0 text-left flex-1">
                  <span className="truncate text-[12px] font-bold text-slate-900">
                    {brandedName || (user.email || "user").split("@")[0]}
                  </span>
                  <span className="text-[10px] font-bold normal-case  text-slate-400">
                    {user.role === "student" ? "Parent/Student" : user.role.replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="rounded p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <AppIcon name="LogOut" size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col bg-background h-screen overflow-hidden relative z-0">
        <header className="sticky top-0 z-50 flex h-12 md:h-10 items-center justify-between border-b border-slate-200/40 bg-white/70 px-3 md:px-4 backdrop-blur-md overflow-visible gap-2">
          <div className="flex items-center gap-3 flex-1 overflow-visible">
            <button
              onClick={() => setIsCollapsed(false)}
              className="rounded p-1 transition-colors hover:bg-blue-50 md:hidden"
            >
              <AppIcon name="Menu" size={18} className="text-slate-600" />
            </button>
            <div className="relative max-w-[420px] w-full hidden xl:block">
              <AppIcon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="w-full rounded-lg border border-slate-100 bg-slate-50/50 py-1.5 pl-9 pr-3 text-[11px] font-bold text-slate-600 placeholder:text-slate-400/60 transition-all focus:border-blue-200 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-[100] overflow-visible">
            {user.role === "parent" && <ChildSwitcher />}

            {user.role === "admin" && (
            <div className="hidden sm:flex items-center gap-2 rounded-md border border-slate-100 bg-white px-2 py-1">
              <AppIcon name="Calendar" size={14} className="text-slate-400" />
              <select
                value={selectedAcademicYearId}
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
                className="bg-transparent text-[10px] font-black tracking-widest text-slate-500 focus:outline-none cursor-pointer"
              >
                {academyYears.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.year}{row.is_active ? " (Active)" : ""}
                  </option>
                ))}
              </select>
            </div>
            )}

            <div className="mx-0.5 hidden h-3 w-px bg-slate-200/40 sm:block" />

            <div className="flex items-center gap-2">
              {user.role === "admin" && <AdminActions allowedModules={allowedModules} />}

              <button className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 transition-all hover:border-blue-400 hover:text-blue-600 active:scale-95 shadow-sm">
                <AppIcon name="Bell" size={19} />
                <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
              </button>
            </div>
          </div>
        </header>

        <div key={pathname} className="w-full flex-1 overflow-y-auto animate-fade-in-up px-3 py-3 md:px-6 md:py-4 lg:px-8 custom-scrollbar relative z-10">
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

  // SelectedChildProvider lives at the router layer (ParentLayout) so
  // every parent page is already inside the provider before SchoolShell
  // renders. Wrapping again here would create a stale inner context
  // that masks the outer one.

  // Suppress unused-import warning for Breadcrumb until module pages opt in.
  void Breadcrumb;

  return (
    <>
      {content}
      {subBuilderRequired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-[32px] border border-slate-100 max-w-3xl w-full shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100/80">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <AppIcon name="Settings" size={24} className="text-blue-600" />
                Configure School Portal Setup
              </h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                Customize features and modules to activate in your school's 14-day free trial. You can change this configuration anytime.
              </p>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Sticky Controls Panel */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md pb-6 pt-2 border-b border-slate-100 -mx-8 px-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex-1 w-full">
                  <label htmlFor="student-limit-input" className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Expected Students Limit
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[140px] max-w-[200px]">
                      <AppIcon name="School" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="student-limit-input"
                        type="number"
                        min="1"
                        value={studentLimit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setStudentLimit(isNaN(val) || val < 1 ? 1 : val);
                        }}
                        className="w-full pl-10 pr-3 py-2 text-xs font-black text-slate-800 bg-slate-50 border border-slate-200/80 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all focus:outline-none"
                        placeholder="100"
                      />
                    </div>
                    {/* Common limit presets */}
                    <div className="flex items-center gap-1.5">
                      {[100, 250, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setStudentLimit(preset)}
                          className={`px-3 py-2 text-[10px] font-black rounded-xl border transition-all ${
                            studentLimit === preset
                              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="w-full md:w-auto min-w-[260px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-4 rounded-2xl shadow-lg shadow-blue-600/10 flex flex-col justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-200">Estimated Monthly Cost</p>
                    <p className="text-2xl font-black tracking-tight mt-0.5 text-white">
                      PKR {estimatedCost.toLocaleString()}
                      <span className="text-[10px] font-bold text-blue-200/80 ml-1">/ mo</span>
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center text-[9px] font-bold text-blue-100/90">
                    <span>Per Student Cost: PKR {totalRateForDisplay}</span>
                  </div>
                </div>
              </div>

              {availablePackages.map((pkg) => {
                const isPkgChecked = selectedItems.includes(pkg.id);
                return (
                  <div key={pkg.id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30 hover:bg-slate-50/50 transition-all">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={pkg.mandatory}
                          checked={isPkgChecked || pkg.mandatory}
                          onChange={() => handleTogglePackage(pkg.id, pkg.mandatory)}
                          className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                        />
                        <div>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                            {pkg.name}
                            {pkg.mandatory && (
                              <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Required
                              </span>
                            )}
                          </span>
                        </div>
                      </label>
                      {pkg.mandatory && (
                        <span className="text-[10px] font-black text-slate-400 uppercase bg-white border border-slate-100 px-2.5 py-1 rounded-lg">
                          Included
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                      {pkg.modules.map((m: string) => {
                        const isModChecked = selectedItems.includes(m);
                        return (
                          <label
                            key={m}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                              pkg.mandatory
                                ? "bg-slate-50 border-slate-100 text-slate-400 cursor-default"
                                : isModChecked
                                  ? "bg-blue-50/40 border-blue-200 text-blue-800"
                                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={pkg.mandatory}
                              checked={isModChecked || pkg.mandatory}
                              onChange={() => handleToggleModule(pkg.id, m, pkg.mandatory)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer disabled:cursor-default"
                            />
                            {MODULE_NAMES[m] || m}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Plan Duration</p>
                <div className="flex items-baseline gap-1.5 justify-center md:justify-start mt-0.5">
                  <span className="text-lg font-black text-blue-600">14-Day Free Trial</span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">Activate selected modules instantly with no credit card required.</p>
              </div>
              <button
                type="button"
                disabled={savingPlan}
                onClick={handleSavePlan}
                className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/15 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPlan ? "Activating Portal..." : "Launch School Portal"}
                {!savingPlan && <AppIcon name="ArrowRight" size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
