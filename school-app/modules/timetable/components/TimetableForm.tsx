"use client";

import { FormEvent, useState, useEffect, useMemo } from "react";
import { Button, Input, Select, FormSection } from "../../../components/ui";
import { TimetableFormInput, DAY_OPTIONS, TimetableRecord, DayOfWeek } from "../types/timetable.types";
import { showToast } from "@/utils/toast";
import { PeriodCard } from "./PeriodCard";
import { findTimetableConflicts } from "../utils/conflicts";
import { useTimetable } from "../hooks/useTimetable";
import { serviceRequest } from "../../../services/service-client";

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
  const [classSubjectOptions, setClassSubjectOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [loadingClassSubjects, setLoadingClassSubjects] = useState(false);

  useEffect(() => {
    if (initialClassId && !initialValues) {
      setForm((current) => ({ ...current, class_id: initialClassId }));
    }
  }, [initialClassId, initialValues]);

  useEffect(() => {
    let cancelled = false;

    async function loadClassSubjects(classId: string) {
      if (!classId) {
        setClassSubjectOptions([]);
        return;
      }

      setLoadingClassSubjects(true);
      try {
        const result = await serviceRequest<{ subjects?: any[] }>(`/api/classes/${classId}/subjects`);
        if (!result.ok) {
          throw new Error(result.error.message || "Failed to load class subjects");
        }

        const subjects = (result.data?.subjects ?? [])
          .map((subject: any) => ({
            id: String(subject._id ?? subject.id ?? subject.name ?? ""),
            label: subject.name || String(subject._id ?? subject.id ?? "")
          }))
          .filter((option: { id: string; label: string }) => Boolean(option.id));

        if (!cancelled) {
          setClassSubjectOptions(subjects);
        }
      } catch {
        if (!cancelled) {
          setClassSubjectOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingClassSubjects(false);
        }
      }
    }

    void loadClassSubjects(form.class_id);

    return () => {
      cancelled = true;
    };
  }, [form.class_id]);

  const subjectsToDisplay = useMemo(() => {
    if (classSubjectOptions.length === 0) return subjectOptions;
    
    // Combine both, avoiding duplicates
    const combined = [...classSubjectOptions];
    const seenIds = new Set(classSubjectOptions.map(s => s.id));
    
    subjectOptions.forEach(globalSub => {
      if (!seenIds.has(globalSub.id)) {
        combined.push(globalSub);
      }
    });
    
    return combined;
  }, [classSubjectOptions, subjectOptions]);

  const conflicts = useMemo(() => {
    if (!timetableState.data) return [];
    return findTimetableConflicts(timetableState.data, form);
  }, [timetableState.data, form]);

  const previewRecord = useMemo(() => {
    const subject = subjectsToDisplay.find(s => s.id === form.subject_id);
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
  }, [form, subjectsToDisplay, teacherOptions, classOptions]);

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
      if (result && typeof result === "object" && "ok" in result && result.ok) {
        showToast("Success!", "success");
      }
    } catch (err: any) {
      showToast(err.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Form Fields */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Class Section"
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value, subject_id: "" })}
              options={[{ label: "Select class", value: "" }, ...classOptions.map(o => ({ label: o.label, value: o.id }))]}
              error={errors.class_id}
              required
              className="h-11 text-sm rounded-xl"
            />
            <Select
              label="Subject"
              value={form.subject_id}
              onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
              options={[
                { label: loadingClassSubjects ? "Loading subjects..." : "Select subject", value: "" },
                ...subjectsToDisplay.map(o => ({ label: o.label, value: o.id }))
              ]}
              disabled={!form.class_id || loadingClassSubjects}
              error={errors.subject_id}
              required
              className="h-11 text-sm rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Teacher / Lecturer"
              value={form.teacher_id}
              onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
              options={[{ label: "Select teacher", value: "" }, ...teacherOptions.map(o => ({ label: o.label, value: o.id }))]}
              error={errors.teacher_id}
              required
              className="h-11 text-sm rounded-xl"
            />
            <Select
              label="Day of Week"
              value={form.day_of_week}
              onChange={(e) => setForm({ ...form, day_of_week: e.target.value as any })}
              options={DAY_OPTIONS.map(d => ({ label: d.label, value: d.value }))}
              error={errors.day_of_week}
              className="h-11 text-sm rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Period #"
              type="number"
              min="1"
              max="20"
              value={form.period_number}
              onChange={(e) => setForm({ ...form, period_number: parseInt(e.target.value) || 1 })}
              error={errors.period_number}
              required
              className="h-11 text-sm rounded-xl"
            />
            <Input
              label="Start Time"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              error={errors.start_time}
              required
              className="h-11 text-sm rounded-xl px-3"
            />
            <Input
              label="End Time"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              error={errors.end_time}
              required
              className="h-11 text-sm rounded-xl px-3"
            />
          </div>

          <Input
            label="Room / Hall"
            placeholder="e.g., Science Lab 2"
            value={form.room || ""}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="h-11 text-sm rounded-xl"
          />
        </div>

        {/* Sidebar Preview */}
        <div className="lg:col-span-5 border-l border-slate-100 pl-6 flex flex-col justify-center bg-slate-50/50 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            <h4 className="text-[10px] font-bold text-slate-500 normal-case ">Entry Intelligence</h4>
          </div>
          
          <div className="w-full">
            <PeriodCard slot={previewRecord} conflicts={conflicts} isCompact={false} />
          </div>

          {conflicts.length > 0 ? (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100/50">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <p className="text-[9px] font-bold normal-case ">Conflict detected</p>
              </div>
              <p className="text-[10px] font-bold text-red-500/80 leading-relaxed normal-case tracking-tight">
                {conflicts[0].type} overlaps found at this time slot.
              </p>
            </div>
          ) : (
             <div className="mt-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-[14px]">check_circle</span>
                <p className="text-[9px] font-bold text-emerald-600 normal-case ">Schedule Clear</p>
             </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-100 gap-3">
        <Button
          variant="secondary"
          type="button"
          className="h-10 px-8 rounded-xl text-[10px] font-bold normal-case "
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={saving || isLoading}
          className="h-10 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 text-[10px] font-bold normal-case  active:scale-95 transition-all"
        >
          {saving ? "Processing..." : "Create Schedule Entry"}
        </Button>
      </div>
    </form>
  );
}
