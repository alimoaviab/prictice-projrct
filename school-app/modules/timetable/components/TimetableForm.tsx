"use client";

import { FormEvent, useState, useEffect, useMemo } from "react";
import { Button, Input, Select, FormSection } from "../../../components/ui";
import { TimetableFormInput, DAY_OPTIONS, TimetableRecord, DayOfWeek } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts } from "../utils/conflicts";
import { useTimetable } from "../hooks/useTimetable";

interface TimetableFormProps {
  onCreate: (input: TimetableFormInput) => Promise<unknown>;
  classOptions?: Array<{ id: string; label: string }>;
  teacherOptions?: Array<{ id: string; label: string }>;
  subjectOptions?: Array<{ id: string; label: string }>;
  isLoading?: boolean;
  initialClassId?: string;
  initialValues?: TimetableFormInput;
}

export function TimetableForm({
  onCreate,
  classOptions = [],
  teacherOptions = [],
  subjectOptions = [],
  isLoading = false,
  initialClassId = "",
  initialValues
}: TimetableFormProps) {
  const [form, setForm] = useState<TimetableFormInput>(initialValues || {
    class_id: initialClassId,
    teacher_id: "",
    subject_id: "",
    day_of_week: "Monday",
    period_number: 1,
    start_time: "08:00",
    end_time: "09:00",
    room: ""
  });

  const { state: timetableState } = useTimetable(form.class_id ? { class_id: form.class_id } : undefined);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialClassId && !initialValues) {
      setForm((current) => ({ ...current, class_id: initialClassId }));
    }
  }, [initialClassId, initialValues]);

  const conflicts = useMemo(() => {
    if (!timetableState.data) return [];
    return findTimetableConflicts(timetableState.data, form);
  }, [timetableState.data, form]);

  const previewRecord = useMemo(() => {
    const subject = subjectOptions.find(s => s.id === form.subject_id);
    const teacher = teacherOptions.find(t => t.id === form.teacher_id);
    const className = classOptions.find(c => c.id === form.class_id);

    return {
      _id: "preview",
      class_id: form.class_id,
      class_name: className?.label || "Preview Class",
      subject_id: form.subject_id,
      subject_name: subject?.label || "Subject Name",
      teacher_id: form.teacher_id,
      teacher_name: teacher?.label || "Teacher Name",
      day_of_week: DAY_OPTIONS.findIndex(d => d.value === form.day_of_week) + 1,
      period_number: form.period_number,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as TimetableRecord;
  }, [form, subjectOptions, teacherOptions, classOptions]);

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!form.class_id) newErrors.class_id = "Class is required";
    if (!form.teacher_id) newErrors.teacher_id = "Teacher is required";
    if (!form.subject_id) newErrors.subject_id = "Subject is required";
    if (!form.day_of_week) newErrors.day_of_week = "Day is required";
    if (!form.period_number) newErrors.period_number = "Period is required";
    if (!form.start_time) newErrors.start_time = "Start time is required";
    if (!form.end_time) newErrors.end_time = "End time is required";

    if (form.start_time && form.end_time) {
      const [startH, startM] = form.start_time.split(":").map(Number);
      const [endH, endM] = form.end_time.split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;
      if (endTotal <= startTotal) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      showToast("Please fix errors in the form", "error");
      return;
    }

    if (conflicts.length > 0) {
      if (!confirm(`Warning: There are ${conflicts.length} conflicts with this schedule. Do you still want to proceed?`)) {
        return;
      }
    }

    setSaving(true);
    try {
      const result = await onCreate(form);
      if (result) {
        showToast("Success!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col xl:flex-row gap-10">
        <div className="flex-1 space-y-8">
           <FormSection title="Academic Details" description="Define the subject and staff assigned.">
             <div className="grid grid-cols-1 gap-6">
                <Select
                  label="Class Section"
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  options={[{ label: "Select class", value: "" }, ...classOptions.map(o => ({ label: o.label, value: o.id }))]}
                  error={errors.class_id}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Select
                      label="Subject"
                      value={form.subject_id}
                      onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                      options={[{ label: "Select subject", value: "" }, ...subjectOptions.map(o => ({ label: o.label, value: o.id }))]}
                      error={errors.subject_id}
                      required
                    />

                    <Select
                      label="Teacher / Lecturer"
                      value={form.teacher_id}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                      options={[{ label: "Select teacher", value: "" }, ...teacherOptions.map(o => ({ label: o.label, value: o.id }))]}
                      error={errors.teacher_id}
                      required
                    />
                </div>
             </div>
           </FormSection>

           <FormSection title="Timing & Location" description="When and where will this take place?">
             <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Select
                      label="Day of Week"
                      value={form.day_of_week}
                      onChange={(e) => setForm({ ...form, day_of_week: e.target.value as any })}
                      options={DAY_OPTIONS.map(d => ({ label: d.label, value: d.value }))}
                      error={errors.day_of_week}
                    />

                    <Input
                      label="Period Number"
                      type="number"
                      min="1"
                      max="20"
                      value={form.period_number}
                      onChange={(e) => setForm({ ...form, period_number: parseInt(e.target.value) || 1 })}
                      error={errors.period_number}
                      required
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Start Time"
                      type="time"
                      value={form.start_time}
                      onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                      error={errors.start_time}
                      required
                    />

                    <Input
                      label="End Time"
                      type="time"
                      value={form.end_time}
                      onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                      error={errors.end_time}
                      required
                    />
                </div>

                <Input
                  label="Room / Hall Number"
                  placeholder="e.g., Science Lab 2"
                  value={form.room || ""}
                  onChange={(e) => setForm({ ...form, room: e.target.value })}
                />
             </div>
           </FormSection>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200 border-dashed">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Live Schedule Preview</h4>
              <div className="max-w-[300px] mx-auto">
                 <PeriodCard slot={previewRecord} conflicts={conflicts} isCompact={false} />
              </div>

              {conflicts.length > 0 && (
                <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <span className="material-symbols-outlined text-sm font-bold">warning</span>
                        <p className="text-[11px] font-black uppercase tracking-widest">Conflict Detected</p>
                    </div>
                    <p className="text-[10px] font-bold text-red-500/80 leading-relaxed uppercase tracking-tight">
                        {conflicts[0].type === 'teacher' && "This teacher is already assigned to another class during this time."}
                        {conflicts[0].type === 'room' && "The selected room is already occupied during this time."}
                        {conflicts[0].type === 'class' && "This class already has a different subject scheduled at this time."}
                    </p>
                </div>
              )}
           </div>

           <div className="bg-blue-600/5 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                 <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs font-black text-blue-700 uppercase tracking-tight">Pro Tip</p>
                    <p className="text-[10px] font-bold text-blue-600/70 leading-relaxed uppercase tracking-tight">
                        Use the "Auto-Generate" feature in the main workspace to fill gaps in the schedule based on subject requirements.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-8 border-t border-slate-100 gap-4">
        <Button
          variant="secondary"
          type="button"
          className="h-14 px-10 rounded-2xl text-[11px] font-black uppercase tracking-widest"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || isLoading}
          className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-xl shadow-blue-600/20 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          {saving ? "Processing..." : "Save Schedule Entry"}
        </Button>
      </div>
    </form>
  );
}
