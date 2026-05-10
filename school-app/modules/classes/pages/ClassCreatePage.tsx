"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { ClassForm } from "../components/ClassForm";
import { useClasses } from "../hooks/useClasses";
import { ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";

export function ClassCreatePage() {
  const router = useRouter();
  const { addClass } = useClasses();
  const { state: academicYearState } = useAcademicYears();
  const { state: teacherState } = useTeachers();
  const {
    data: subjects,
    isLoading: subjectsLoading,
    error: subjectsError,
    createSubject,
    refresh: refreshSubjects
  } = useSubjects();

  const isDependencyLoading =
    academicYearState.status === "idle" ||
    academicYearState.status === "loading" ||
    teacherState.status === "idle" ||
    teacherState.status === "loading" ||
    subjectsLoading;

  const hasAcademicYears = (academicYearState.data?.data ?? []).length > 0;

  const academyCareOptions = (academicYearState.data?.data ?? []).map((item) => ({
    id: item._id,
    label: item.year,
  }));

  const teacherOptions = (teacherState.data ?? []).map((item) => ({
    id: item._id,
    label: `${item.first_name} ${item.last_name}`.trim(),
  }));

  async function handleCreate(input: ClassFormInput) {
    const result = await addClass(input);
    if (result && (result as { ok?: boolean }).ok !== false) {
      showToast("Academic unit initialized successfully", "success");
      router.push("/admin/classes");
      router.refresh();
    }
    return result;
  }

  async function handleQuickAddSubject(name: string) {
    try {
      await createSubject({
        name,
        code: name.substring(0, 3).toUpperCase(),
        status: "active"
      });
      showToast(`Subject "${name}" added to curriculum`, "success");
      await refreshSubjects();
    } catch (error: any) {
      showToast(error.message || "Failed to add subject", "error");
      throw error;
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-10 text-center md:text-left">
        <Link 
          href="/admin/classes" 
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors mb-4 group"
        >
          <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-1">arrow_back</span>
          Back to Registry
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
             <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
               <span className="material-symbols-outlined text-blue-600 text-sm font-black">architecture</span>
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Unit Initialization</h2>
             </div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Register Academic Group</h1>
             <p className="mt-2 text-sm font-medium text-slate-500 max-w-lg">
                Establish a new foundational academic environment, designate faculty leads, and synchronize curriculum mappings.
             </p>
           </div>
           <div className="hidden md:flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
             <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
               <span className="material-symbols-outlined font-black">hub</span>
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Capacity</p>
               <p className="text-sm font-black text-slate-900">Adaptive Stream</p>
             </div>
           </div>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 rounded-3xl">
        <div className="h-1.5 w-full bg-slate-900" />
        <div className="p-6 md:p-10">
          {academicYearState.status === "error" ? (
            <DataState variant="error" title="Infrastructure Sync Failed" message={academicYearState.error} />
          ) : teacherState.status === "error" ? (
            <DataState variant="error" title="Faculty Data Unavailable" message={teacherState.error} />
          ) : subjectsError ? (
            <DataState variant="error" title="Curriculum Error" message={subjectsError} />
          ) : !isDependencyLoading && !hasAcademicYears ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                <span className="material-symbols-outlined text-3xl font-black">priority_high</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Academic Cycle Required</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">Initialization cannot proceed without an active academic year configuration.</p>
              <Link 
                href="/admin/academic-years"
                className="h-11 px-6 rounded-xl bg-slate-900 text-[11px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Create Academic Session
              </Link>
            </div>
          ) : isDependencyLoading ? (
            <div className="space-y-8 py-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
              <div className="flex justify-end pt-4">
                 <Skeleton className="h-12 w-48 rounded-xl" />
              </div>
            </div>
          ) : (
            <ClassForm
              onCreate={handleCreate}
              onAddSubject={handleQuickAddSubject}
              academyCareOptions={academyCareOptions}
              teacherOptions={teacherOptions}
              subjectOptions={(subjects ?? [])
                .filter((item) => item.status === "active")
                .map((item) => ({ id: item._id, label: item.name }))}
            />
          )}
        </div>
      </div>
      
      <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 px-6">
         <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 uppercase">
                    AC
                 </div>
               ))}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Collaborative Infrastructure</p>
         </div>
         <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Validation Active</p>
         </div>
      </div>
    </div>
  );
}

