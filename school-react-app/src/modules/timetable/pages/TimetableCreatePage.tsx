/**
 * Timetable create page rebuilt on the Academic Year design system.
 *
 * Visual contract: matches AcademicYearCreatePage layout (max-w-7xl,
 * 68/32 split, mt-24, rounded-[24px] cards). The actual TimetableForm
 * component is kept untouched so all conflict-detection and step-flow
 * logic continues to work; the page just provides the right chrome.
 */

import { useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Skeleton,
  DataState,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
  GuidanceChecklist,
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TimetableForm } from "../components/TimetableForm";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableFormInput } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { findTimetableConflicts } from "../utils/conflicts";
import { bindRefresh } from "@/services/data-bus";

export function TimetableCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get("class_id") || undefined;
  const { state: timetableState, addTimetable } = useTimetable();

  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: subjectState, run: runSubjects } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadClasses = useCallback(() => {
    return runClasses(async () => {
      const result = await serviceRequest<any>("/api/classes");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load classes");
      const data: any = result.data;
      if (Array.isArray(data)) return data;
      return Array.isArray(data?.data) ? data.data : [];
    });
  }, [runClasses]);

  const loadTeachers = useCallback(() => {
    return runTeachers(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/teachers");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load teachers");
      return result.data;
    });
  }, [runTeachers]);

  const loadSubjects = useCallback(() => {
    return runSubjects(async () => {
      const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/subjects");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load subjects");
      return result.data;
    });
  }, [runSubjects]);

  useEffect(() => {
    void loadClasses().catch(() => {});
    void loadTeachers().catch(() => {});
    void loadSubjects().catch(() => {});
    // Subscribe to upstream invalidation so the dropdowns repaint when a
    // class or teacher is created somewhere else in the app.
    const offClasses = bindRefresh("classes", loadClasses);
    const offTeachers = bindRefresh("teachers", loadTeachers);
    const offSubjects = bindRefresh("subjects", loadSubjects);
    return () => {
      offClasses();
      offTeachers();
      offSubjects();
    };
  }, [loadClasses, loadTeachers, loadSubjects]);

  const isLoading =
    classState.status === "loading" ||
    teacherState.status === "loading" ||
    subjectState.status === "loading" ||
    classState.status === "idle";

  async function handleCreate(input: TimetableFormInput) {
    try {
      const conflicts = findTimetableConflicts(timetableState.data || [], input);
      if (conflicts.length > 0) {
        return {
          ok: false,
          error: {
            message:
              "Conflict detected! Same class or same teacher cannot be assigned in the same time slot.",
          },
        };
      }

      const result = await addTimetable(input);
      if (result.ok) {
        showToast("Timetable entry created successfully", "success");
        const destination = input.class_id
          ? `/admin/timetable?class_id=${encodeURIComponent(input.class_id)}`
          : "/admin/timetable";
        navigate(destination);
      } else {
        showToast(result.error?.message || "Failed to create entry", "error");
      }
      return result;
    } catch (error: any) {
      console.error("[TimetableCreatePage] Error:", error);
      showToast(error.message || "Failed to create entry", "error");
      return { ok: false, error: { message: error.message } };
    }
  }

  if (
    classState.status === "error" ||
    teacherState.status === "error" ||
    subjectState.status === "error"
  ) {
    return (
      <DataState
        variant="error"
        title="Failed to load dependencies"
        message={classState.error || teacherState.error || subjectState.error}
      />
    );
  }

  const classOptions = (classState.data ?? []).map((o: any) => ({ id: o._id, label: o.name }));
  const teacherOptions = (teacherState.data ?? []).map((o) => ({ id: o._id, label: o.name }));
  const subjectOptions = (subjectState.data ?? []).map((o) => ({ id: o._id, label: o.name }));

  return (
    <EntityCreateLayout
      backTo="/admin/timetable"
      backLabel="Return to Timetable"
      eyebrow="Schedule Composer"
      icon="schedule"
      title="New Timetable Entry"
      subtitle="Place a class period on the weekly grid — class, subject, teacher, room, and time."
      asideTitle="Schedule Intelligence"
      aside={
        <>
          <GuidanceSection title="What is a period?">
            A period locks a class, a subject, and a teacher into a single time slot for one day of the week.
            Conflicts are detected automatically.
          </GuidanceSection>
          <GuidanceSection title="Conflict Rule">
            <GuidanceCallout tone="blue">
              The same teacher cannot be in two rooms at once, and the same class cannot run two subjects
              simultaneously.
            </GuidanceCallout>
          </GuidanceSection>
          <GuidanceChecklist
            items={[
              { done: classOptions.length > 0, label: "Classes available" },
              { done: teacherOptions.length > 0, label: "Teachers available" },
              { done: subjectOptions.length > 0, label: "Subjects available" },
            ]}
          />
        </>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : (
        <TimetableForm
          onSubmit={handleCreate}
          onCancel={() => navigate(-1)}
          classOptions={classOptions}
          teacherOptions={teacherOptions}
          subjectOptions={subjectOptions}
          initialClassId={initialClassId}
          isLoading={isLoading}
        />
      )}
    </EntityCreateLayout>
  );
}
