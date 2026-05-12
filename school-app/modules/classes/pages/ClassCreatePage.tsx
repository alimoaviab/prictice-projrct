"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Card, Skeleton, DataState } from "../../../components/ui";
import { useAcademicYears } from "../../academicYear/hooks/useAcademicYears";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { ClassForm } from "../components/ClassForm";
import { useClasses } from "../hooks/useClasses";
import { ClassFormInput } from "../types/class.types";
import { showToast } from "../../../utils/toast";
import { DashboardDrawer } from "../../../components/dashboard/DashboardDrawer";
import { AcademicYearForm } from "../../academicYear/components/AcademicYearForm";
import { TeacherForm } from "../../teachers/components/TeacherForm";
import { useClasses as useClassList } from "../hooks/useClasses"; // For class options in teacher form

export function ClassCreatePage() {
  const router = useRouter();
  const { addClass } = useClasses();
  const { state: academicYearState, addAcademicYear, refresh: refreshAcademicYears } = useAcademicYears();
  const { state: teacherState, addTeacher, refresh: refreshTeachers } = useTeachers();
  const { state: classesListState } = useClassList();
  const {
    data: subjects,
    isLoading: subjectsLoading,
    error: subjectsError,
    createSubject,
    refresh: refreshSubjects
  } = useSubjects();

  // Drawer states
  const [isAcademicYearDrawerOpen, setIsAcademicYearDrawerOpen] = useState(false);
  const [isTeacherDrawerOpen, setIsTeacherDrawerOpen] = useState(false);
  
  // Track newly created IDs for auto-selection
  const [newAcademicYearId, setNewAcademicYearId] = useState<string | undefined>(undefined);
  const [newTeacherId, setNewTeacherId] = useState<string | undefined>(undefined);

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
    <div className="w-full py-2 px-6">
      {/* Heading removed per user request */}


      <div className="premium-card p-0 overflow-hidden border-slate-200/60 bg-white shadow-2xl shadow-slate-200/50 rounded-3xl">
        <div className="p-4 md:p-6">
          {academicYearState.status === "error" ? (
            <DataState variant="error" title="Infrastructure Sync Failed" message={academicYearState.error} />
          ) : teacherState.status === "error" ? (
            <DataState variant="error" title="Faculty Data Unavailable" message={teacherState.error} />
          ) : subjectsError ? (
            <DataState variant="error" title="Curriculum Error" message={subjectsError} />
          ) : isDependencyLoading && !academicYearState.data ? (
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
          ) : !hasAcademicYears ? (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
                <span className="material-symbols-outlined text-3xl font-bold">priority_high</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Academic Cycle Required</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-xs">Initialization cannot proceed without an active academic year configuration.</p>
              <Link 
                href="/admin/academic-years"
                className="h-11 px-6 rounded-xl bg-slate-900 text-[11px] font-bold normal-case  text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Create Academic Session
              </Link>
            </div>
          ) : (
            <div className="relative">
              {isDependencyLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Refreshing...</span>
                  </div>
                </div>
              )}
              <ClassForm
                onCreate={handleCreate}
                onAddSubject={handleQuickAddSubject}
                academicYearOptions={academicYearOptions}
                teacherOptions={teacherOptions}
                subjectOptions={(subjects ?? [])
                  .filter((item) => item.status === "active")
                  .map((item) => ({ id: item._id, label: item.name }))}
                onCreateAcademicYear={() => setIsAcademicYearDrawerOpen(true)}
                onCreateTeacher={() => setIsTeacherDrawerOpen(true)}
                autoSelectAcademicYear={newAcademicYearId}
                autoSelectTeacher={newTeacherId}
                onSelectionHandled={() => {
                  setNewAcademicYearId(undefined);
                  setNewTeacherId(undefined);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Contextual Side Drawers */}
      <DashboardDrawer
        isOpen={isAcademicYearDrawerOpen}
        onClose={() => setIsAcademicYearDrawerOpen(false)}
        title="New Academic Session"
        description="Initialize an institutional timeline without leaving your current class setup."
        icon="calendar_month"
        primaryActionLabel="Publish Session"
        onPrimaryAction={() => {
          const form = document.getElementById("academic-year-form-quick") as HTMLFormElement;
          if (form) form.requestSubmit();
        }}
      >
        <div className="space-y-4">
          <AcademicYearForm 
            showFooter={false}
            onCreate={async (input) => {
              const result = await addAcademicYear(input);
              if (result && (result as any).ok !== false) {
                const newId = (result as any).data?._id;
                await refreshAcademicYears();
                setNewAcademicYearId(newId);
                setIsAcademicYearDrawerOpen(false);
                showToast("Academic year created and selected", "success");
              }
              return result;
            }} 
          />
        </div>
      </DashboardDrawer>

      <DashboardDrawer
        isOpen={isTeacherDrawerOpen}
        onClose={() => setIsTeacherDrawerOpen(false)}
        title="Add New Teacher"
        description="Instantly add faculty members to the database and assign them to classes."
        icon="person_add"
        primaryActionLabel="Add Teacher"
        onPrimaryAction={() => {
          const form = document.getElementById("teacher-form-quick") as HTMLFormElement;
          if (form) form.requestSubmit();
        }}
      >
        <div className="space-y-4">
          <TeacherForm 
            showFooter={false}
            classOptions={(classesListState.data ?? []).map(c => ({ id: c._id, label: c.name }))}
            onCreate={async (input) => {
              const result = await addTeacher(input);
              if (result && (result as any).ok !== false) {
                const newId = (result as any).data?._id;
                await refreshTeachers();
                setNewTeacherId(newId);
                setIsTeacherDrawerOpen(false);
                showToast("Teacher added to curriculum", "success");
              }
              return result;
            }}
          />
        </div>
      </DashboardDrawer>
    </div>
  );
}


