"use client";

import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useState, useEffect } from "react";

const stats = [
  { title: "Upcoming Exams", value: "0", detail: "Ready to join", icon: "schedule", tone: "text-sky-700" },
  { title: "Today", value: "0", detail: "Live sessions", icon: "today", tone: "text-emerald-700" },
  { title: "Completed", value: "0", detail: "Finished exams", icon: "check_circle", tone: "text-violet-700" },
];

export default function StudentLiveExamPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/live-exams?status=active")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setExams(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <SchoolShell title="Live Exams" eyebrow="Student">
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-violet-900 p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-violet-200/80">Exam portal</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Join Live Exams</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Explore your live exam schedule and enter sessions securely from one place.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-100/70">Exam readiness</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-slate-200">All set</span>
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
                <h2 className="text-xl font-bold text-slate-900">Next exam sessions</h2>
                <p className="mt-1 text-sm text-slate-500">Choose the exam you want to enter and review details.</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {loading ? (
                 <p className="text-sm text-slate-500">Loading exams...</p>
              ) : exams.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">No exam session yet</p>
                      <p className="text-sm text-slate-500">Scheduled live exams will appear here.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">Waiting</span>
                  </div>
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam._id} className="rounded-3xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{exam.title}</p>
                        <p className="text-sm text-slate-600">Duration: {exam.duration} mins | Marks: {exam.total_marks}</p>
                      </div>
                      <Link
                        href={`/student/live-exam/${exam._id}`}
                        className="rounded-full bg-violet-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        Join Now
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
              <div className="mt-5 space-y-3">
                {[
                  ["View Results", "/student/results", "leaderboard"],
                  ["Live Exam Hub", "/student/live-exam", "live_tv"],
                  ["Attendance", "/student/attendance", "fact_check"],
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
              <h2 className="text-xl font-bold text-slate-900">Exam advice</h2>
              <p className="mt-3 text-sm text-slate-500">Make sure your device is charged and your internet connection is stable before exam start. Do not switch tabs during an active exam.</p>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
