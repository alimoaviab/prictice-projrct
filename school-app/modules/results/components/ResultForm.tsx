"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
import { ResultFormInput, ResultOption } from "../types/result.types";

export function ResultForm({
  examOptions,
  studentOptions,
  onCreate
}: {
  examOptions: ResultOption[];
  studentOptions: ResultOption[];
  onCreate: (input: ResultFormInput) => Promise<unknown>;
}) {
    const [form, setForm] = useState<ResultFormInput>({
        exam_id: "",
        student_id: "",
        obtained_marks: 0,
        grade: "",
        remarks: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.exam_id.trim()) newErrors.exam_id = "Exam is required";
        if (!form.student_id.trim()) newErrors.student_id = "Student is required";
        if (form.obtained_marks < 0) newErrors.obtained_marks = "Marks cannot be negative";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            await onCreate(form);
            setForm({
                exam_id: "",
                student_id: "",
                obtained_marks: 0,
                grade: "",
                remarks: ""
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Select Exam"
                    value={form.exam_id}
                    onChange={(e) => setForm({ ...form, exam_id: e.target.value })}
                    options={[
                        { label: "Choose an exam", value: "" },
                        ...examOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.exam_id}
                    required
                />

                <Select
                    label="Select Student"
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    options={[
                        { label: "Choose a student", value: "" },
                        ...studentOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.student_id}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                    label="Marks Obtained"
                    type="number"
                    min="0"
                    value={form.obtained_marks}
                    onChange={(e) => setForm({ ...form, obtained_marks: parseInt(e.target.value) || 0 })}
                    error={errors.obtained_marks}
                    required
                />

                <Input
                    label="Grade"
                    placeholder="e.g., A+"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />

                <Input
                    label="Remarks (Optional)"
                    placeholder="e.g., Excellent performance"
                    value={form.remarks || ""}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Saving..." : "Save Result"}
                </Button>
            </div>
        </form>
    );
}
