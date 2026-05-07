"use client";

import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";

const stats = [
  { title: "My Live Classes", value: "0", detail: "Classes scheduled", icon: "video_camera_back", tone: "text-sky-700" },
  { title: "Today", value: "0", detail: "Active sessions", icon: "today", tone: "text-emerald-700" },
  { title: "Participants", value: "0", detail: "Joined students", icon: "groups", tone: "text-violet-700" },
];

export default function TeacherLiveClassPage() {
  return (
    <SchoolShell title="Live Classes" eyebrow="Teacher">
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/80">Live teaching workspace</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Manage Live Classes</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Launch, monitor, and track your live sessions with students in a single portal.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-100/70">Status</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-slate-200">Ready to schedule</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => (
            <div key={item.title} className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{item.title}</p>
                  <p className={`mt-3 text-3xl font-black ${item.tone}`}>{item.value}</p>
                </div>
                <span className="material-symbols-outlined text-3xl text-slate-300">{item.icon}</span>
              </div>
              <p className="mt-4 text-sm text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upcoming live classes</h2>
                <p className="mt-1 text-sm text-slate-500">Scheduled sessions for today and this week.</p>
              </div>
              <Link
                href="/teacher/live-class"
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Refresh
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">No sessions scheduled</p>
                      <p className="text-sm text-slate-500">Add a live class to see it here.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
              <div className="mt-5 space-y-3">
                {[
                  ["Create Live Class", "/teacher/live-class", "add_circle"],
                  ["View Timetable", "/teacher/timetable", "schedule"],
                  ["My Classes", "/teacher/classes", "groups"],
                ].map(([label, href, icon]) => (
                  <Link
                    key={href as string}
                    href={href as string}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>{label}</span>
                    <span className="material-symbols-outlined text-slate-400">{icon}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Notes</h2>
              <p className="mt-3 text-sm text-slate-500">Live classes are best when you prepare the lesson plan and confirm attendance before session start.</p>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
