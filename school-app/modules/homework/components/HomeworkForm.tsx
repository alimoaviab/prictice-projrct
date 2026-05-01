"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { HomeworkFormInput, HomeworkStatus } from "../types/homework.types";

export function HomeworkForm({
    onCreate,
    classOptions,
    teacherOptions
}: {
    onCreate: (input: HomeworkFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<HomeworkFormInput>({
        title: "",
        class_id: "",
        teacher_id: "",
        subject: "",
        due_at: "",
        instructions: "",
        status: "assigned"
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.title.trim()) newErrors.title = "Title is required";
        if (!form.class_id.trim()) newErrors.class_id = "Class is required";
        if (!form.teacher_id.trim()) newErrors.teacher_id = "Teacher is required";
        if (!form.subject.trim()) newErrors.subject = "Subject is required";
        if (!form.due_at) newErrors.due_at = "Due date is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const result = (await onCreate(form)) as { ok?: boolean } | undefined;
            if (result?.ok !== false) {
                setForm({
                    title: "",
                    class_id: "",
                    teacher_id: "",
                    subject: "",
                    due_at: "",
                    instructions: "",
                    status: "assigned"
                });
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="Assign Homework" description="Create new homework assignment" columns={2}>
                <FormGroup label="Title" required error={errors.title}>
                    <Input
                        placeholder="e.g., Math Algebra Problems"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Class" required error={errors.class_id}>
                    <select
                        value={form.class_id}
                        onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                        style={{
                            padding: spacing.sm,
                            borderRadius: "4px",
                            border: `1px solid ${colors.outline}`,
                            minHeight: 42
                        }}
                    >
                        <option value="">Select class</option>
                        {classOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Teacher" required error={errors.teacher_id}>
                    <select
                        value={form.teacher_id}
                        onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                        style={{
                            padding: spacing.sm,
                            borderRadius: "4px",
                            border: `1px solid ${colors.outline}`,
                            minHeight: 42
                        }}
                    >
                        <option value="">Select teacher</option>
                        {teacherOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Subject" required error={errors.subject}>
                    <Input
                        placeholder="e.g., Mathematics"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Due Date" required error={errors.due_at}>
                    <Input
                        type="date"
                        value={form.due_at}
                        onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Instructions">
                    <Input
                        placeholder="Describe the homework assignment"
                        value={form.instructions || ""}
                        onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Status">
                    <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as HomeworkStatus })}
                        style={{
                            padding: spacing.sm,
                            borderRadius: "4px",
                            border: `1px solid ${colors.outline}`,
                            minHeight: 42
                        }}
                    >
                        <option value="assigned">Assigned</option>
                        <option value="draft">Draft</option>
                        <option value="closed">Closed</option>
                    </select>
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
                {saving ? "Creating..." : "Assign Homework"}
            </Button>
        </form>
    );
}
