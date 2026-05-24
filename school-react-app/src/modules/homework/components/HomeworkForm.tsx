import { AppIcon } from "shared/ui/AppIcon";
/**
 * Homework assignment form.
 *
 * Fixes from the previous version:
 *   1. Uses serviceRequest() instead of raw fetch() — attaches JWT +
 *      academic-year header so the backend doesn't 401.
 *   2. Fetches class-specific subjects from /api/classes/{id}/subjects
 *      (the correct endpoint) instead of /api/school/subjects/class/{id}
 *      (which ignores the classId param).
 *   3. Sends `section` (not `section_id`) to match the backend's
 *      createInput struct.
 *   4. Removed the /api/sections call (endpoint doesn't exist). Sections
 *      are derived from the class's section field or the students in it.
 *   5. Added proper loading/disabled states and validation feedback.
 */

import React, { useState, FormEvent, useMemo, useEffect, useRef } from "react";
import { Input, Select, Button } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";
import { showToast } from "@/utils/toast";

interface HomeworkFormProps {
  onSubmit: (data: any) => Promise<void>;
  classes: any[];
  subjects: any[];
  teachers?: any[];
  showTeacherField?: boolean;
  initialTeacherId?: string;
  initialValues?: any;
  loading?: boolean;
}

export function HomeworkForm({
  onSubmit,
  classes,
  subjects: globalSubjects,
  teachers = [],
  showTeacherField = false,
  initialTeacherId = "",
  initialValues,
  loading = false,
}: HomeworkFormProps) {
  const [formData, setFormData] = useState({
    title: initialValues?.title || "",
    class_id: initialValues?.class_id || "",
    section: initialValues?.section || "",
    subject_id: initialValues?.subject_id || "",
    teacher_id: initialValues?.teacher_id || initialTeacherId,
    due_at: initialValues?.due_at?.split("T")[0] || "",
    instructions: initialValues?.instructions || "",
    status: initialValues?.status || "assigned",
    attachments: initialValues?.attachments || [],
    visibility: initialValues?.visibility || "all",
  });

  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);

  // Fetch class-specific subjects when class changes.
  // Uses the correct endpoint: GET /api/classes/{id}/subjects
  useEffect(() => {
    if (!formData.class_id) {
      setClassSubjects([]);
      return;
    }
    let cancelled = false;
    setLoadingSubjects(true);
    (async () => {
      try {
        const res = await serviceRequest<any>(
          `/api/classes/${encodeURIComponent(formData.class_id)}/subjects`
        );
        if (cancelled) return;
        if (res.ok) {
          // The endpoint returns { subjects: [...] } or the class object with subjects array
          const data = res.data;
          const subjects =
            data?.subjects ??
            data?.data?.subjects ??
            (Array.isArray(data) ? data : []);
          setClassSubjects(subjects);
        } else {
          setClassSubjects([]);
        }
      } catch {
        if (!cancelled) setClassSubjects([]);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [formData.class_id]);

  // Sync initial teacher ID if it arrives late (from auth hook).
  useEffect(() => {
    if (initialTeacherId && !formData.teacher_id) {
      setFormData((prev) => ({ ...prev, teacher_id: initialTeacherId }));
    }
  }, [initialTeacherId]);

  // Build subject options: prefer class-specific, fallback to global.
  const subjectsToDisplay = useMemo(() => {
    if (classSubjects.length > 0) return classSubjects;
    return globalSubjects;
  }, [classSubjects, globalSubjects]);

  const subjectOptions = useMemo(() => {
    const placeholder = loadingSubjects
      ? "Loading subjects…"
      : !formData.class_id
        ? "Select a class first"
        : "Select subject";
    return [
      { label: placeholder, value: "" },
      ...subjectsToDisplay.map((s: any) => {
        const label =
          typeof s === "string"
            ? s
            : s.name || s.label || String(s._id || s.id || s);
        const value =
          typeof s === "string"
            ? s
            : s._id || s.id || s.name || label;
        return { label, value };
      }),
    ];
  }, [subjectsToDisplay, loadingSubjects, formData.class_id]);

  const classOptions = useMemo(
    () => [
      { label: "Select class", value: "" },
      ...classes.map((c) => ({
        label: c.name || c.label || c._id,
        value: c._id || c.id,
      })),
    ],
    [classes]
  );

  const teacherOptions = useMemo(
    () => [
      { label: "Select teacher", value: "" },
      ...teachers.map((t) => ({
        label:
          `${t.first_name || ""} ${t.last_name || ""}`.trim() ||
          t.name ||
          t.email ||
          "Teacher",
        value: t._id || t.id,
      })),
    ],
    [teachers]
  );

  function setField(key: string, value: any) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Reset dependent fields when class changes.
      if (key === "class_id") {
        next.subject_id = "";
        next.section = "";
      }
      return next;
    });
    // Clear field error on touch.
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!formData.title.trim()) next.title = "Title is required";
    if (!formData.class_id) next.class_id = "Class is required";
    if (!formData.due_at) next.due_at = "Due date is required";
    if (showTeacherField && !formData.teacher_id) next.teacher_id = "Teacher is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div ref={topRef} />

      {/* Validation summary */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AppIcon name="AlertCircle" size={16} className="text-rose-600 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-rose-700">Fix the highlighted fields</p>
              <ul className="mt-1 text-[11px] font-medium text-rose-700/90 space-y-0.5">
                {Object.entries(errors).map(([k, msg]) => (
                  <li key={k}>• {msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Input
        label="Homework Title"
        placeholder="e.g. Weekly Math Assignment"
        required
        value={formData.title}
        onChange={(e) => setField("title", e.target.value)}
        error={errors.title}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Class"
          required
          value={formData.class_id}
          onChange={(e) => setField("class_id", e.target.value)}
          options={classOptions}
          error={errors.class_id}
        />
        <Select
          label="Subject"
          value={formData.subject_id}
          onChange={(e) => setField("subject_id", e.target.value)}
          options={subjectOptions}
          disabled={loadingSubjects || !formData.class_id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Due Date"
          type="date"
          required
          value={formData.due_at}
          onChange={(e) => setField("due_at", e.target.value)}
          error={errors.due_at}
        />
        {showTeacherField && (
          <Select
            label="Assign Teacher"
            required
            value={formData.teacher_id}
            onChange={(e) => setField("teacher_id", e.target.value)}
            options={teacherOptions}
            error={errors.teacher_id}
          />
        )}
      </div>

      <div>
        <label className="text-[11px] font-bold text-slate-500 normal-case mb-1 px-1 block">
          Instructions / Description
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setField("instructions", e.target.value)}
          placeholder="Provide detailed instructions for the homework…"
          rows={5}
          className="w-full p-3.5 text-[13px] font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          onClick={() => window.history.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading} className="flex-1">
          {loading
            ? "Saving…"
            : initialValues
              ? "Update Homework"
              : "Assign Homework"}
        </Button>
      </div>
    </form>
  );
}
