"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Skeleton, DataState } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { useClasses } from "../hooks/useClasses";
import { ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";
import { ClassForm } from "../components/ClassForm";

export function ClassCreatePage() {
  const router = useRouter();
  const { addClass } = useClasses();
  const { state: academicYearState } = useAcademicYears();
  const { state: teacherState } = useTeachers();
  const {
    data: subjects,
    isLoading: subjectsLoading,
    error: subjectsError,
    refresh: refreshSubjects,
  } = useSubjects();

  const isDependencyLoading =
    academicYearState.status === "idle" ||
    academicYearState.status === "loading" ||
    teacherState.status === "idle" ||
    teacherState.status === "loading" ||
    subjectsLoading;

  const hasAcademicYears = (academicYearState.data?.data ?? []).length > 0;

  const academicYearOptions = (academicYearState.data?.data ?? []).map((item) => ({
    id: item._id,
    label: item.year,
  }));

  const teacherOptions = (teacherState.data ?? []).map((item) => ({
    id: item._id,
    label: `${item.first_name} ${item.last_name}`.trim(),
  }));

  const subjectOptions = (subjects ?? [])
    .filter((item) => item.status === "active")
    .map((item) => ({ id: item._id, label: item.name }));

  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(input: ClassFormInput) {
    setIsSaving(true);
    try {
      const result = await addClass(input);
      if (result && (result as { ok?: boolean }).ok !== false) {
        showToast("Class created successfully", "success");
        router.push("/admin/classes");
        router.refresh();
        return true;
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full py-8 px-6">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register New Class</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Unit Initialization</p>
      </div>

      {academicYearState.status === "error" ? (
        <DataState variant="error" title="Infrastructure Sync Failed" message={academicYearState.error} />
      ) : teacherState.status === "error" ? (
        <DataState variant="error" title="Faculty Data Unavailable" message={teacherState.error} />
      ) : subjectsError ? (
        <DataState variant="error" title="Curriculum Error" message={subjectsError} />
      ) : isDependencyLoading && !academicYearState.data ? (
        <div className="space-y-6">
           <Skeleton className="h-[200px] w-full rounded-2xl" />
           <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      ) : !hasAcademicYears ? (
        <div className="py-24 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6 border border-amber-100 shadow-sm">
            <span className="material-symbols-outlined text-4xl font-bold">priority_high</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Academic Cycle Required</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">Initialization cannot proceed without an active academic year configuration in the system core.</p>
          <Link 
            href="/admin/academic-years"
            className="h-12 px-8 rounded-xl bg-slate-900 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-xl active:scale-95"
          >
            Configure Academic Session
          </Link>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20">
          <ClassForm
            onCreate={handleCreate}
            academicYearOptions={academicYearOptions}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            onCreateAcademicYear={() => router.push("/admin/academic-years")}
            onCreateTeacher={() => router.push("/admin/teachers/create")}
          />
        </div>
      )}
    </div>
  );
}
