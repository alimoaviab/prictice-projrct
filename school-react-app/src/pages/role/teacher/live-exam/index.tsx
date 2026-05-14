import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { LiveExamList } from "@/components/live-exams/LiveExamList";
import { CreateLiveExamModal } from "@/components/live-exams/CreateLiveExamModal";

const stats = [
  { title: "Scheduled Exams", value: "-", detail: "Upcoming sessions", icon: "quiz", tone: "text-sky-700" },
  { title: "Today", value: "-", detail: "Live exams", icon: "today", tone: "text-emerald-700" },
  { title: "Candidates", value: "-", detail: "Registered students", icon: "groups", tone: "text-violet-700" },
];

export function TeacherLiveExamPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [classesData, setClassesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch("/api/school/my-classes"),
          fetch("/api/school/subjects")
        ]);

        if (classesRes.ok) {
          const data = await classesRes.json();
          setClassesData(data.classes || []);
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
    <SchoolShell title="Live Exams" eyebrow="Teacher">
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold normal-case tracking-[0.35em] text-cyan-200/80">Exam control center</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Manage Live Exams</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                Create and supervise live exam sessions while keeping student participation visible.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs font-semibold normal-case tracking-[0.25em] text-cyan-100/70">Exam readiness</p>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-slate-200">Ready for launch</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => (
            <div key={item.title} className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold normal-case tracking-[0.3em] text-slate-400">{item.title}</p>
                  <p className={`mt-3 text-3xl font-bold ${item.tone}`}>{item.value}</p>
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
                <h2 className="text-xl font-bold text-slate-900">Upcoming exams</h2>
                <p className="mt-1 text-sm text-slate-500">Review exams scheduled for the week ahead.</p>
              </div>
              <button
                onClick={() => setListKey(prev => prev + 1)}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>
            
            <LiveExamList key={listKey} role="TEACHER" />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
              <div className="mt-5 space-y-3">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>Create Live Exam</span>
                    <span className="material-symbols-outlined text-slate-400">add_circle</span>
                </button>
                <Link
                    to="/teacher/exams"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>Question Bank</span>
                    <span className="material-symbols-outlined text-slate-400">quiz</span>
                </Link>
                <Link
                    to="/teacher/classes"
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span>My Classes</span>
                    <span className="material-symbols-outlined text-slate-400">groups</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Best practices</h2>
              <p className="mt-3 text-sm text-slate-500">Confirm exam timing and student readiness before going live to reduce last-minute issues.</p>
            </div>
          </div>
        </div>
      </div>

      <CreateLiveExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setListKey(prev => prev + 1)}
        classes={classesData}
        subjects={subjectsData}
      />
    </SchoolShell>
  );
}

