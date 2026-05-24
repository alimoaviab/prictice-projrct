import { AppIcon } from "shared/ui/AppIcon";
import { useState, useMemo, useEffect } from "react";
import { BehaviorFormInput } from "../types/behavior.types";
import { Button, Input, Select } from "@/components/ui";
import { serviceRequest } from "@/services/service-client";

interface Props {
  initial?: Partial<BehaviorFormInput>;
  onSubmit: (data: BehaviorFormInput) => void;
  onCancel: () => void;
  students: { _id: string; name: string; class_id?: string }[];
  classes: { _id: string; name: string }[];
}

function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record._id === "string") return record._id.trim();
    if (typeof record.id === "string") return record.id.trim();
    if (typeof record.$oid === "string") return record.$oid.trim();
  }
  return String(value).trim();
}

export default function BehaviorForm({ initial, onSubmit, onCancel, students, classes }: Props) {
  const [form, setForm] = useState<BehaviorFormInput>({
    student_id: initial?.student_id ?? "",
    class_id: initial?.class_id ?? "",
    category: initial?.category ?? "discipline",
    incident_type: initial?.incident_type ?? "discipline",
    severity: (initial?.severity as any) ?? "low",
    description: initial?.description ?? "",
    action_taken: initial?.action_taken ?? "",
    status: initial?.status ?? "open",
    warning_count: initial?.warning_count ?? 1,
    parent_notified: initial?.parent_notified ?? false,
    notes: initial?.notes ?? "",
    attachments: initial?.attachments ?? []
  });
  const [classStudents, setClassStudents] = useState<Array<{ _id: string; name: string; class_id?: string }>>([]);
  const [loadingClassStudents, setLoadingClassStudents] = useState(false);

  const handleChange = (field: keyof BehaviorFormInput, value: any) => {
    setForm(prev => {
      // If class changes, clear selected student to force re-selection
      if (field === "class_id") {
        return { ...prev, [field]: value, student_id: "" };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      incident_type: form.category // Keep in sync
    });
  };

  useEffect(() => {
    if (!form.class_id) {
      setClassStudents([]);
      return;
    }

    let cancelled = false;
    setLoadingClassStudents(true);

    void (async () => {
      try {
        const result = await serviceRequest<Array<{ id?: string; _id?: string; name?: string; first_name?: string; last_name?: string }>>(
          `/api/students?class_id=${form.class_id}&status=active`
        );

        if (!result.ok || cancelled) {
          if (!cancelled) setClassStudents([]);
          return;
        }

        const rows = (result.data ?? []).map((student) => ({
          _id: String(student.id ?? student._id ?? ""),
          name: String(student.name ?? "Unnamed Student").trim() || "Unnamed Student",
          class_id: form.class_id
        })).filter((student) => Boolean(student._id));

        if (!cancelled) {
          setClassStudents(rows);
        }
      } catch {
        if (!cancelled) {
          setClassStudents([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingClassStudents(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.class_id]);

  // Improved filtering logic
  const visibleStudents = useMemo(() => {
    if (classStudents.length > 0) {
      return classStudents;
    }
    if (!form.class_id) return [];
    const selectedClassId = normalizeId(form.class_id);
    const matched = students.filter((student) => normalizeId(student.class_id) === selectedClassId);
    
    // If we have direct matches, show them. Otherwise fallback to all students to avoid empty list.
    return matched.length > 0 ? matched : students;
  }, [form.class_id, students, classStudents]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-8">
        {/* Section 1: Target Identification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Select
            label="Class"
            value={form.class_id}
            onChange={e => handleChange("class_id", e.target.value)}
            options={[{ label: "Select Class", value: "" }, ...classes.map(c => ({ label: c.name, value: c._id }))]}
            required
            className="h-11 rounded-xl"
          />
          <Select
            label="Student"
            value={form.student_id}
            onChange={e => handleChange("student_id", e.target.value)}
            options={[
                {
                  label: !form.class_id
                    ? "Select class first"
                    : loadingClassStudents
                      ? "Loading students..."
                      : "Select Student",
                  value: ""
                },
                ...visibleStudents.map(s => ({ label: s.name, value: s._id }))
            ]}
            required
            disabled={!form.class_id}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Section 2: Incident Details */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 px-1">
                <AppIcon name="AlertTriangle" size={18} className="text-slate-400" />
                <h3 className="text-[11px] font-black text-slate-900 normal-case tracking-tight">Incident Classification</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100">
                <Select
                    label="Incident Category"
                    value={form.category}
                    onChange={e => handleChange("category", e.target.value)}
                    options={[
                        { label: "Discipline", value: "discipline" },
                        { label: "Misconduct", value: "misconduct" },
                        { label: "Fighting", value: "fighting" },
                        { label: "Late Behavior", value: "late_behavior" },
                        { label: "Achievement", value: "achievement" },
                        { label: "Warning", value: "warning" },
                        { label: "Positive Behavior", value: "positive_behavior" },
                        { label: "Other", value: "other" },
                    ]}
                    className="h-11 rounded-xl bg-white"
                />
                <Select
                    label="Severity"
                    value={form.severity}
                    onChange={e => handleChange("severity", e.target.value)}
                    options={[
                        { label: "Low", value: "low" },
                        { label: "Medium", value: "medium" },
                        { label: "Critical", value: "critical" },
                    ]}
                    className="h-11 rounded-xl bg-white"
                />
            </div>
        </div>

        {/* Section 3: Narrative & Action */}
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                <Input
                    label="Incident Description"
                    placeholder="Provide a clear and objective description of what happened..."
                    value={form.description}
                    onChange={e => handleChange("description", e.target.value)}
                    required
                    className="h-11 rounded-xl"
                />
                <Input
                    label="Initial Action Taken (Optional)"
                    placeholder="Describe any immediate disciplinary action or intervention performed..."
                    value={form.action_taken}
                    onChange={e => handleChange("action_taken", e.target.value)}
                    className="h-11 rounded-xl"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Warning Count"
                    type="number"
                    min={1}
                    value={form.warning_count}
                    onChange={e => handleChange("warning_count", parseInt(e.target.value))}
                    className="h-11 rounded-xl"
                />
                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-3 w-full h-11 rounded-xl border border-slate-200 bg-white px-4 cursor-pointer hover:bg-slate-50 transition-colors">
                        <input
                        type="checkbox"
                        checked={form.parent_notified}
                        onChange={e => handleChange("parent_notified", e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-[11px] font-bold text-slate-700">Parent Notified</span>
                    </label>
                </div>
            </div>

            <Input
                label="Internal Notes / Proof (Optional)"
                placeholder="Private notes or links to proof/images..."
                value={form.notes}
                onChange={e => handleChange("notes", e.target.value)}
                className="h-11 rounded-xl"
            />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="h-10 px-8 rounded-xl text-[10px] font-bold normal-case "
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="h-10 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20 text-[10px] font-bold normal-case  transition-all active:scale-95 flex items-center gap-2"
        >
          <AppIcon name="ListPlus" size={18} />
          {initial ? "Update Record" : "Create Record"}
        </Button>
      </div>
    </form>
  );
}
