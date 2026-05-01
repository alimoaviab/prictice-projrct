"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { ServiceResult } from "@edu/shared/types/core";
import { ResultFormInput, ResultOption } from "../types/result.types";

const controlStyle = {
    height: 40,
    borderRadius: 8,
    border: `1px solid ${colors.cardBorder}`,
    background: colors.surfaceContainerLowest,
    color: colors.onSurface,
    padding: `0 ${spacing.sm}px`,
    outlineColor: colors.actionBlue
};

export function ResultForm({
    examOptions,
    studentOptions,
    onCreate
}: {
    examOptions: ResultOption[];
    studentOptions: ResultOption[];
    onCreate: (input: ResultFormInput) => Promise<ServiceResult<unknown>>;
}) {
    const [form, setForm] = useState<ResultFormInput>({
                exam_id: examOptions[0]?.id ?? "",
                student_id: studentOptions[0]?.id ?? "",
                obtained_marks: 0,
                grade: "",
                remarks: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedExam = examOptions.find((item) => item.id === form.exam_id);
    const visibleStudentOptions = selectedExam?.class_id
        ? studentOptions.filter((item) => item.class_id === selectedExam.class_id)
        : studentOptions;

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.student_id.trim()) newErrors.student_id = "Student is required";
        if (!form.exam_id.trim()) newErrors.exam_id = "Exam is required";
        if (form.obtained_marks < 0) newErrors.obtained_marks = "Marks cannot be negative";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const result = await onCreate(form);
            if (result.ok) {
                setForm({
                    exam_id: examOptions[0]?.id ?? "",
                    student_id: studentOptions[0]?.id ?? "",
                    obtained_marks: 0,
                    grade: "",
                    remarks: ""
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="Enter Results" description="Record exam results for students" columns={2}>
                <FormGroup label="Student" required error={errors.student_id}>
                    <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} style={controlStyle}>
                        <option value="">Select student</option>
                        {visibleStudentOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Exam" required error={errors.exam_id}>
                    <select
                        value={form.exam_id}
                        onChange={(e) => {
                            const nextExamId = e.target.value;
                            const nextExam = examOptions.find((item) => item.id === nextExamId);
                            const nextStudents = nextExam?.class_id
                                ? studentOptions.filter((item) => item.class_id === nextExam.class_id)
                                : studentOptions;

                            setForm({
                                ...form,
                                exam_id: nextExamId,
                                student_id: nextStudents.some((item) => item.id === form.student_id)
                                    ? form.student_id
                                    : nextStudents[0]?.id ?? ""
                            });
                        }}
                        style={controlStyle}
                    >
                        <option value="">Select exam</option>
                        {examOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Obtained Marks" required error={errors.obtained_marks}>
                    <Input
                        type="number"
                        min="0"
                        placeholder="Marks obtained"
                        value={form.obtained_marks}
                        onChange={(e) => setForm({ ...form, obtained_marks: parseFloat(e.target.value) || 0 })}
                    />
                </FormGroup>

                <FormGroup label="Grade">
                    <Input placeholder="e.g., A, B, C, D, F" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} />
                </FormGroup>

                <FormGroup label="Remarks">
                    <Input
                        placeholder="Add any remarks or comments"
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    />
                </FormGroup>
            </FormSection>

            <Button
                type="submit"
                disabled={saving}
                style={{
                    background: colors.actionBlue,
                    color: "white",
                    padding: `${spacing.md}px`,
                    alignSelf: "flex-start"
                }}
            >
                {saving ? "Saving..." : "Save Result"}
            </Button>
        </form>
    );
}
