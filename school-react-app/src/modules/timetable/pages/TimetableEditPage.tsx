import { useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Card, Skeleton, DataState } from "@/components/ui";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { serviceRequest } from "@/services/service-client";
import { TimetableForm } from "../components/TimetableForm";
import { useTimetable } from "../hooks/useTimetable";
import { TimetableFormInput, TimetableRecord, getDayLabel } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { findTimetableConflicts } from "../utils/conflicts";
import * as service from "../services/timetable.service";

interface TimetableEditPageProps {
  id: string;
}

export function TimetableEditPage({ id }: TimetableEditPageProps) {
  const navigate = useNavigate();
  const { state: timetableState, updateTimetable } = useTimetable();

  const { state: recordState, run: runRecord } = useSafeAsync<TimetableRecord>();
  const { state: classState, run: runClasses } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: teacherState, run: runTeachers } = useSafeAsync<Array<{ _id: string; name: string }>>();
  const { state: subjectState, run: runSubjects } = useSafeAsync<Array<{ _id: string; name: string }>>();

  const loadDependencies = useCallback(() => {
    return Promise.all([
      runRecord(() => service.getTimetable(id).then(r => {
          if (!r.ok) throw new Error(r.error?.message);
          return r.data!;
      })),
      runClasses(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/classes");
        if (!result.ok) throw new Error(result.error.message || "Failed to load classes");
        return result.data;
      }),
      runTeachers(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/teachers");
        if (!result.ok) throw new Error(result.error.message || "Failed to load teachers");
        return result.data;
      }),
      runSubjects(async () => {
        const result = await serviceRequest<Array<{ _id: string; name: string }>>("/api/subjects");
        if (!result.ok) throw new Error(result.error.message || "Failed to load subjects");
        return result.data;
      }),
    ]);
  }, [id, runRecord, runClasses, runTeachers, runSubjects]);

  useEffect(() => {
    void loadDependencies().catch(() => { });
  }, [loadDependencies]);

  const isLoading =
    recordState.status === "loading" ||
    classState.status === "loading" ||
    teacherState.status === "loading" ||
    subjectState.status === "loading" ||
    recordState.status === "idle";

  async function handleUpdate(input: TimetableFormInput) {
    try {
      // Exclude current record from conflict check
      const otherRecords = (timetableState.data || []).filter(r => r._id !== id);
      const conflicts = findTimetableConflicts(otherRecords, input);
      
      if (conflicts.length > 0) {
        return {
          ok: false,
          error: { message: "Conflict detected! Same class or same teacher cannot be assigned in the same time slot." }
        };
      }

      const result = await updateTimetable(id, input);
      if (result.ok) {
        showToast("Timetable entry updated successfully", "success");
        navigate("/admin/timetable");

      } else {
        showToast(result.error?.message || "Failed to update entry", "error");
      }
      return result;
    } catch (error: any) {
      console.error("[TimetableEditPage] Error:", error);
      showToast(error.message || "Failed to update entry", "error");
      return { ok: false, error: { message: error.message } };
    }
  }

  if (recordState.status === "error" || classState.status === "error" || teacherState.status === "error" || subjectState.status === "error") {
    return (
      <DataState
        variant="error"
        title="Failed to load data"
        message={recordState.error || classState.error || teacherState.error || subjectState.error}
      />
    );
  }

  const classOptions = ((classState.data as any)?.data || classState.data || []).map((o: any) => ({ id: o._id, label: o.name }));
  const teacherOptions = (teacherState.data ?? []).map(o => ({ id: o._id, label: o.name }));
  const subjectOptions = (subjectState.data ?? []).map(o => ({ id: o._id, label: o.name }));

  return (
    <div className="max-w-full mx-auto space-y-6">
      <Link
        to="/admin/timetable"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <span className="material-symbols-outlined text-lg">arrow_back</span>
        Back to Timetable
      </Link>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Edit Timetable Entry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Modify the schedule entry for this class, subject, and teacher.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : (
          <TimetableForm
            onSubmit={handleUpdate}
            onCancel={() => navigate(-1)}
            classOptions={classOptions}
            teacherOptions={teacherOptions}
            subjectOptions={subjectOptions}
            isLoading={isLoading}
            initialValues={recordState.data}
          />
        )}
      </Card>
    </div>
  );
}
