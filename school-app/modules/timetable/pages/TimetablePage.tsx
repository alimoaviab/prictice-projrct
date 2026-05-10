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
  const [isAdding, setIsAdding] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimetableRecord | null>(null);
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
    setEditingRecord(record);
    setIsAdding(true);
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
    if (editingRecord) {
      await updateTimetable(editingRecord._id, data);
    } else {
      await addTimetable(data);
    }
    setIsAdding(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <TimetableToolbar 
        classId={classId}
        onClassChange={handleClassChange}
        classOptions={classOptions}
        onNewEntry={() => { setEditingRecord(null); setIsAdding(true); }}
        selectedClass={selectedClass}
        conflictsCount={conflictsCount}
        isCompact={isCompact}
        onCompactToggle={() => setIsCompact(!isCompact)}
      />

      {state.status === "loading" && <TableSkeleton />}
      {state.status === "error" && <DataState variant="error" title="Error" message={state.error} />}

      {state.status === "success" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TimetableGrid
            records={state.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isCompact={isCompact}
          />
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                   <span className="material-symbols-outlined text-[24px]">
                     {editingRecord ? "edit_calendar" : "add_task"}
                   </span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    {editingRecord ? "Edit Entry" : "New Schedule Entry"}
                  </h3>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                    {selectedClassForForm ? selectedClassForForm.name : "Academic Scheduling"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAdding(false)} 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-600 border border-slate-200 transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8">
              <TimetableForm
                onCreate={handleSave}
                classOptions={classOptions}
                teacherOptions={teacherOptions}
                subjectOptions={subjectOptions}
                initialClassId={selectedClassId}
                initialValues={editingRecord ? {
                   class_id: editingRecord.class_id,
                   subject_id: editingRecord.subject_id,
                   teacher_id: editingRecord.teacher_id,
                   day_of_week: getDayLabel(editingRecord.day_of_week) as any,
                   period_number: editingRecord.period_number,
                   start_time: editingRecord.start_time,
                   end_time: editingRecord.end_time,
                   room: editingRecord.room,
                   section: editingRecord.section
                } : undefined}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
