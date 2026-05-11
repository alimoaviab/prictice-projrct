"use client";

import { useTimetable } from "../hooks/useTimetable";
import { TimetableGrid } from "../components/TimetableGrid";
import { TimetableRecord, TimetableFormInput, getDayLabel } from "../types/timetable.types";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DataState, TableSkeleton, Badge } from "../../../components/ui";
import { useClasses } from "../../classes/hooks/useClasses";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { TimetableForm } from "../components/TimetableForm";
import { useSearchParams, useRouter } from "next/navigation";

import { TimetableToolbar } from "../components/TimetableToolbar";
import { findTimetableConflicts } from "../utils/conflicts";

export function TimetablePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlClassId = searchParams.get("class_id") || "";
  const [classId, setClassId] = useState<string>(urlClassId);
  const [isCompact, setIsCompact] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId);

  useEffect(() => {
    if (urlClassId) {
      setClassId(urlClassId);
      setSelectedClassId(urlClassId);
    }
  }, [urlClassId]);

  const { state, addTimetable, updateTimetable, deleteTimetable, refresh } = useTimetable(classId ? { class_id: classId } : undefined);
  const { state: classesState } = useClasses();
  const { state: teachersState } = useTeachers();
  const { data: subjectsData } = useSubjects();

  const classOptions = useMemo(() =>
    (classesState.data || []).map(c => ({ id: c._id, label: c.name })),
    [classesState.data]);

  const teacherOptions = useMemo(() =>
    (teachersState.data || []).map(t => ({ id: t._id, label: `${t.first_name} ${t.last_name || ""}`.trim() })),
    [teachersState.data]);

  const subjectOptions = useMemo(() =>
    (subjectsData || []).map(s => ({ id: s._id, label: s.name })),
    [subjectsData]);

  const selectedClass = classesState.data?.find(c => c._id === classId);
  const selectedClassForForm = classesState.data?.find(c => c._id === selectedClassId);

  const conflictsCount = useMemo(() => {
    if (!state.data) return 0;
    let count = 0;
    state.data.forEach(record => {
      if (findTimetableConflicts(state.data!, record).length > 0) {
        count++;
      }
    });
    return count;
  }, [state.data]);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this timetable entry?")) {
      await deleteTimetable(id);
    }
  };

  const handleEdit = (record: TimetableRecord) => {
    router.push(`/admin/timetable/edit/${record._id}`);
  };

  const handleClassChange = (newId: string) => {
    setClassId(newId);
    setSelectedClassId(newId);
    if (newId) {
      router.push(`/admin/timetable?class_id=${newId}`);
    } else {
      router.push("/admin/timetable");
    }
  };

  const handleSave = async (data: TimetableFormInput) => {
    // This is now handled in dedicated pages, but keeping the function 
    // structure if needed for other purposes, though it's likely unused here now.
  };

  return (
    <div className="space-y-8 pb-10">
      <TimetableToolbar 
        classId={classId}
        onClassChange={handleClassChange}
        classOptions={classOptions}
        onNewEntry={() => { router.push(`/admin/timetable/create?class_id=${classId}`); }}
        selectedClass={selectedClass}
        conflictsCount={conflictsCount}
        isCompact={isCompact}
        onCompactToggle={() => setIsCompact(!isCompact)}
      />

      {state.status === "loading" && <TableSkeleton />}
      {state.status === "error" && <DataState variant="error" title="Error" message={state.error} />}

      {state.status === "success" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {(state.data || []).length > 0 ? (
            <TimetableGrid
              records={state.data || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isCompact={isCompact}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-200/60 shadow-xl shadow-slate-200/40">
              <div className="h-20 w-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
                <span className="material-symbols-outlined text-4xl">calendar_add_on</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">No schedule entries found</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-sm text-center leading-relaxed">
                Your timetable workspace is currently empty. Start by creating your first class schedule entry to begin configuration.
              </p>
              <button 
                onClick={() => router.push(`/admin/timetable/create?class_id=${classId}`)}
                className="h-11 px-8 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
              >
                + Create First Entry
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
