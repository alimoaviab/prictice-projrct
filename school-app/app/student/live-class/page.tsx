"use client";

import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { LiveClassList } from "../../../components/live-classes/LiveClassList";

export default function StudentLiveClassPage() {
  return (
    <SchoolShell title="Live Classes" eyebrow="Student">
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-sky-600 to-indigo-600 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">Online Learning</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">My Live Classes</h1>
              <p className="mt-3 max-w-2xl text-sm text-sky-100 md:text-base">
                Join your scheduled online sessions, view upcoming classes, and participate in interactive learning.
                Only classes for your enrolled section are shown here.
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Schedule</h2>
                <p className="mt-1 text-sm text-slate-500">Upcoming and live sessions for you to join.</p>
              </div>
            </div>

            <LiveClassList role="STUDENT" />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick Links</h2>
              <div className="mt-5 space-y-3">
                <Link
                    href="/student/timetable"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>Weekly Timetable</span>
                    <span className="material-symbols-outlined text-slate-400">calendar_month</span>
                </Link>
                <Link
                    href="/student/attendance"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>My Attendance</span>
                    <span className="material-symbols-outlined text-slate-400">how_to_reg</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-indigo-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-indigo-700 mb-3">
                <span className="material-symbols-outlined">info</span>
                <h2 className="text-lg font-bold">Important Note</h2>
              </div>
              <p className="text-sm text-indigo-900">
                Ensure you join the session within 5 minutes of the start time. Your attendance is tracked automatically when you click "Join Meeting".
              </p>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
