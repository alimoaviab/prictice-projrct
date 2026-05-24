import { AppIcon } from "shared/ui/AppIcon";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { LiveClassList } from "@/components/live-classes/LiveClassList";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const stats = [
  { title: "My Live Classes", value: "-", detail: "Classes scheduled", icon: "video_camera_back", tone: "text-sky-700" },
  { title: "Today", value: "-", detail: "Active sessions", icon: "today", tone: "text-emerald-700" },
  { title: "Participants", value: "-", detail: "Joined students", icon: "groups", tone: "text-violet-700" },
];

export function TeacherLiveClassPage() {
  const navigate = useNavigate();
  const [listKey, setListKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      navigate("/auth/login");
      return;
    }
    setAuthChecked(true);
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <SchoolShell title="Live Classes" eyebrow="Teacher">
      <div className="space-y-6 md:space-y-8">
        <section className="rounded-2xl md:rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-5 md:p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-4 md:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold normal-case tracking-[0.35em] text-sky-200/80">Live teaching workspace</p>
              <h1 className="mt-2 md:mt-3 text-2xl md:text-3xl lg:text-5xl font-bold tracking-tight">Manage Live Classes</h1>
              <p className="mt-2 md:mt-3 max-w-2xl text-xs md:text-sm text-slate-200 lg:text-base">
                Launch, monitor, and track your live sessions with students in a single portal.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 md:px-5 py-3 md:py-4 backdrop-blur-md self-start lg:self-auto">
              <p className="text-[10px] md:text-xs font-semibold normal-case tracking-[0.25em] text-sky-100/70">Status</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
                <span className="text-xs md:text-sm text-slate-200">Ready to schedule</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => (
            <div key={item.title} className="rounded-xl md:rounded-[2rem] border border-slate-200/70 bg-white p-4 md:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold normal-case tracking-[0.3em] text-slate-400">{item.title}</p>
                  <p className={`mt-2 md:mt-3 text-2xl md:text-3xl font-bold ${item.tone}`}>{item.value}</p>
                </div>
                <AppIcon name={item.icon} size={24} className="md:text-3xl text-slate-300" />
              </div>
              <p className="mt-3 md:mt-4 text-xs md:text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-xl md:rounded-[2rem] border border-slate-200/70 bg-white p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
              <div className="min-w-0">
                <h2 className="text-base md:text-xl font-bold text-slate-900">Upcoming Live Classes</h2>
                <p className="mt-1 text-xs md:text-sm text-slate-500">Scheduled sessions for today and this week.</p>
              </div>
              <button
                onClick={() => setListKey(prev => prev + 1)}
                className="rounded-full bg-slate-900 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-semibold text-white transition hover:bg-slate-800 whitespace-nowrap"
              >
                Refresh
              </button>
            </div>

            <LiveClassList key={listKey} role="TEACHER" />
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="rounded-xl md:rounded-[2rem] border border-slate-200/70 bg-white p-4 md:p-6 shadow-sm">
              <h2 className="text-base md:text-xl font-bold text-slate-900">Quick Actions</h2>
              <div className="mt-4 md:mt-5 space-y-3">
                <button
                  onClick={() => navigate("/teacher/live-class/create")}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>Create Live Class</span>
                  <AppIcon name="PlusCircle" className="text-slate-400" />
                </button>
                <Link
                  to="/teacher/timetable"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 md:py-4 text-xs md:text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>View Timetable</span>
                  <AppIcon name="Clock" className="text-slate-400" />
                </Link>
              </div>
            </div>

            <div className="rounded-xl md:rounded-[2rem] border border-slate-200/70 bg-white p-4 md:p-6 shadow-sm">
              <h2 className="text-base md:text-xl font-bold text-slate-900">How it works</h2>
              <p className="mt-3 text-xs md:text-sm text-slate-500">
                Create a live class and a unique meeting link is generated automatically. Share it with your students — they can join directly from their portal with one click.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
