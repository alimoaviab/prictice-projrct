/**
 * Timetable form — single-screen layout (no step wizard).
 *
 * Wire-format contract (verified end-to-end with the Go backend):
 *   {
 *     class_id, subject_id, teacher_id,
 *     day_of_week: <ISO 1..7>,    ← number
 *     period_number: <int>,
 *     start_time: "HH:mm",
 *     end_time:   "HH:mm",
 *     room?:      "..."
 *   }
 *
 * "Everyday (Mon–Fri)" — create only:
 *   The Day of week select exposes a sentinel value `0` meaning "attach
 *   this period to every weekday". The parent page detects 0 and posts
 *   a single sessions[] bulk request to /api/timetable so all five
 *   weekdays land in one transaction (and one conflict check pass).
 *
 * Class is set by the parent page (URL ?class_id) and shown read-only
 * here so admins are never confused about which class they're editing.
 */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import {
  TimetableFormInput,
  TimetableRecord,
  DAY_OPTIONS,
  ServerConflict,
  isoToDayName,
} from "../types/timetable.types";
import { findTimetableConflicts } from "../utils/conflicts";
import { serviceRequest } from "@/services/service-client";
import { useTimetable } from "../hooks/useTimetable";

/** Sentinel for "attach this period to Mon–Sat in one shot". */
export const EVERYDAY_VALUE = 0;
const WEEKDAY_ISOS = [1, 2, 3, 4, 5, 6];

interface ClassOption {
  id: string;
  label: string;
}

interface Props {
  onSubmit: (input: TimetableFormInput) => Promise<{
    ok: boolean;
    error?: {
      message?: string;
      details?: unknown;
    };
  }>;
  onCancel: () => void;
  classOptions?: ClassOption[];
  teacherOptions?: ClassOption[];
  subjectOptions?: ClassOption[];
  initialClassId?: string;
  initialValues?: TimetableRecord;
  isLoading?: boolean;
}

const initialState: TimetableFormInput = {
  class_id: "",
  subject_id: "",
  teacher_id: "",
  day_of_week: 1,
  period_number: 1,
  start_time: "08:00",
  end_time: "08:45",
  room: "",
};

