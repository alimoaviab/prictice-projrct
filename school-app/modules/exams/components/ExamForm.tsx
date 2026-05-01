"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
import { ServiceResult } from "@edu/shared/types/core";
import { ExamFormInput, ExamOption } from "../types/exam.types";

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Exam Title"
                    placeholder="e.g., Mid-Term Exam"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    error={errors.title}
                    required
                />

                <Select
                    label="Subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    options={[
                        { label: "Select subject", value: "" },
                        { label: "Mathematics", value: "Mathematics" },
                        { label: "English", value: "English" },
                        { label: "Science", value: "Science" },
                        { label: "History", value: "History" }
                    ]}
                    error={errors.subject}
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

                <Input
                    label="Exam Date"
                    type="date"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    error={errors.starts_at}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Total Marks"
                    type="number"
                    min="1"
                    value={form.max_marks}
                    onChange={(e) => setForm({ ...form, max_marks: parseInt(e.target.value) || 100 })}
                />

                <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ExamFormInput["status"] })}
                    options={[
                        { label: "Scheduled", value: "scheduled" },
                        { label: "Completed", value: "completed" },
                        { label: "Cancelled", value: "cancelled" }
                    ]}
                />
            </div>

            <Input
                label="Description (Optional)"
                placeholder="Exam description or instructions..."
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Scheduling..." : "Schedule Exam"}
                </Button>
            </div>
        </form>
    );
}
