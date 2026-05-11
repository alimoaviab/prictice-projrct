"use client";

import React, { useState, FormEvent } from "react";
import { Input, Select, Button } from "../../../components/ui";
import { showToast } from "../../../utils/toast";

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
  subjects: initialSubjects,
  teachers = [],
  showTeacherField = false,
  initialTeacherId = "",
  initialValues,
  loading = false
}: HomeworkFormProps) {
  const [formData, setFormData] = useState({
    title: initialValues?.title || "",
    class_id: initialValues?.class_id || "",
    subject_id: initialValues?.subject_id || "",
    teacher_id: initialValues?.teacher_id || initialTeacherId,
    due_at: initialValues?.due_at || "",
    instructions: initialValues?.instructions || "",
    status: initialValues?.status || "assigned"
  });

  const [classSubjects, setClassSubjects] = useState<any[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Fetch subjects when class changes
  React.useEffect(() => {
    if (formData.class_id) {
      setLoadingSubjects(true);
      (async () => {
        try {
          const res = await fetch(`/api/school/subjects/class/${formData.class_id}`, { credentials: "include" });
          if (!res.ok) {
            setClassSubjects([]);
            return;
          }
          const data = await res.json();
          const subjects =
            (Array.isArray(data?.subjects) && data.subjects) ||
            (Array.isArray(data?.data?.subjects) && data.data.subjects) ||
            [];
          setClassSubjects(subjects);
        } catch (err) {
          console.error("Failed to fetch subjects for class", err);
          setClassSubjects([]);
        } finally {
          setLoadingSubjects(false);
        }
      })();
    } else {
      setClassSubjects([]);
    }
  }, [formData.class_id]);

  // Sync initial teacher ID if it changes (e.g. from auth hook)
  React.useEffect(() => {
    if (initialTeacherId && !formData.teacher_id) {
      setFormData(prev => ({ ...prev, teacher_id: initialTeacherId }));
    }
  }, [initialTeacherId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (showTeacherField && !formData.teacher_id) {
      showToast("Please select a teacher", "error");
      return;
    }
    await onSubmit(formData);
  };

  const classOptions = [
    { label: "Select Class", value: "" },
    ...classes.map(c => ({ label: c.name || c.label, value: c.id || c._id }))
  ];

  // Use class-specific subjects if available, otherwise fallback to initialSubjects
  const subjectsToDisplay = classSubjects.length > 0 ? classSubjects : initialSubjects;

  const subjectOptions = [
    { label: loadingSubjects ? "Loading Subjects..." : "Select Subject", value: "" },
    ...subjectsToDisplay.map(s => {
      const label = typeof s === 'string' ? s : (s.name || s.label || String(s._id || s.id || s));
      const value = typeof s === 'string' ? s : (s.id || s._id || label);
      return { label, value };
    })
  ];

  const teacherOptions = [
    { label: "Select Teacher", value: "" },
    ...teachers.map(t => ({ 
      label: `${t.first_name || ""} ${t.last_name || ""}`.trim() || t.name || t.email || "Teacher", 
      value: t.id || t._id 
    }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Input
            label="Homework Title"
            placeholder="e.g. Weekly Math Assignment"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="h-14 text-base rounded-2xl"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Class Section"
              required
              value={formData.class_id}
              onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
              options={classOptions}
              className="h-14 text-base rounded-2xl"
            />
            <Select
              label="Subject"
              required
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              options={subjectOptions}
              disabled={loadingSubjects || !formData.class_id}
              className="h-14 text-base rounded-2xl"
            />
          </div>

          {showTeacherField && (
            <Select
              label="Assign Teacher"
              required
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              options={teacherOptions}
              className="h-14 text-base rounded-2xl"
            />
          )}

          <Input
            label="Due Date"
            type="date"
            required
            value={formData.due_at}
            onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
            className="h-14 text-base rounded-2xl px-4"
          />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col h-full">
            <label className="text-[11px] font-bold text-slate-500 normal-case  mb-2 px-1">
              Instructions / Description
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Provide detailed instructions for the homework..."
              className="flex-1 w-full p-6 text-base bg-slate-50 border border-slate-100 rounded-[2rem] focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all min-h-[200px] resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={() => window.history.back()}
          className="h-14 px-8 rounded-2xl text-[11px] font-bold normal-case "
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-14 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-600/20 text-[11px] font-bold normal-case  active:scale-95 transition-all"
        >
          {loading ? "Saving..." : (initialValues ? "Update Homework" : "Assign Homework")}
        </Button>
      </div>
    </form>
  );
}
