"use client";

import { FormEvent, useState, useEffect } from "react";
import { Button, Input, Select } from "../../../components/ui";
import { TimetableFormInput, DAY_OPTIONS } from "../types/timetable.types";
import { showToast } from "@/utils/toast";

interface TimetableFormProps {
  onCreate: (input: TimetableFormInput) => Promise<unknown>;
  classOptions?: Array<{ id: string; label: string }>;
  teacherOptions?: Array<{ id: string; label: string }>;
  subjectOptions?: Array<{ id: string; label: string }>;
  isLoading?: boolean;
  initialClassId?: string;
}

export function TimetableForm({
  onCreate,
  classOptions = [],
  teacherOptions = [],
  subjectOptions = [],
  isLoading = false,
  initialClassId = ""
}: TimetableFormProps) {
  const [form, setForm] = useState<TimetableFormInput>({
    class_id: initialClassId,
    teacher_id: "",
    subject_id: "",
    day_of_week: "Monday",
    period_number: 1,
    start_time: "08:00",
    end_time: "09:00",
    room: ""
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialClassId) {
      setForm((current) => ({ ...current, class_id: initialClassId }));
    }
  }, [initialClassId]);

  // academic year removed from form inputs

  function validate() {
    const newErrors: Record<string, string> = {};

    if (!form.class_id) newErrors.class_id = "Class is required";
    if (!form.teacher_id) newErrors.teacher_id = "Teacher is required";
    if (!form.subject_id) newErrors.subject_id = "Subject is required";
    if (!form.day_of_week) newErrors.day_of_week = "Day is required";
    if (!form.period_number) newErrors.period_number = "Period is required";
    if (!form.start_time) newErrors.start_time = "Start time is required";
    if (!form.end_time) newErrors.end_time = "End time is required";

    // Check end time is after start time
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

    setSaving(true);
    try {
      console.log("[TimetableForm] Submitting:", form);
      const result = await onCreate(form);

      if (result && typeof result === "object" && "ok" in result && (result as any).ok) {
        showToast("Timetable entry created successfully", "success");
        setForm({
          class_id: initialClassId,
          teacher_id: "",
          subject_id: "",
          day_of_week: "Monday",
          period_number: 1,
          start_time: "08:00",
          end_time: "09:00",
          room: ""
        });
      } else {
        const error = result && typeof result === "object" && "error" in result
          ? (result as any).error?.message || "Failed to create entry"
          : "Failed to create timetable entry";
        showToast(error, "error");
      }
    } catch (err: any) {
      console.error("[TimetableForm] Error:", err);
      showToast(err.message || "An error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Class, Teacher, Subject Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Select
          label="Class"
          value={form.class_id}
          onChange={(e) => setForm({ ...form, class_id: e.target.value })}
          options={[{ label: "Select class", value: "" }, ...classOptions.map(o => ({ label: o.label, value: o.id }))]}
          error={errors.class_id}
          required
          disabled={isLoading}
        />

        <Select
          label="Teacher"
          value={form.teacher_id}
          onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
          options={[{ label: "Select teacher", value: "" }, ...teacherOptions.map(o => ({ label: o.label, value: o.id }))]}
          error={errors.teacher_id}
          required
          disabled={isLoading}
        />

        <Select
          label="Subject"
          value={form.subject_id}
          onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
          options={[{ label: "Select subject", value: "" }, ...subjectOptions.map(o => ({ label: o.label, value: o.id }))]}
          error={errors.subject_id}
          required
          disabled={isLoading}
        />
      </div>

      {/* Academic Year and Day Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Academic year removed from form */}

        <Select
          label="Day"
          value={form.day_of_week}
          onChange={(e) => setForm({ ...form, day_of_week: e.target.value as any })}
          options={DAY_OPTIONS.map(d => ({ label: d.label, value: d.value }))}
          error={errors.day_of_week}
          disabled={isLoading}
        />

        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-2">Period Number</label>
          <input
            type="number"
            min="1"
            max="10"
            value={form.period_number}
            onChange={(e) => setForm({ ...form, period_number: parseInt(e.target.value) || 1 })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
            required
          />
          {errors.period_number && <p className="text-red-600 text-xs mt-1">{errors.period_number}</p>}
        </div>
      </div>

      {/* Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-2">Start Time</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
            required
          />
          {errors.start_time && <p className="text-red-600 text-xs mt-1">{errors.start_time}</p>}
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-2">End Time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
            required
          />
          {errors.end_time && <p className="text-red-600 text-xs mt-1">{errors.end_time}</p>}
        </div>

        <div className="flex flex-col lg:col-span-2">
          <label className="block text-sm font-medium mb-2">Room (Optional)</label>
          <input
            type="text"
            placeholder="e.g., A101"
            value={form.room || ""}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          type="submit"
          disabled={saving || isLoading}
          className="w-full md:w-auto min-w-[200px]"
        >
          {saving ? "Creating..." : "Create Timetable Entry"}
        </Button>
      </div>
    </form>
  );
}
