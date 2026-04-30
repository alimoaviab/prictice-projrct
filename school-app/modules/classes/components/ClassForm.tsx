"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { ClassFormInput } from "../types/class.types";

const initialForm: ClassFormInput = {
    name: "",
    academy_care_id: "",
    teacher_ids: [],
    subjects: [""],
    room_number: "",
    description: ""
};

export function ClassForm({
    onCreate,
    academyCareOptions,
    teacherOptions
}: {
    onCreate: (input: ClassFormInput) => Promise<unknown>;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<ClassFormInput>({
        ...initialForm
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.name.trim()) newErrors.name = "Class name is required";
        if (!form.academy_care_id.trim()) newErrors.academy_care_id = "Academy Care is required";
        if (form.subjects.filter((subject) => subject.trim()).length === 0) newErrors.subjects = "At least one subject is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onCreate({
            ...form,
            subjects: form.subjects.map((subject) => subject.trim()).filter(Boolean)
        });
        setForm({ ...initialForm });
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="Class Details" description="Create a new class for your school" columns={2}>
                <FormGroup label="Class Name" required error={errors.name}>
                    <Input
                        placeholder="e.g., Class 10-A"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Linked Academy Care" required error={errors.academy_care_id}>
                    <select
                        value={form.academy_care_id}
                        onChange={(event) => setForm({ ...form, academy_care_id: event.target.value })}
                        style={{
                            padding: spacing.sm,
                            borderRadius: 4,
                            border: `1px solid ${colors.outline}`,
                            minHeight: 42
                        }}
                    >
                        <option value="">Select academic year</option>
                        {academyCareOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Assigned Teacher">
                    <select
                        value={form.teacher_ids[0] || ""}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                teacher_ids: event.target.value ? [event.target.value] : []
                            })
                        }
                        style={{
                            padding: spacing.sm,
                            borderRadius: 4,
                            border: `1px solid ${colors.outline}`,
                            minHeight: 42
                        }}
                    >
                        <option value="">Unassigned</option>
                        {teacherOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </FormGroup>

                <FormGroup label="Room Number">
                    <Input
                        placeholder="e.g., Room 101"
                        value={form.room_number || ""}
                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Description">
                    <Input
                        placeholder="Add description or notes"
                        value={form.description || ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                </FormGroup>
            </FormSection>

            <FormSection title="Subjects" description="Add one or more subjects attached to this class">
                <div style={{ display: "grid", gap: spacing.sm }}>
                    {form.subjects.map((subject, index) => (
                        <div key={`${index}-${subject}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: spacing.sm }}>
                            <Input
                                placeholder={`Subject ${index + 1}`}
                                value={subject}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        subjects: form.subjects.map((value, subjectIndex) =>
                                            subjectIndex === index ? event.target.value : value
                                        )
                                    })
                                }
                            />
                            <Button
                                type="button"
                                onClick={() =>
                                    setForm({
                                        ...form,
                                        subjects:
                                            form.subjects.length === 1
                                                ? form.subjects
                                                : form.subjects.filter((_, subjectIndex) => subjectIndex !== index)
                                    })
                                }
                                style={{ minWidth: 44 }}
                            >
                                -
                            </Button>
                        </div>
                    ))}
                    <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
                        <Button
                            type="button"
                            onClick={() => setForm({ ...form, subjects: [...form.subjects, ""] })}
                            style={{ minWidth: 44 }}
                        >
                            +
                        </Button>
                        <span style={{ color: colors.onSurfaceVariant, fontSize: 14 }}>
                            Add another subject
                        </span>
                    </div>
                    {errors.subjects ? <span style={{ color: colors.error, fontSize: 14 }}>{errors.subjects}</span> : null}
                </div>
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
                {saving ? "Creating..." : "Create Class"}
            </Button>
        </form>
    );
}
