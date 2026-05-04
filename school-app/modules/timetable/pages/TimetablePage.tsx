"use client";

import { useTimetable } from "../hooks/useTimetable";
import { TimetableGrid } from "../components/TimetableGrid";
import { TimetableRecord, TimetableFormInput } from "../types/timetable.types";
import { useState, useMemo } from "react";
import { DataState, TableSkeleton, ConfirmModal } from "../../../components/ui";
import { useClasses } from "../../classes/hooks/useClasses";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { TimetableForm } from "../components/TimetableForm";
import { findTimetableConflicts } from "../utils/conflicts";

export function TimetablePage() {
  const [classId, setClassId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimetableRecord | null>(null);

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this timetable entry?")) {
      await deleteTimetable(id);
    }
  };

  const handleEdit = (record: TimetableRecord) => {
    setEditingRecord(record);
    setIsAdding(true);
  };

  const handleSave = async (data: TimetableFormInput) => {
    const conflicts = findTimetableConflicts(state.data || [], data, editingRecord?._id);

    if (conflicts.length > 0) {
      alert("Conflict detected! This class, subject, or room is already occupied during this time.");
      return;
    }

    if (editingRecord) {
      await updateTimetable(editingRecord._id, data);
    } else {
      await addTimetable(data);
    }
    setIsAdding(false);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Weekly Timetable</h2>
          <p className="text-sm text-gray-500">Manage class schedules and teacher assignments</p>
        </div>
        <button
          onClick={() => { setEditingRecord(null); setIsAdding(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Entry
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col gap-1 flex-1 max-w-xs">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Filter by Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
          >
            <option value="">All Classes</option>
            {classOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {state.status === "loading" && <TableSkeleton />}
      {state.status === "error" && <DataState variant="error" title="Error" message={state.error} />}

      {state.status === "success" && (
        <TimetableGrid
          records={state.data || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRecord ? "Edit Timetable Entry" : "Add Timetable Entry"}
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <TimetableForm
                onCreate={handleSave}
                classOptions={classOptions}
                teacherOptions={teacherOptions}
                subjectOptions={subjectOptions}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
