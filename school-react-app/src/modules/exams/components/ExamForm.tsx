/**
 * Exam create form.
 *
 * Posts ONE exam with a subjects[] payload. The backend stores a single
 * row, the list page renders a single card. Per-subject max-marks live
 * inside each subjects[] entry; there is no global max field.
 *
 * UX:
 *   - Subjects render as wrapping chip pills. Picking a chip adds the
 *     subject to the summary card with a default max-marks of 100.
 *   - Class dropdown filters to classes that have at least one
 *     enrolled student — scheduling an exam for an empty class is
 *     meaningless.
 *   - All inputs are compact (h-9) to match the rest of the system.
 */

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Select } from "@/components/ui";
import { ServiceResult } from "@/types/core";
import { serviceRequest } from "@/services/service-client";
import { ExamFormInput, ExamSubjectInput } from "../types/exam.types";

interface SubjectOption {
  label: string;
  value: string;
}

const DEFAULT_MAX_MARKS = 100;

export function ExamForm({
  classes,
  onCreate,
  showFooter = true,
}: {
  classes: any[];
  onCreate: (input: ExamFormInput) => Promise<ServiceResult<unknown>>;
  showFooter?: boolean;
}) {
  const [form, setForm] = useState<ExamFormInput>(() => ({
    academic_year_id:
      typeof window !== "undefined" ? window.localStorage.getItem("academic_year_id") || "" : "",
    class_id: "",
    teacher_id: "",
    title: "",
    type: "exam",
    starts_at: "",
    status: "scheduled",
    description: "",
    subjects: [],
  }));

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [classSubjectOptions, setClassSubjectOptions] = useState<SubjectOption[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Eligible classes: enrolled student count > 0.
  const eligibleClasses = (classes || []).filter((c) => {
    const count = c?.student_count ?? c?.enrolled_students ?? 0;
    return Number(count) > 0;
  });

  const selectedClass = eligibleClasses.find(
    (c) => c.id === form.class_id || c._id === form.class_id
  );

  useEffect(() => {
    let cancelled = false;
    async function loadClassSubjects(classId: string) {
      if (!classId) {
        setClassSubjectOptions([]);
        return;
      }
      setLoadingSubjects(true);
      try {
        const result = await serviceRequest<{ subjects?: any[] }>(
          `/api/classes/${classId}/subjects`
        );
        if (!result.ok) throw new Error(result.error.message || "Failed to load class subjects");
        const subjects = (result.data?.subjects ?? [])
          .map((subject: any) => ({
            label: subject.name || String(subject._id),
            value: subject.name || String(subject._id),
          }))
          .filter((option) => Boolean(option.value));
        if (!cancelled) setClassSubjectOptions(subjects);
      } catch {
        if (!cancelled) setClassSubjectOptions([]);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    }
    void loadClassSubjects(form.class_id);
    return () => {
      cancelled = true;
    };
  }, [form.class_id]);

  const availableSubjects: SubjectOption[] = useMemo(
    () =>
      classSubjectOptions.length > 0
        ? classSubjectOptions
        : (selectedClass?.subjects || [])
            .map((s: any) => {
              if (typeof s === "string") return { label: s, value: s };
              const value = s.name || s.subject || s.id || s._id;
              return { label: s.name || String(value), value: String(value) };
            })
            .filter((option: any) => Boolean(option?.value)),
    [classSubjectOptions, selectedClass]
  );

  function setField<K extends keyof ExamFormInput>(key: K, value: ExamFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const { [key as string]: _omit, ...rest } = prev;
      return rest;
    });
  }

  function toggleSubject(value: string, label: string) {
    setForm((prev) => {
      const exists = prev.subjects.find((s) => s.subject_id === value);
      if (exists) {
        return { ...prev, subjects: prev.subjects.filter((s) => s.subject_id !== value) };
      }
      return {
        ...prev,
        subjects: [
          ...prev.subjects,
          {
            subject_id: value,
            subject_name: label,
            max_marks: DEFAULT_MAX_MARKS,
          },
        ],
      };
    });
    setErrors((prev) => {
      if (!prev.subjects && !prev[`marks_${value}`]) return prev;
      const { subjects: _a, [`marks_${value}`]: _b, ...rest } = prev;
      return rest;
    });
  }

  function setMaxFor(subjectId: string, max: number) {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) =>
        s.subject_id === subjectId ? { ...s, max_marks: Math.max(0, max) } : s
      ),
    }));
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = "Exam title is required";
    if (!form.class_id) next.class_id = "Class is required";
    if (!form.starts_at) next.starts_at = "Date is required";
    if (form.subjects.length === 0) next.subjects = "Select at least one subject";
    for (const s of form.subjects) {
      if (!s.max_marks || s.max_marks < 1) {
        next[`marks_${s.subject_id}`] = `Enter max marks for ${s.subject_name || s.subject_id}`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const isValid =
    form.title.trim() &&
    form.class_id &&
    form.starts_at &&
    form.subjects.length > 0 &&
    form.subjects.every((s) => s.max_marks > 0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await onCreate(form);
      if (result.ok) {
        // Reset to defaults so admin can chain another exam.
        setForm({
          academic_year_id:
            typeof window !== "undefined"
              ? window.localStorage.getItem("academic_year_id") || ""
              : "",
          class_id: "",
          teacher_id: "",
          title: "",
          type: "exam",
          starts_at: "",
          status: "scheduled",
          description: "",
          subjects: [],
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "bg-white border-slate-200 h-9 focus:border-slate-900 focus:ring-slate-900/5 transition-all text-sm";

  return (
    <form id="exam-form-quick" onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-5">
        {/* Class + date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Target Class"
            value={form.class_id}
            onChange={(e) => {
              const classId = e.target.value;
              const cls = eligibleClasses.find(
                (c) => c.id === classId || c._id === classId
              );
              setField("class_id", classId);
              setField("teacher_id", cls?.class_teacher?.id || "");
              // Reset subjects when class changes — they may not exist
              // on the new class.
              setForm((prev) => ({ ...prev, subjects: [] }));
            }}
            options={[
              { label: "Select target class", value: "" },
              ...eligibleClasses.map((o) => ({
                label: `${o.name}${o.student_count ? ` (${o.student_count} students)` : ""}`,
                value: o.id || o._id,
              })),
            ]}
            error={errors.class_id}
            required
            className={inputCls}
          />
          <Input
            label="Examination Date"
            type="date"
            value={form.starts_at}
            onChange={(e) => setField("starts_at", e.target.value)}
            error={errors.starts_at}
            required
            leftIcon={
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            }
            className={inputCls}
          />
        </div>

        {eligibleClasses.length === 0 && classes.length > 0 && (
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-[11px] font-bold text-amber-700">
            No classes have enrolled students yet. Add students before scheduling an exam.
          </div>
        )}

        {/* Subject chip picker */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 normal-case mb-2">
            Subjects{" "}
            {form.subjects.length > 0 && (
              <span className="text-slate-400 font-medium">
                · {form.subjects.length} selected
              </span>
            )}
          </label>
          {loadingSubjects ? (
            <div className="flex items-center gap-2 text-slate-400 py-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              <span className="text-xs">Loading class subjects…</span>
            </div>
          ) : availableSubjects.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map((s) => {
                const active = !!form.subjects.find((x) => x.subject_id === s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSubject(s.value, s.label)}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-bold transition-all ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {active && (
                      <span className="material-symbols-outlined text-[13px]">check</span>
                    )}
                    {s.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-2 italic">
              {form.class_id ? "No subjects found for this class." : "Pick a class first."}
            </div>
          )}
          {errors.subjects && (
            <p className="mt-2 text-[10px] text-red-500 font-bold">{errors.subjects}</p>
          )}
        </div>

        {/* Selected subjects with per-subject max-marks */}
        {form.subjects.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 normal-case tracking-tight">
                Selected subjects · enter max marks per subject
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                Total max:{" "}
                {form.subjects.reduce((sum, s) => sum + (s.max_marks || 0), 0)} marks
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {form.subjects.map((s) => {
                const error = errors[`marks_${s.subject_id}`];
                return (
                  <div key={s.subject_id} className="flex items-center gap-3 px-3 py-2">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      menu_book
                    </span>
                    <span className="flex-1 text-[12px] font-bold text-slate-800 truncate">
                      {s.subject_name || s.subject_id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={s.max_marks}
                        onChange={(e) =>
                          setMaxFor(
                            s.subject_id,
                            parseInt(e.target.value || "0", 10)
                          )
                        }
                        className={`h-7 w-16 rounded-md border bg-white text-center text-[12px] font-bold outline-none transition-all ${
                          error
                            ? "border-rose-400 ring-2 ring-rose-500/10"
                            : "border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-slate-400">marks</span>
                      <button
                        type="button"
                        onClick={() =>
                          toggleSubject(s.subject_id, s.subject_name || s.subject_id)
                        }
                        className="ml-1 text-slate-400 hover:text-rose-600 transition-colors"
                        aria-label={`Remove ${s.subject_name}`}
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Input
          label="Examination Title"
          placeholder="e.g., Mid-Term Assessment"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          error={errors.title}
          required
          leftIcon={<span className="material-symbols-outlined text-[16px]">title</span>}
          className={inputCls}
        />

        <div>
          <label className="block text-[11px] font-bold text-slate-700 normal-case mb-1.5">
            Exam Description &amp; Instructions
          </label>
          <textarea
            placeholder="Add syllabus coverage or student instructions…"
            value={form.description || ""}
            onChange={(e) => setField("description", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-800 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {showFooter && (
        <div className="-mx-6 -mb-6 mt-8 flex items-center justify-between border-t border-slate-100 bg-slate-50/40 px-6 py-3">
          <Link
            to="/admin/exams"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[10px] font-bold normal-case text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900"
          >
            Discard Changes
          </Link>
          <Button
            type="submit"
            disabled={saving || !isValid}
            className="h-9 px-6 text-[10px] font-bold normal-case shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Scheduling…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {form.subjects.length > 1
                  ? `Schedule exam · ${form.subjects.length} subjects`
                  : "Schedule exam"}
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
