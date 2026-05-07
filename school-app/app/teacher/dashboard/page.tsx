"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Badge, Card, DataState, Skeleton } from "../../../components/ui";
import { SchoolShell } from "../../../layouts/SchoolShell";
import { useAuth } from "../../../hooks/useAuth";
import { useSafeAsync } from "../../../hooks/useSafeAsync";
import { serviceRequest } from "../../../services/service-client";
import { TimetablePreview } from "../../../modules/timetable/components/TimetablePreview";

type TeacherPortalResponse = {
  teacher: {
    id: string;
    employee_no: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    qualification: string;
    status: string;
  };
  classes: Array<{
    id: string;
    name: string;
    section: string;
    capacity: number;
    academic_year: string;
    enrolled_students: number;
  }>;
  subjects: Array<{ id: string; name: string; code: string }>;
};

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { state, run } = useSafeAsync<TeacherPortalResponse>();

  useEffect(() => {
    void run(async () => {
      if (!user?.profileId) {
        throw new Error("Teacher profile is missing.");
      }

      const result = await serviceRequest<TeacherPortalResponse>(`/api/teachers/${user.profileId}`);
      if (!result.ok) {
        throw new Error(result.error.message || "Failed to load teacher dashboard");
      }

      return result.data;
    }).catch(() => {
      // useSafeAsync already captures the error.
    });
  }, [run, user?.profileId]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <SchoolShell eyebrow="Teacher Portal" title="Teaching Workspace">
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </SchoolShell>
    );
  }

  if (state.status === "error") {
    return (
      <SchoolShell eyebrow="Teacher Portal" title="Teaching Workspace">
        <DataState variant="error" title="Teacher dashboard unavailable" message={state.error} />
      </SchoolShell>
    );
  }

  const teacherName = `${state.data.teacher.first_name} ${state.data.teacher.last_name}`.trim();
  const assignedStudents = state.data.classes.reduce((sum, classItem) => sum + Number(classItem.enrolled_students || 0), 0);

  return (
    <SchoolShell eyebrow="Teacher Portal" title="Teaching Workspace">
      <div className="space-y-8">
        <section className="rounded-[2rem] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Welcome back</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">{teacherName}</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200 md:text-base">
                {state.data.teacher.qualification || "Teacher portal"} · Employee No {state.data.teacher.employee_no}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/70">Status</p>
              <div className="mt-2 flex items-center gap-3">
                <Badge variant="success" className="bg-emerald-400/15 text-emerald-100 border-emerald-300/20">
                  {state.data.teacher.status}
                </Badge>
                <span className="text-sm text-slate-200">{state.data.teacher.email}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assigned Classes</p>
            <p className="mt-3 text-3xl font-black text-cyan-700">{state.data.classes.length}</p>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Students</p>
            <p className="mt-3 text-3xl font-black text-emerald-700">{assignedStudents}</p>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Subjects</p>
            <p className="mt-3 text-3xl font-black text-indigo-700">{state.data.subjects.length}</p>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Tasks</p>
            <p className="mt-3 text-3xl font-black text-amber-700">4</p>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <h2 className="text-xl font-bold text-slate-900">Quick actions</h2>
            <p className="text-sm text-slate-500">Jump directly to the daily teaching workflows.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Live Class", "/teacher/live-class", "videocam"],
                ["Live Exam", "/teacher/live-exam", "live_tv"],
                ["Mark Attendance", "/teacher/attendance/create", "fact_check"],
                ["Create Homework", "/teacher/homework/create", "assignment"],
                ["Schedule Exam", "/teacher/exams/create", "quiz"],
                ["Enter Results", "/teacher/results/create", "leaderboard"],
                ["My Classes", "/teacher/classes", "groups"],
                ["Timetable", "/teacher/timetable", "schedule"]
              ].map(([label, href, icon]) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">Open {label.toLowerCase()}</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 transition-transform group-hover:translate-x-1">{icon}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-bold text-slate-900">Assigned subjects</h2>
            <div className="mt-5 space-y-3">
              {state.data.subjects.length ? state.data.subjects.slice(0, 6).map((subject) => (
                <div key={subject.id} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="font-semibold text-slate-900">{subject.name}</p>
                  <p className="text-xs text-slate-500">{subject.code || "No code"}</p>
                </div>
              )) : (
                <p className="text-sm text-slate-500">No subjects assigned yet.</p>
              )}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <h2 className="text-xl font-bold text-slate-900">My classes</h2>
            <div className="mt-5 space-y-3">
              {state.data.classes.length ? state.data.classes.map((classItem) => (
                <Link
                  key={classItem.id}
                  href={`/teacher/classes/${classItem.id}/students`}
                  className="block rounded-2xl border border-slate-200 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{classItem.name}</p>
                      <p className="text-xs text-slate-500">{classItem.section || "No section"} · {classItem.academic_year || "Current year"}</p>
                    </div>
                    <Badge variant={classItem.enrolled_students >= classItem.capacity ? "warning" : "secondary"}>
                      {classItem.enrolled_students}/{classItem.capacity || 0}
                    </Badge>
                  </div>
                </Link>
              )) : (
                <p className="text-sm text-slate-500">No classes assigned.</p>
              )}
            </div>
          </Card>

          <TimetablePreview teacherId={state.data.teacher.id} />
        </section>
      </div>
    </SchoolShell>
  );
}
