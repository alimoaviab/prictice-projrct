import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton, DataState } from "@/components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { useClasses } from "../hooks/useClasses";
import { ClassFormInput } from "../types/class.types";
import { showToast } from "@/utils/toast";
import { ClassForm } from "../components/ClassForm";

export function ClassCreatePage() {
  const navigate = useNavigate();
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
        // Toast is already shown by the hook — no duplicate here
        navigate("/admin/classes");
        return true;
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-2 px-4 sm:px-6">
      <div className="mb-3 flex items-center justify-between">
        <Link
          to="/admin/classes"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 normal-case hover:text-slate-900 transition-all group"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
          Return to Classes
        </Link>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 normal-case ">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Academic
        </div>
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
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20">
          {!hasAcademicYears && (
             <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                      <span className="material-symbols-outlined font-bold">priority_high</span>
                   </div>
                   <div>
                      <p className="text-xs font-bold text-amber-900">Academic Year Required</p>
                      <p className="text-[10px] text-amber-600 font-medium">You need to create at least one academic session to register a class.</p>
                   </div>
                </div>
                <Link
                  to="/admin/academic-years"
                  className="h-9 px-4 rounded-lg bg-amber-600 text-[10px] font-bold text-white hover:bg-amber-700 transition-all shadow-sm flex items-center"
                >
                  Create Session
                </Link>
             </div>
          )}
          <ClassForm
            onCreate={handleCreate}
            academicYearOptions={academicYearOptions}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            onCreateAcademicYear={() => navigate("/admin/academic-years")}
            onCreateTeacher={() => navigate("/admin/teachers/create")}
          />
        </div>
      )}
    </div>
  );
}