export function TimetableForm({
  onSubmit,
  onCancel,
  classOptions = [],
  teacherOptions = [],
  subjectOptions = [],
  initialClassId = "",
  initialValues,
  isLoading = false,
}: Props) {
  const isEditing = Boolean(initialValues);
  const [form, setForm] = useState<TimetableFormInput>(() => ({
    ...initialState,
    class_id: initialValues?.class_id || initialClassId || "",
    subject_id: initialValues?.subject_id || "",
    teacher_id: initialValues?.teacher_id || "",
    day_of_week: Number(initialValues?.day_of_week) || 1,
    period_number: initialValues?.period_number || 1,
    start_time: initialValues?.start_time || "08:00",
    end_time: initialValues?.end_time || "08:45",
    room: initialValues?.room || "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverConflicts, setServerConflicts] = useState<ServerConflict[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Anchor we scroll to when validation fails so the user never wonders
  // "why did Save do nothing?".
  const topRef = useRef<HTMLDivElement>(null);

  // Subjects for the selected class — narrowing the picker scales when
  // the school has many subjects.
  const [classSubjectOptions, setClassSubjectOptions] = useState<ClassOption[]>([]);
  useEffect(() => {
    let cancelled = false;
    if (!form.class_id) {
      setClassSubjectOptions([]);
      return;
    }
    (async () => {
      const result = await serviceRequest<{ subjects?: any[] }>(
        `/api/classes/${encodeURIComponent(form.class_id)}/subjects`
      );
      if (cancelled) return;
      if (result.ok && result.data?.subjects) {
        setClassSubjectOptions(
          result.data.subjects.map((s: any) => ({
            id: String(s._id ?? s.id ?? s.name ?? ""),
            label: s.name || String(s._id ?? s.id ?? ""),
          }))
        );
      } else {
        setClassSubjectOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.class_id]);

  const subjectsToShow = useMemo(() => {
    if (classSubjectOptions.length === 0) return subjectOptions;
    const byId = new Set(classSubjectOptions.map((s) => s.id));
    return [...classSubjectOptions, ...subjectOptions.filter((s) => !byId.has(s.id))];
  }, [classSubjectOptions, subjectOptions]);

  const { state: timetableState } = useTimetable(
    form.class_id ? { class_id: form.class_id } : undefined
  );

  // For client-side conflict preview: when "Everyday" is selected we
  // synthesise five candidates (Mon..Fri) and aggregate hits across all
  // of them so the admin gets a single combined warning.
  const clientConflicts = useMemo(() => {
    const records = timetableState.data;
    if (!records) return [];
    if (Number(form.day_of_week) === EVERYDAY_VALUE) {
      const seen = new Set<string>();
      const out: ReturnType<typeof findTimetableConflicts> = [];
      for (const iso of WEEKDAY_ISOS) {
        const hits = findTimetableConflicts(
          records,
          { ...form, day_of_week: iso },
          initialValues?._id
        );
        for (const c of hits) {
          const key = `${c.type}-${c.record._id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(c);
        }
      }
      return out;
    }
    return findTimetableConflicts(records, form, initialValues?._id);
  }, [timetableState.data, form, initialValues]);

  const activeClass = classOptions.find((c) => c.id === form.class_id);

  const dayOptions = useMemo(() => {
    const base = DAY_OPTIONS.map((d) => ({ label: d.label, value: String(d.iso) }));
    if (isEditing) return base;
    return [{ label: "Everyday (Mon–Sat)", value: String(EVERYDAY_VALUE) }, ...base];
  }, [isEditing]);

  function setField<K extends keyof TimetableFormInput>(key: K, value: TimetableFormInput[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // When the class changes the previously-selected subject may no
      // longer belong to it. Reset so users don't accidentally save a
      // class/subject mismatch.
      if (key === "class_id" && f.subject_id) {
        next.subject_id = "";
      }
      return next;
    });
    // Clear field-level error as soon as the user touches the field.
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const { [key as string]: _omit, ...rest } = prev;
      return rest;
    });
    setServerConflicts([]);
    setServerError(null);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.class_id) next.class_id = "Class is required";
    if (!form.subject_id) next.subject_id = "Subject is required";
    if (!form.teacher_id) next.teacher_id = "Teacher is required";
    if (!form.start_time) next.start_time = "Start time is required";
    if (!form.end_time) next.end_time = "End time is required";
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      next.end_time = "End time must be after start time";
    }
    if (form.period_number < 1) next.period_number = "Period must be at least 1";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      // eslint-disable-next-line no-console
      console.warn("[TimetableForm] Save blocked by validation:", errors, form);
      return;
    }
    setSaving(true);
    setServerConflicts([]);
    setServerError(null);
    try {
      const result = await onSubmit(form);
      if (!result.ok) {
        const conflicts = extractConflicts(result.error?.details);
        if (conflicts.length > 0) {
          setServerConflicts(conflicts);
          requestAnimationFrame(() => {
            topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          return;
        }
        setServerError(result.error?.message || "Failed to save the period.");
      }
    } finally {
      setSaving(false);
    }
  }

  const isEveryday = Number(form.day_of_week) === EVERYDAY_VALUE;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div ref={topRef} />

      {/* Top-level validation summary. */}
      {Object.keys(errors).length > 0 && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-base text-rose-600 mt-0.5">
              error
            </span>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-rose-700 tracking-tight">
                Fix the highlighted fields to continue
              </p>
              <ul className="mt-1 text-[11px] font-medium text-rose-700/90 space-y-0.5">
                {Object.entries(errors).map(([field, msg]) => (
                  <li key={field}>• {msg}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Class chip — locked to the page's class context */}
      {activeClass && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
          <span className="material-symbols-outlined text-base text-blue-600">school</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 normal-case">Editing class</p>
            <p className="text-[12px] font-bold text-slate-900 tracking-tight truncate">
              {activeClass.label}
            </p>
          </div>
        </div>
      )}

      {!activeClass && (
        <Select
          label="Class"
          value={form.class_id}
          onChange={(e) => setField("class_id", e.target.value)}
          options={[
            { label: "Select a class", value: "" },
            ...classOptions.map((o) => ({ label: o.label, value: o.id })),
          ]}
          error={errors.class_id}
          required
        />
      )}

      {/* Teacher — moved to the top of the form so admins see the
          assignment first, before fiddling with the schedule grid. */}
      <SearchableSelect
        label="Teacher"
        value={form.teacher_id}
        onChange={(id) => setField("teacher_id", id)}
        options={teacherOptions}
        placeholder="Search teacher by name…"
        error={errors.teacher_id}
        required
      />

      <Select
        label="Subject"
        value={form.subject_id}
        onChange={(e) => setField("subject_id", e.target.value)}
        options={[
          { label: form.class_id ? "Select a subject" : "Select a class first", value: "" },
          ...subjectsToShow.map((o) => ({ label: o.label, value: o.id })),
        ]}
        error={errors.subject_id}
        disabled={!form.class_id}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Day of week"
          value={String(form.day_of_week)}
          onChange={(e) => setField("day_of_week", Number(e.target.value))}
          options={dayOptions}
        />
        <Input
          label="Period"
          type="number"
          min={1}
          max={20}
          value={form.period_number}
          onChange={(e) =>
            setField("period_number", Math.max(1, parseInt(e.target.value || "1", 10)))
          }
          error={errors.period_number}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Start time"
          type="time"
          value={form.start_time}
          onChange={(e) => setField("start_time", e.target.value)}
          error={errors.start_time}
          required
        />
        <Input
          label="End time"
          type="time"
          value={form.end_time}
          onChange={(e) => setField("end_time", e.target.value)}
          error={errors.end_time}
          required
        />
      </div>

      <Input
        label="Room (optional)"
        placeholder="e.g. R-102, Science Lab"
        value={form.room || ""}
        onChange={(e) => setField("room", e.target.value)}
      />

      {clientConflicts.length > 0 && (
        <ConflictBanner
          conflicts={clientConflicts.map(
            (c) =>
              `${c.type}: ${c.record.subject_name} on ${isoToDayName(c.record.day_of_week)}`
          )}
          tone="warning"
        />
      )}

      {/* Live summary */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 normal-case">Summary</p>
        <p className="text-[12px] font-bold text-slate-900 tracking-tight">
          {form.subject_id
            ? subjectsToShow.find((s) => s.id === form.subject_id)?.label
            : "—"}
          <span className="font-medium text-slate-500"> · </span>
          {isEveryday ? "Mon–Sat" : isoToDayName(form.day_of_week)}{" "}
          {form.start_time && form.end_time
            ? `· ${form.start_time}–${form.end_time}`
            : ""}
        </p>
        <p className="text-[11px] font-medium text-slate-500">
          {form.teacher_id
            ? teacherOptions.find((t) => t.id === form.teacher_id)?.label
            : "Pick a teacher"}
          {form.room ? ` · ${form.room}` : ""}
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-[12px] font-bold text-rose-700">
          {serverError}
        </div>
      )}

      {serverConflicts.length > 0 && (
        <ConflictBanner
          tone="error"
          conflicts={serverConflicts.map((c) => c.message)}
          title="Server detected schedule conflicts"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={saving || isLoading}
          className="flex-1"
        >
          {saving
            ? "Saving…"
            : initialValues
            ? "Update period"
            : isEveryday
            ? "Save for Mon–Sat"
            : "Save period"}
        </Button>
      </div>
    </form>
  );
}

/**
 * The service-client wraps the whole API response under `error.details`.
 * Conflicts can therefore appear at either:
 *   - error.details.error.details.conflicts  (full envelope passthrough)
 *   - error.details.conflicts                (handler-detail passthrough)
 */
function extractConflicts(details: unknown): ServerConflict[] {
  if (!details || typeof details !== "object") return [];
  const direct = (details as { conflicts?: ServerConflict[] }).conflicts;
  if (Array.isArray(direct)) return direct;
  const nested = (details as { error?: { details?: { conflicts?: ServerConflict[] } } })
    .error?.details?.conflicts;
  if (Array.isArray(nested)) return nested;
  return [];
}

function ConflictBanner({
  conflicts,
  tone = "warning",
  title,
}: {
  conflicts: string[];
  tone?: "warning" | "error";
  title?: string;
}) {
  const cls =
    tone === "error"
      ? "bg-rose-50 border-rose-200 text-rose-700"
      : "bg-amber-50 border-amber-200 text-amber-700";
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${cls}`}>
      <div className="flex items-start gap-2">
        <span className="material-symbols-outlined text-base mt-0.5">warning</span>
        <div className="flex-1">
          <p className="text-[11px] font-bold tracking-tight">
            {title ??
              `${conflicts.length} ${
                conflicts.length === 1 ? "conflict" : "conflicts"
              } detected`}
          </p>
          <ul className="mt-1 text-[11px] font-medium space-y-0.5">
            {conflicts.slice(0, 4).map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight searchable single-select. Avoids hauling in a third-party
 * library while still scaling to hundreds of teachers.
 */
function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  options: ClassOption[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.id === value);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 100);
    return options.filter((o) => o.label.toLowerCase().includes(q)).slice(0, 100);
  }, [options, search]);

  return (
    <div className="space-y-1">
      <label className="text-[11px] font-bold text-slate-500 normal-case px-1 block">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div
        className={`rounded-xl border bg-white ${
          error
            ? "border-rose-400 ring-2 ring-rose-500/10"
            : "border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/10"
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="material-symbols-outlined text-base text-slate-400">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={selected ? selected.label : placeholder ?? "Search…"}
            className="flex-1 bg-transparent border-none outline-none p-0 text-[13px] font-medium placeholder:text-slate-400"
          />
          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSearch("");
              }}
              className="text-slate-400 hover:text-rose-600"
              aria-label="Clear selection"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}
        </div>
        <ul className="max-h-[180px] overflow-y-auto border-t border-slate-100">
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-[11px] font-bold text-slate-400 normal-case text-center">
              No matches
            </li>
          ) : (
            filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    value === o.id
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="text-[12px] font-bold truncate">{o.label}</span>
                  {value === o.id && (
                    <span className="material-symbols-outlined text-base text-blue-600">check</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
      {error && (
        <span className="text-[10px] font-bold text-rose-600 px-1 block" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
