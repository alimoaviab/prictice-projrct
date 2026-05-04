"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
import { HomeworkFormInput, HomeworkStatus } from "../types/homework.types";

export function HomeworkForm({
    onCreate,
    classOptions,
    teacherOptions,
    subjectOptions = []
}: {
    onCreate: (input: HomeworkFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions?: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<HomeworkFormInput>({
        title: "",
        class_id: "",
        teacher_id: "",
        subject_id: "",
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
        if (!form.subject_id.trim()) newErrors.subject_id = "Subject is required";
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
                    subject_id: "",
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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Assignment Title"
                    placeholder="e.g., Math Algebra Problems"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    error={errors.title}
                    required
                />

                <Select
                    label="Subject"
                    value={form.subject_id}
                    onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    options={[
                        { label: "Select subject", value: "" },
                        ...subjectOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.subject_id}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Target Class"
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                    options={[
                        { label: "Select class", value: "" },
                        ...classOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.class_id}
                    required
                />

                <Select
                    label="Assigning Teacher"
                    value={form.teacher_id}
                    onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                    options={[
                        { label: "Select teacher", value: "" },
                        ...teacherOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.teacher_id}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Due Date"
                    type="date"
                    value={form.due_at}
                    onChange={(e) => setForm({ ...form, due_at: e.target.value })}
                    error={errors.due_at}
                    required
                />

                <Select
                    label="Assignment Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as HomeworkStatus })}
                    options={[
                        { label: "Assigned", value: "assigned" },
                        { label: "Draft", value: "draft" },
                        { label: "Closed", value: "closed" }
                    ]}
                />
            </div>

            <Input
                label="Instructions"
                placeholder="Describe the homework assignment in detail..."
                value={form.instructions || ""}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Creating..." : "Assign Homework"}
                </Button>
            </div>
        </form>
    );
}
