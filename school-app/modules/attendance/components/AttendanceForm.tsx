"use client";

import { FormEvent, useState } from "react";
import { Button, Input, Select } from "../../../components/ui";
import { AttendanceFormInput, AttendanceStatus } from "../types/attendance.types";

export function AttendanceForm({
    onCreate,
    classOptions,
    studentOptions
}: {
    onCreate: (input: AttendanceFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    studentOptions: Array<{ id: string; class_id: string; label: string }>;
}) {
    const [form, setForm] = useState<AttendanceFormInput>({
        student_id: "",
        class_id: "",
        date: new Date().toISOString().split("T")[0],
        status: "present",
        note: ""
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.student_id.trim()) newErrors.student_id = "Student is required";
        if (!form.class_id.trim()) newErrors.class_id = "Class is required";
        if (!form.date) newErrors.date = "Date is required";
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
                    student_id: "",
                    class_id: "",
                    date: new Date().toISOString().split("T")[0],
                    status: "present",
                    note: ""
                });
            }
        } finally {
            setSaving(false);
        }
    }

    const filteredStudents = studentOptions.filter((student) => !form.class_id || student.class_id === form.class_id);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="Class"
                    value={form.class_id}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            class_id: e.target.value,
                            student_id: ""
                        })
                    }
                    options={[
                        { label: "Select class", value: "" },
                        ...classOptions.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.class_id}
                    required
                />

                <Select
                    label="Student"
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    options={[
                        { label: "Select student", value: "" },
                        ...filteredStudents.map(o => ({ label: o.label, value: o.id }))
                    ]}
                    error={errors.student_id}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    error={errors.date}
                    required
                />

                <Select
                    label="Status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as AttendanceStatus })}
                    options={[
                        { label: "Present", value: "present" },
                        { label: "Absent", value: "absent" },
                        { label: "Late", value: "late" },
                        { label: "Excused", value: "excused" }
                    ]}
                />
            </div>

            <Input
                label="Remarks"
                placeholder="Add any remarks..."
                value={form.note || ""}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
            />

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Recording..." : "Record Attendance"}
                </Button>
            </div>
        </form>
    );
}
