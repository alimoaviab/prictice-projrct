"use client";

import { useTimetable } from "../hooks/useTimetable";
import { TimetableGrid } from "../components/TimetableGrid";
import { TimetableRecord, TimetableFormInput } from "../types/timetable.types";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { DataState, TableSkeleton, Badge } from "../../../components/ui";
import { useClasses } from "../../classes/hooks/useClasses";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { TimetableForm } from "../components/TimetableForm";
import { useSearchParams, useRouter } from "next/navigation";

export function TimetablePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlClassId = searchParams.get("class_id") || "";
  const [classId, setClassId] = useState<string>(urlClassId);
  const [isAdding, setIsAdding] = useState(false);
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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this timetable entry?")) {
      await deleteTimetable(id);
    }
  };

  const handleEdit = (record: TimetableRecord) => {
    setEditingRecord(record);
    setIsAdding(true);
  };

  const handleWatchClass = (classItemId: string) => {
    setClassId(classItemId);
    setSelectedClassId(classItemId);
    setEditingRecord(null);
    setIsAdding(true);
    router.push(`/admin/timetable?class_id=${classItemId}`);
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

  const handleBack = () => {
    router.push("/admin/classes");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {selectedClass && (
            <button
              onClick={handleBack}
              className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Classes
            </button>
          )}
          <h2 className="text-lg font-bold text-gray-900">
            {selectedClass ? `${selectedClass.name} - Timetable` : "Weekly Timetable"}
          </h2>
          <p className="text-sm text-gray-500">Select a class and set its timetable from the watch button.</p>
        </div>
        <button
          onClick={() => { setEditingRecord(null); setIsAdding(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add Entry
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(classesState.data || []).map((classItem) => (
          <div
            key={classItem._id}
            className={`rounded-2xl border p-5 shadow-sm transition-all ${selectedClassId === classItem._id
                ? "border-blue-500 bg-blue-50/70 shadow-blue-100"
                : "border-gray-200 bg-white hover:shadow-md"
              }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Class</p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">{classItem.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{classItem.description || "No description"}</p>
              </div>
              <Badge variant={classItem.status === "active" ? "success" : "gray"} className="capitalize">
                {classItem.status}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>Room: {classItem.room_number || "—"}</p>
              <p>Subjects: {classItem.subjects?.length || 0}</p>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleWatchClass(classItem._id)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                Watch
              </button>
              <Link
                href={`/admin/timetable?class_id=${classItem._id}`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Open
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col gap-1 flex-1 max-w-xs">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Filter by Class</label>
          <select
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              if (e.target.value) {
                router.push(`/admin/timetable?class_id=${e.target.value}`);
              } else {
                router.push("/admin/timetable");
              }
            }}
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
                {editingRecord
                  ? "Edit Timetable Entry"
                  : selectedClassForForm
                    ? `Add Timetable Entry for ${selectedClassForForm.name}`
                    : "Add Timetable Entry"}
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
                initialClassId={selectedClassId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
