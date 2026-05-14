import { useTimetable } from "../hooks/useTimetable";
import { TimetableGrid } from "../components/TimetableGrid";
import { TimetableRecord, TimetableFormInput, getDayLabel } from "../types/timetable.types";
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { DataState, TableSkeleton, Badge } from "@/components/ui";
import { useClasses } from "../../classes/hooks/useClasses";
import { useTeachers } from "../../teachers/hooks/useTeachers";
import { useSubjects } from "../../subjects/hooks/useSubjects";
import { TimetableForm } from "../components/TimetableForm";
import { useSearchParams, useNavigate } from "react-router-dom";

import { TimetableToolbar } from "../components/TimetableToolbar";
import { findTimetableConflicts } from "../utils/conflicts";

import { TimetableDrawer } from "../components/TimetableDrawer";
import { X, Trash2, AlertCircle } from "lucide-react";

export function TimetablePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlClassId = searchParams.get("class_id") || "";
  
  const [classId, setClassId] = useState<string>(urlClassId);
  const [isCompact, setIsCompact] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TimetableRecord | undefined>();

  const { state, addTimetable, updateTimetable, deleteTimetable, refresh } = useTimetable(classId ? { class_id: classId } : undefined);
  const { state: classesState } = useClasses();
  const { state: teachersState } = useTeachers();
  const { data: subjectsData } = useSubjects();

  useEffect(() => {
    if (urlClassId) setClassId(urlClassId);
  }, [urlClassId]);

  const classOptions = useMemo(() =>
    ((classesState.data as any)?.data || (classesState.data as any) || []).map((c: any) => ({ id: c._id, label: c.name })),
    [classesState.data]);

  const teacherOptions = useMemo(() =>
    (teachersState.data || []).map(t => ({ id: t._id, label: `${t.first_name} ${t.last_name || ""}`.trim() })),
    [teachersState.data]);

  const subjectOptions = useMemo(() =>
    (subjectsData || []).map(s => ({ id: s._id, label: s.name })),
    [subjectsData]);

  const selectedClass = ((classesState.data as any)?.data || (classesState.data as any) || []).find((c: any) => c._id === classId);

  const unscheduledSubjects = useMemo(() => {
    if (!selectedClass || !selectedClass.subjects) return [];
    return (selectedClass.subjects as any[]).filter(s => !s.starts_at || !s.ends_at);
  }, [selectedClass]);

  const conflictsCount = useMemo(() => {
    if (!state.data) return 0;
    return state.data.filter(r => findTimetableConflicts(state.data!, r).length > 0).length;
  }, [state.data]);

  const handleDelete = async (id: string) => {
    if (confirm("Permanently remove this session from the schedule?")) {
      const result = await deleteTimetable(id);
      if (result.ok) refresh();
    }
  };

  const handleEdit = (record: TimetableRecord) => {
    navigate(`/admin/timetable/edit/${record._id}`);
  };

  const handleNewEntry = () => {
    const url = classId ? `/admin/timetable/create?class_id=${classId}` : "/admin/timetable/create";
    navigate(url);
  };

  const handleClassChange = (newId: string) => {
    setClassId(newId);
    navigate(newId ? `/admin/timetable?class_id=${newId}` : "/admin/timetable");
  };

  const handleFormSubmit = async (data: TimetableFormInput) => {
    if (editingRecord) {
      await updateTimetable(editingRecord._id, data);
    } else {
      await addTimetable(data);
    }
    refresh();
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-8 pb-20">
      <TimetableToolbar 
        classId={classId}
        onClassChange={handleClassChange}
        classOptions={classOptions}
        onNewEntry={handleNewEntry}
        selectedClass={selectedClass}
        conflictsCount={conflictsCount}
        isCompact={isCompact}
        onCompactToggle={() => setIsCompact(!isCompact)}
      />

      {unscheduledSubjects.length > 0 && (
        <div className="mx-0 p-4 bg-amber-50/50 border border-amber-100 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-[11px] font-black text-amber-900 uppercase tracking-widest">Unscheduled Subjects Detected</h4>
            <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-tighter mt-0.5">
              {unscheduledSubjects.length} subjects in this class have no timing data set. 
              <Link to={`/admin/classes/${classId}/edit`} className="ml-2 underline hover:text-amber-700">Configure Times in Class Settings</Link>
            </p>
          </div>
          <div className="flex -space-x-2">
            {unscheduledSubjects.slice(0, 3).map((s, i) => (
              <div key={i} className="h-8 w-8 rounded-full bg-white border-2 border-amber-50 flex items-center justify-center text-[8px] font-black text-amber-600 shadow-sm">
                {s.name.substring(0, 2).toUpperCase()}
              </div>
            ))}
            {unscheduledSubjects.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-amber-600 shadow-sm">
                +{unscheduledSubjects.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {state.status === "loading" && <TableSkeleton />}
      {state.status === "error" && <DataState variant="error" title="Sync Error" message={state.error} />}

      {state.status === "success" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {(state.data || []).length > 0 ? (
            <TimetableGrid
              records={state.data || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isCompact={isCompact}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-slate-200/60 shadow-2xl shadow-slate-200/30">
              <div className="h-24 w-24 rounded-[2.5rem] bg-blue-50 flex items-center justify-center text-blue-200 mb-8 border border-blue-100 shadow-inner">
                <span className="material-symbols-outlined text-5xl">event_busy</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Workspace Empty</h3>
              <p className="text-sm font-bold text-slate-400 mb-10 max-w-sm text-center leading-relaxed uppercase tracking-widest">
                No institutional sessions configured for this class yet.
              </p>
              <button 
                onClick={handleNewEntry}
                className="h-14 px-10 bg-blue-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[0_15px_30px_rgba(37,99,235,0.3)] active:scale-95"
              >
                + Initialize Schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* Slide Drawer */}
      <TimetableDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRecord ? "Edit Session" : "New Session"}
        description={editingRecord ? `Modifying: ${editingRecord.subject_name}` : "Configure a new institutional lecture"}
      >
        <TimetableForm
          onSubmit={handleFormSubmit}
          onCancel={() => setIsDrawerOpen(false)}
          initialValues={editingRecord}
          initialClassId={classId}
          classOptions={classOptions}
          teacherOptions={teacherOptions}
          subjectOptions={subjectOptions}
        />
      </TimetableDrawer>
    </div>
  );
}
