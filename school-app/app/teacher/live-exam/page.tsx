"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { LiveExamWorkspace } from "../../../components/live-exams/LiveExamWorkspace";
import { CreateLiveExamModal } from "../../../components/live-exams/CreateLiveExamModal";

export default function TeacherLiveExamPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listKey, setListKey] = useState(0);
  const [classesData, setClassesData] = useState([]);
  const [subjectsData, setSubjectsData] = useState([]);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          fetch("/api/school/my-classes"),
          fetch("/api/school/subjects"),
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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900">
                My Exam Sessions
              </h1>
              <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] animate-pulse"></span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Manage and supervise your live examinations
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              <span className="material-symbols-outlined text-[18px]">
                calendar_today
              </span>
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:ring-2 focus:ring-slate-900/20"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Create Exam
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Live & Active
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-emerald-600">-</p>
              <span className="text-xs font-semibold text-emerald-600/70 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sessions
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm md:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Scheduled Today
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-700">-</p>
              <span className="text-xs font-semibold text-slate-400">
                Exams
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              My Candidates
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-slate-700">-</p>
              <span className="text-xs font-semibold text-slate-400">
                Students
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
              Alerts
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-black text-red-700">-</p>
              <span className="text-xs font-semibold text-red-500">
                Flagged
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
            <LiveExamWorkspace key={listKey} role="TEACHER" />
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Quick actions
              </h2>
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>Create Live Exam</span>
                  <span className="material-symbols-outlined text-slate-400">
                    add_circle
                  </span>
                </button>
                <Link
                  href="/teacher/exams"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>Question Bank</span>
                  <span className="material-symbols-outlined text-slate-400">
                    quiz
                  </span>
                </Link>
                <Link
                  href="/teacher/classes"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span>My Classes</span>
                  <span className="material-symbols-outlined text-slate-400">
                    groups
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Best practices
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Confirm exam timing and student readiness before going live to
                reduce last-minute issues.
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreateLiveExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setListKey((prev) => prev + 1)}
        classes={classesData}
        subjects={subjectsData}
      />
    </SchoolShell>
  );
}
