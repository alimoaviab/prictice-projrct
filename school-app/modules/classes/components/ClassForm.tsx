"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
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
    teacherOptions,
    subjectOptions
}: {
    onCreate: (input: ClassFormInput) => Promise<unknown>;
    academyCareOptions: Array<{ id: string; label: string }>;
    teacherOptions: Array<{ id: string; label: string }>;
    subjectOptions: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<ClassFormInput>({ ...initialForm, subjects: [] });
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
        setForm({ ...initialForm, subjects: [] });
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Class Name"
                        placeholder="e.g., Class 10-A"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        error={errors.name}
                        required
                    />

                    <Select
                        label="Linked Academy Year"
                        value={form.academy_care_id}
                        onChange={(event) => setForm({ ...form, academy_care_id: event.target.value })}
                        options={[
                            { label: "Select academic year", value: "" },
                            ...academyCareOptions.map(o => ({ label: o.label, value: o.id }))
                        ]}
                        error={errors.academy_care_id}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Assigned Teacher"
                        value={form.teacher_ids[0] || ""}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                teacher_ids: event.target.value ? [event.target.value] : []
                            })
                        }
                        options={[
                            { label: "Unassigned", value: "" },
                            ...teacherOptions.map(o => ({ label: o.label, value: o.id }))
                        ]}
                    />

                    <Input
                        label="Room Number"
                        placeholder="e.g., Room 101"
                        value={form.room_number || ""}
                        onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    />
                </div>

                <Input
                    label="Description"
                    placeholder="Add description or notes"
                    value={form.description || ""}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Subjects</h3>
                <div className="space-y-2 max-h-44 overflow-y-auto rounded-lg border border-border p-3">
                    {subjectOptions.length === 0 ? (
                        <p className="text-sm text-gray-500">No subjects found. Please add subjects first.</p>
                    ) : (
                        subjectOptions.map((subject) => {
                            const checked = form.subjects.includes(subject.label);
                            return (
                                <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => {
                                            const nextSubjects = event.target.checked
                                                ? [...form.subjects, subject.label]
                                                : form.subjects.filter((name) => name !== subject.label);
                                            setForm({ ...form, subjects: nextSubjects });
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">{subject.label}</span>
                                </label>
                            );
                        })
                    )}
                </div>
                {errors.subjects ? <span className="text-xs text-error block">{errors.subjects}</span> : null}
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Creating..." : "Create Class"}
                </Button>
            </div>
        </form>
    );
}
