"use client";

import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { LiveClassList } from "../../../components/live-classes/LiveClassList";
import { CreateLiveClassModal } from "../../../components/live-classes/CreateLiveClassModal";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";

const stats = [
  { title: "My Live Classes", value: "-", detail: "Classes scheduled", icon: "video_camera_back", tone: "text-sky-700" },
  { title: "Today", value: "-", detail: "Active sessions", icon: "today", tone: "text-emerald-700" },
  { title: "Participants", value: "-", detail: "Joined students", icon: "groups", tone: "text-violet-700" },
];

export default function TeacherLiveClassPage() {
  const { status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listKey, setListKey] = useState(0); // To force refresh list
  const [classesData, setClassesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);

  useEffect(() => {
    // Fetch filter data for modal
    const fetchFormData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch("/api/school/my-classes"), // or teacher/classes depending on exact API layout
          fetch("/api/school/subjects")
        ]);

        if (classesRes.ok) {
          const data = await classesRes.json();
          setClassesData(data.data || []);
        }
        if (subjectsRes.ok) {
           const data = await subjectsRes.json();
           setSubjectsData(data.data || []);
        }
      } catch (e) {
        console.error("Failed to load form data", e);
      }
    };
    fetchFormData();
  }, []);

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
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upcoming live classes</h2>
                <p className="mt-1 text-sm text-slate-500">Scheduled sessions for today and this week.</p>
              </div>
              <button
                onClick={() => setListKey(prev => prev + 1)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>

            <LiveClassList key={listKey} role="TEACHER" />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
              <div className="mt-5 space-y-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>Create Live Class</span>
                    <span className="material-symbols-outlined text-slate-400">add_circle</span>
                </button>
                <Link
                    href="/teacher/timetable"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>View Timetable</span>
                    <span className="material-symbols-outlined text-slate-400">schedule</span>
                </Link>
                {status === "unauthenticated" && (
                  <button
                    onClick={() => signIn("google")}
                    className="w-full flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <span>Connect Google Calendar</span>
                    <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                  </button>
                )}
                {status === "authenticated" && (
                  <div className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700">
                    <span>Google Calendar Linked</span>
                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Notes</h2>
              <p className="mt-3 text-sm text-slate-500">Live classes are automatically integrated with Google Meet. Connect your Google Calendar to automatically generate meeting links.</p>
            </div>
          </div>
        </div>
      </div>

      <CreateLiveClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setListKey(prev => prev + 1)}
        classes={classesData}
        subjects={subjectsData}
      />
    </SchoolShell>
  );
}
