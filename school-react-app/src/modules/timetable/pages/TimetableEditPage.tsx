/**
 * /admin/timetable/edit/:id — uses the same EntityCreateLayout as the
 * create page so the experience is symmetrical.
 *
 * `id` is the synthetic cell id `{timetableId}_{day}_{period}` that the
 * grid uses; the Go handler parses it and updates only the matching
 * session.
 */

import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NEVER_EMPTY = (): boolean => false;
import {
  Skeleton,
  DataState,
  EntityCreateLayout,
  GuidanceSection,
  GuidanceCallout,
} from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TimetableForm } from "../components/TimetableForm";
import { useTimetable } from "../hooks/useTimetable";
import {
  TimetableFormInput,
  TimetableRecord,
} from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import * as service from "../services/timetable.service";

interface TimetableEditPageProps {
  id: string;
}

export function TimetableEditPage({ id }: TimetableEditPageProps) {
  const navigate = useNavigate();
  const { updateTimetable } = useTimetable();

  // NEVER_EMPTY must be a stable reference — an inline () => false
  // here triggers a re-render loop via useSafeAsync's useCallback deps.
  const { state: recordState, run: runRecord } = useSafeAsync<TimetableRecord>(NEVER_EMPTY);
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string; section?: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; first_name?: string; last_name?: string; name?: string }>>();
  const { state: subjectState, run: runSubjects } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const load = useCallback(() => {
    return Promise.all([
      runRecord(async () => {
        const r = await service.getTimetable(id);
        if (!r.ok) throw new Error(r.error?.message || "Period not found");
        return r.data!;
      }),
      runClasses(async () => {
        const r = await serviceRequest<any>("/api/classes");
        if (!r.ok) throw new Error(r.error?.message || "Failed to load classes");
        return Array.isArray(r.data) ? r.data : Array.isArray((r.data as any)?.data) ? (r.data as any).data : [];
      }),
      runTeachers(async () => {
        const r = await serviceRequest<any>("/api/teachers");
        if (!r.ok) throw new Error(r.error?.message || "Failed to load teachers");
        return Array.isArray(r.data) ? r.data : Array.isArray((r.data as any)?.data) ? (r.data as any).data : [];
      }),
      runSubjects(async () => {
        const r = await serviceRequest<any>("/api/subjects");
        if (!r.ok) throw new Error(r.error?.message || "Failed to load subjects");
        return Array.isArray(r.data) ? r.data : Array.isArray((r.data as any)?.data) ? (r.data as any).data : [];
      }),
    ]);
  }, [id, runRecord, runClasses, runTeachers, runSubjects]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const isLoading =
    recordState.status === "loading" ||
    recordState.status === "idle" ||
    classState.status === "loading" ||
    teacherState.status === "loading" ||
    subjectState.status === "loading";

  if (
    recordState.status === "error" ||
    classState.status === "error" ||
    teacherState.status === "error" ||
    subjectState.status === "error"
  ) {
    return (
      <DataState
        variant="error"
        title="Couldn't load this period"
        message={
          recordState.error || classState.error || teacherState.error || subjectState.error
        }
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

  async function handleUpdate(input: TimetableFormInput) {
    const result = await updateTimetable(id, input);
    if (result.ok) {
      showToast("Period updated.", "success");
      const dest = input.class_id
        ? `/admin/timetable?class_id=${encodeURIComponent(input.class_id)}`
        : "/admin/timetable";
      navigate(dest);
    } else if (result.error?.code !== "CONFLICT") {
      showToast(result.error?.message || "Failed to update period.", "error");
    }
    return result as { ok: boolean; error?: { message?: string; details?: unknown } };
  }

  return (
    <EntityCreateLayout
      backTo="/admin/timetable"
      backLabel="Back to timetable"
      eyebrow="Timetable Composer"
      icon="schedule"
      title="Edit period"
      subtitle="Adjust the time, teacher, room or subject for this slot."
      asideTitle="Live conflict checks"
      aside={
        <>
          <GuidanceSection title="What you can change">
            Subject, day, time, period, teacher and room. The class is fixed —
            move the period to another class by deleting and re-creating.
          </GuidanceSection>
          <GuidanceSection title="Be careful with rooms">
            <GuidanceCallout tone="amber">
              Reusing a room at the same time as another class is flagged as a
              room conflict and rejected.
            </GuidanceCallout>
          </GuidanceSection>
        </>
      }
    >
      {isLoading || !recordState.data ? (
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
          onSubmit={handleUpdate}
          onCancel={() => navigate(-1)}
          classOptions={classOptions}
          teacherOptions={teacherOptions}
          subjectOptions={subjectOptions}
          initialValues={recordState.data}
          isLoading={isLoading}
        />
      )}
    </EntityCreateLayout>
  );
}
