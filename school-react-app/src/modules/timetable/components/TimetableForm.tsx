import { FormEvent, useState, useEffect, useMemo } from "react";
import { Button, Input, Select, FormSection } from "@/components/ui";
import { TimetableFormInput, DAY_OPTIONS, TimetableRecord, DayOfWeek } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts } from "../utils/conflicts";
import { useTimetable } from "../hooks/useTimetable";
import { serviceRequest } from "@/services/service-client";

interface TimetableFormProps {
  onSubmit: (input: TimetableFormInput) => Promise<unknown>;
  classOptions?: Array<{ id: string; label: string }>;
  teacherOptions?: Array<{ id: string; label: string }>;
  subjectOptions?: Array<{ id: string; label: string }>;
  isLoading?: boolean;
  initialClassId?: string;
  initialValues?: TimetableRecord;
  onCancel: () => void;
}

export function TimetableForm({
  onSubmit,
  classOptions = [],
  teacherOptions = [],
  subjectOptions = [],
  isLoading = false,
  initialClassId = "",
  initialValues,
  onCancel
}: TimetableFormProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<TimetableFormInput>({
    class_id: initialValues?.class_id || initialClassId || "",
    teacher_id: initialValues?.teacher_id || "",
    subject_id: initialValues?.subject_id || "",
    day_of_week: initialValues ? (DAY_OPTIONS[Number(initialValues.day_of_week) - 1]?.value as DayOfWeek || "Monday") : "Monday",
    period_number: initialValues?.period_number || 1,
    start_time: initialValues?.start_time || "08:00",
    end_time: initialValues?.end_time || "09:00",
    room: initialValues?.room || ""
  });

  const { state: timetableState } = useTimetable(form.class_id ? { class_id: form.class_id } : undefined);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [classSubjectOptions, setClassSubjectOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [loadingClassSubjects, setLoadingClassSubjects] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadClassSubjects(classId: string) {
      if (!classId) return;
      setLoadingClassSubjects(true);
      try {
        const result = await serviceRequest<{ subjects?: any[] }>(`/api/classes/${classId}/subjects`);
        if (result.ok && !cancelled) {
          const subjects = (result.data?.subjects ?? []).map((s: any) => ({
            id: String(s._id ?? s.id ?? s.name ?? ""),
            label: s.name || String(s._id ?? s.id ?? "")
          }));
          setClassSubjectOptions(subjects);
        }
      } catch {
        if (!cancelled) setClassSubjectOptions([]);
      } finally {
        if (!cancelled) setLoadingClassSubjects(false);
      }
    }
    loadClassSubjects(form.class_id);
    return () => { cancelled = true; };
  }, [form.class_id]);

  const subjectsToDisplay = useMemo(() => {
    if (classSubjectOptions.length === 0) return subjectOptions;
    const combined = [...classSubjectOptions];
    const seenIds = new Set(classSubjectOptions.map(s => s.id));
    subjectOptions.forEach(s => { if (!seenIds.has(s.id)) combined.push(s); });
    return combined;
  }, [classSubjectOptions, subjectOptions]);

  const conflicts = useMemo(() => {
    if (!timetableState.data) return [];
    return findTimetableConflicts(timetableState.data, form, initialValues?._id);
  }, [timetableState.data, form, initialValues]);

  const previewRecord = useMemo(() => {
    const subject = subjectsToDisplay.find(s => s.id === form.subject_id);
    const teacher = teacherOptions.find(t => t.id === form.teacher_id);
    const className = classOptions.find(c => c.id === form.class_id);

    return {
      _id: "preview",
      class_id: form.class_id,
      class_name: className?.label || "Selected Class",
      subject_id: form.subject_id,
      subject_name: subject?.label || "Subject",
      teacher_id: form.teacher_id,
      teacher_name: teacher?.label || "Teacher",
      day_of_week: DAY_OPTIONS.findIndex(d => d.value === form.day_of_week) + 1,
      period_number: form.period_number,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as TimetableRecord;
  }, [form, subjectsToDisplay, teacherOptions, classOptions]);

  const validateStep = (s: number) => {
    const newErrors: Record<string, string> = {};
    if (s === 1) {
      if (!form.class_id) newErrors.class_id = "Class is required";
      if (!form.subject_id) newErrors.subject_id = "Subject is required";
    } else if (s === 2) {
      if (!form.day_of_week) newErrors.day_of_week = "Day is required";
      if (!form.start_time) newErrors.start_time = "Start time is required";
      if (!form.end_time) newErrors.end_time = "End time is required";
      if (form.start_time && form.end_time) {
        const start = parseInt(form.start_time.replace(':', ''));
        const end = parseInt(form.end_time.replace(':', ''));
        if (end <= start) newErrors.end_time = "End time must be after start time";
      }
    } else if (s === 3) {
      if (!form.teacher_id) newErrors.teacher_id = "Teacher is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    setSaving(true);
    try {
      await onSubmit(form);
      onCancel(); 
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Steps Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-100'}`} />
          </div>
        ))}
      </div>

      <div className="flex-1 space-y-8">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Class & Subject</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select the class and course material</p>
            </div>
            <div className="space-y-6 pt-4">
              <Select
                label="Class Section"
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value, subject_id: "" })}
                options={[{ label: "Choose class segment...", value: "" }, ...classOptions.map(o => ({ label: o.label, value: o.id }))]}
                error={errors.class_id}
                required
                className="h-12 text-xs font-bold rounded-xl"
              />
              <Select
                label="Subject Name"
                value={form.subject_id}
                onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                options={[
                  { label: loadingClassSubjects ? "Querying subjects..." : "Select specific subject", value: "" },
                  ...subjectsToDisplay.map(o => ({ label: o.label, value: o.id }))
                ]}
                disabled={!form.class_id || loadingClassSubjects}
                error={errors.subject_id}
                required
                className="h-12 text-xs font-bold rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Schedule Details</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Define the day and time slot</p>
            </div>
            <div className="space-y-6 pt-4">
              <Select
                label="Weekly Day"
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: e.target.value as any })}
                options={DAY_OPTIONS.map(d => ({ label: d.label, value: d.value }))}
                className="h-12 text-xs font-bold rounded-xl"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  error={errors.start_time}
                  required
                  className="h-12 text-xs font-bold rounded-xl"
                />
                <Input
                  label="End Time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  error={errors.end_time}
                  required
                  className="h-12 text-xs font-bold rounded-xl"
                />
              </div>
              <Input
                label="Period / Session Index"
                type="number"
                min="1"
                value={form.period_number}
                onChange={(e) => setForm({ ...form, period_number: parseInt(e.target.value) || 1 })}
                className="h-12 text-xs font-bold rounded-xl"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">Resource Assignment</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assign teacher and physical location</p>
            </div>
            <div className="space-y-6 pt-4">
              <Select
                label="Lead Teacher"
                value={form.teacher_id}
                onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                options={[{ label: "Select assigned teacher", value: "" }, ...teacherOptions.map(o => ({ label: o.label, value: o.id }))]}
                error={errors.teacher_id}
                required
                className="h-12 text-xs font-bold rounded-xl"
              />
              <Input
                label="Classroom / Hall"
                placeholder="e.g., Room 102, Science Lab"
                value={form.room || ""}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="h-12 text-xs font-bold rounded-xl"
              />
              
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Live Preview</p>
                <PeriodCard slot={previewRecord} conflicts={conflicts} isCompact={false} />
              </div>

              {conflicts.length > 0 && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[14px] text-red-600 font-black">warning</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-tight">Scheduling Conflict</p>
                    <p className="text-[10px] font-bold text-red-600/80 leading-relaxed mt-0.5">
                      The {conflicts[0].type} is already booked for this time slot. Saving will create an overlap.
                    </p>
                  </div>
                </div>
              )}
              
              {conflicts.length === 0 && (
                <div className="mt-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500 text-[14px] font-black">check_circle</span>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Schedule Clear</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 flex items-center gap-3 pt-6 border-t border-slate-50">
        <Button
          variant="secondary"
          type="button"
          onClick={step > 1 ? () => setStep(step - 1) : onCancel}
          className="h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          {step === 1 ? "Cancel" : "Previous"}
        </Button>
        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="h-12 flex-1 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            Continue
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={saving || isLoading}
            className="h-12 flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
          >
            {saving ? "Syncing..." : (initialValues ? "Update Entry" : "Save Entry")}
          </Button>
        )}
      </div>
    </form>
  );
}
