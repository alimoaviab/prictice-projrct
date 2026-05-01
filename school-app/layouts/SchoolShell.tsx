"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageHeader } from "../components/ui";

const navItems = [
  { label: "Overview", href: "/admin/dashboard", icon: "dashboard" },
  { label: "Academy Care", href: "/admin/academy-care", icon: "health_and_safety" },
  { label: "Academic Years", href: "/admin/academic-years", icon: "calendar_today" },
  { label: "Classes", href: "/admin/classes", icon: "class" },
  { label: "Teachers", href: "/admin/teachers", icon: "person" },
  { label: "Students", href: "/admin/students", icon: "group" },
  { label: "Attendance", href: "/admin/attendance", icon: "check_circle" },
  { label: "Homework", href: "/admin/homework", icon: "assignment" },
  { label: "Exams", href: "/admin/exams", icon: "description" },
  { label: "Results", href: "/admin/results", icon: "poll" },
  { label: "Settings", href: "/admin/settings", icon: "settings" }
];

export function SchoolShell({
  children,
  title,
  eyebrow
}: {
  children: React.ReactNode;
  title: string;
  eyebrow: string;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-primary text-white flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <span className="text-lg font-bold tracking-tight">Eduplexo</span>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-blue-100 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${
                    isActive ? "text-secondary" : "text-blue-300 group-hover:text-white"
                  }`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center">
              <span className="text-sm font-bold">JD</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">John Doe</span>
              <span className="text-xs text-blue-200">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-surface flex items-center justify-end px-8 sticky top-0 z-10">
           <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div className="w-px h-6 bg-border mx-2"></div>
              <span className="text-sm font-medium text-gray-700">School Year: 2024-2025</span>
           </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          <PageHeader title={title} eyebrow={eyebrow} />
          {children}
        </div>
      </main>
    </div>
  );
}
