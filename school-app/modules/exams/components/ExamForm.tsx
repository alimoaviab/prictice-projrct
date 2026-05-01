"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { ServiceResult } from "@edu/shared/types/core";
import { ExamFormInput, ExamOption } from "../types/exam.types";

const controlStyle = {
  height: 40,
  borderRadius: 8,
  border: `1px solid ${colors.cardBorder}`,
  background: colors.surfaceContainerLowest,
  color: colors.onSurface,
  padding: `0 ${spacing.sm}px`,
  outlineColor: colors.actionBlue
};

export function ExamForm({
  classOptions,
  onCreate
}: {
  classOptions: ExamOption[];
  onCreate: (input: ExamFormInput) => Promise<ServiceResult<unknown>>;
}) {
    const [form, setForm] = useState<ExamFormInput>({
        class_id: classOptions[0]?.id ?? "",
        subject: "",
        title: "",
        starts_at: "",
        max_marks: 100,
        status: "scheduled",
        description: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = "Exam title is required";
        if (!form.subject.trim()) newErrors.subject = "Subject is required";
        if (!form.class_id.trim()) newErrors.class_id = "Class is required";
        if (!form.starts_at) newErrors.starts_at = "Date is required";
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
                    class_id: classOptions[0]?.id ?? "",
                    subject: "",
                    title: "",
                    starts_at: "",
                    max_marks: 100,
                    status: "scheduled",
                    description: ""
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="Schedule Exam" description="Create new exam schedule" columns={2}>
                <FormGroup label="Exam Title" required error={errors.title}>
                    <Input placeholder="e.g., Mid-Term Exam" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </FormGroup>

                <FormGroup label="Subject" required error={errors.subject}>
                    <Input placeholder="e.g., Mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                </FormGroup>

                <FormGroup label="Class" required error={errors.class_id}>
                    <select
                        value={form.class_id}
                        onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                        style={controlStyle}
                    >
                        <option value="">Select class</option>
                        {classOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Date" required error={errors.starts_at}>
                    <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </FormGroup>

                <FormGroup label="Total Marks">
                    <Input type="number" min="1" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 100 })} />
                </FormGroup>

                <FormGroup label="Status">
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExamFormInput["status"] })} style={controlStyle}>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </FormGroup>

                <FormGroup label="Description">
                    <Input placeholder="Exam description or instructions" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
                {saving ? "Creating..." : "Schedule Exam"}
            </Button>
        </form>
    );
}
