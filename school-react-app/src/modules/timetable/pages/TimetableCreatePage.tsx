/**
 * /admin/timetable/create — wraps TimetableForm in the platform's
 * shared EntityCreateLayout (same chrome the Academic Year and other
 * "create-entity" pages use). Spacing, typography rhythm, blue-600
 * accents are inherited from the design system.
 *
 * The page only does:
 *   - load classes / teachers / subjects in parallel
 *   - delegate the actual save to addTimetable() (which sends the
 *     correct ISO-numeric payload to the Go backend)
 *   - on success, navigate back to /admin/timetable scoped to the
 *     class the user just edited
 *   - on conflict (409 from server), let the form render the inline
 *     conflict banner — no toast, since the admin needs the detail
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
import { TimetableForm, EVERYDAY_VALUE } from "../components/TimetableForm";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableFormInput } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { bindRefresh, publish } from "@/services/data-bus";
import { createTimetableBulk } from "../services/timetable.service";

export function TimetableCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get("class_id") || undefined;
  const { addTimetable } = useTimetable();

  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string; section?: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; first_name?: string; last_name?: string; name?: string }>>();
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
      const result = await serviceRequest<any>("/api/teachers");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load teachers");
      const raw = result.data;
      return Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
    });
  }, [runTeachers]);

  const loadSubjects = useCallback(() => {
    return runSubjects(async () => {
      const result = await serviceRequest<any>("/api/subjects");
      if (!result.ok) throw new Error(result.error?.message || "Failed to load subjects");
      const raw = result.data;
      return Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
    });
  }, [runSubjects]);

  useEffect(() => {
    void loadClasses().catch(() => {});
    void loadTeachers().catch(() => {});
    void loadSubjects().catch(() => {});
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
    // "Everyday (Mon–Fri)" — fan out into a single bulk request so the
    // server runs one conflict pass over all five sessions.
    if (Number(input.day_of_week) === EVERYDAY_VALUE) {
      const result = await createTimetableBulk({
        class_id: input.class_id,
        subject_id: input.subject_id,
        teacher_id: input.teacher_id,
        period_number: input.period_number,
        start_time: input.start_time,
        end_time: input.end_time,
        room: input.room,
        days: [1, 2, 3, 4, 5, 6],
      });
      if (result.ok) {
        showToast("Period saved for Mon–Sat.", "success");
        publish("timetable");
        const dest = input.class_id
          ? `/admin/timetable?class_id=${encodeURIComponent(input.class_id)}`
          : "/admin/timetable";
        navigate(dest);
      } else if (result.error?.code !== "CONFLICT") {
        showToast(result.error?.message || "Failed to save period.", "error");
      }
      return result as { ok: boolean; error?: { message?: string; details?: unknown } };
    }

    const result = await addTimetable(input);
    if (result.ok) {
      showToast("Period saved.", "success");
      const dest = input.class_id
        ? `/admin/timetable?class_id=${encodeURIComponent(input.class_id)}`
        : "/admin/timetable";
      navigate(dest);
    } else if (result.error?.code !== "CONFLICT") {
      // CONFLICT → form renders inline banner. Anything else → toast.
      showToast(result.error?.message || "Failed to save period.", "error");
    }
    return result as { ok: boolean; error?: { message?: string; details?: unknown } };
  }

  if (
    classState.status === "error" ||
    teacherState.status === "error" ||
    subjectState.status === "error"
  ) {
    return (
      <DataState
        variant="error"
        title="Couldn't load the form data"
        message={classState.error || teacherState.error || subjectState.error}
      />
    );
  }

  const classOptions = (classState.data ?? []).map((c) => ({
    id: c._id,
    label: c.section ? `${c.name} (${c.section})` : c.name,
  }));
  const teacherOptions = (teacherState.data ?? []).map((t) => ({
    id: t._id,
    label:
      (t as any).name ||
      `${t.first_name ?? ""} ${t.last_name ?? ""}`.trim() ||
      t._id,
  }));
  const subjectOptions = (subjectState.data ?? []).map((s) => ({ id: s._id, label: s.name }));

  return (
    <EntityCreateLayout
      backTo={
        initialClassId
          ? `/admin/timetable?class_id=${encodeURIComponent(initialClassId)}`
          : "/admin/timetable"
      }
      backLabel="Back to timetable"
      eyebrow="Timetable Composer"
      icon="schedule"
      title="New period"
      subtitle="Add a single weekly slot — class, subject, teacher, room and time."
      asideTitle="What happens next"
      aside={
        <>
          <GuidanceSection title="Conflict detection">
            We check teacher, room and class overlaps in real time as you fill
            the form. The server runs the same check before saving.
          </GuidanceSection>
          <GuidanceSection title="Wire format">
            <GuidanceCallout tone="blue">
              Day of week is sent as an ISO number (1=Mon, 7=Sun). Pick
              "Everyday (Mon–Sat)" to attach the same period to all six
              weekdays in one save.
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
        <div className="space-y-3">
          <Skeleton className="h-11 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
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
