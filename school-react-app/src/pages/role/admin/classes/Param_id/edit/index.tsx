import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { SchoolShell } from "@/layouts/SchoolShell";
import { Skeleton, DataState } from "@/components/ui";
import { useAcademicYears } from "@/modules/academicYear/hooks/useAcademicYears";
import { useTeachers } from "@/modules/teachers/hooks/useTeachers";
import { useSubjects } from "@/modules/subjects/hooks/useSubjects";
import { useClasses } from "@/modules/classes/hooks/useClasses";
import { ClassFormInput, ClassRow } from "@/modules/classes/types/class.types";
import { showToast } from "@/utils/toast";
import { ClassForm } from "@/modules/classes/components/ClassForm";
import * as service from "@/modules/classes/services/class.service";

export function ClassEditPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { updateClass } = useClasses();
  const { state: academicYearState } = useAcademicYears();
  const { state: teacherState } = useTeachers();
  const { 
    data: subjects, 
    isLoading: subjectsLoading
  } = useSubjects();
  
  const [classData, setClassData] = useState<ClassRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClass() {
      try {
        const result = await service.getClass(id);
        if (result.success && result.data) {
          setClassData(result.data);
        } else {
          setError(result.message || "Failed to load class data");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    }
    loadClass();
  }, [id]);

  const academicYearOptions = (academicYearState.data?.data ?? []).map((item: any) => ({
    id: item._id,
    label: item.year,
  }));

  const teacherOptions = (teacherState.data ?? []).map((item: any) => ({
    id: item._id,
    label: `${item.first_name} ${item.last_name}`.trim(),
  }));

  const subjectOptions = (subjects ?? [])
    .filter((item: any) => item.status === "active")
    .map((item: any) => ({ id: item._id, label: item.name }));

  const isDependencyLoading =
    academicYearState.status === "loading" ||
    teacherState.status === "loading" ||
    subjectsLoading ||
    isLoading;

  async function handleUpdate(input: ClassFormInput) {
    setIsSaving(true);
    try {
      const result = await updateClass(id, input);
      if (result && (result as { ok?: boolean }).ok !== false) {
        navigate("/admin/classes");

        return true;
      }
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SchoolShell eyebrow="Academic Management" title="Synchronize Class Unit">
      <div className="w-full py-8 px-6">
        {error ? (
          <DataState variant="error" title="Data Retrieval Failed" message={error} />
        ) : isDependencyLoading ? (
          <div className="space-y-6">
             <Skeleton className="h-[200px] w-full rounded-2xl" />
             <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        ) : !classData ? (
          <DataState variant="empty" title="Class Not Found" message="The requested academic unit does not exist in the active session." />
        ) : (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/20">
            <ClassForm
              initialData={classData}
              onCreate={handleUpdate}
              academicYearOptions={academicYearOptions}
              teacherOptions={teacherOptions}
              subjectOptions={subjectOptions}
              onCreateAcademicYear={() => navigate("/admin/academic-years")}
              onCreateTeacher={() => navigate("/admin/teachers/create")}
            />
          </div>
        )}
      </div>
    </SchoolShell>
  );
}
