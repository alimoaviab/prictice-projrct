"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { TeacherFormInput } from "../types/teacher.types";

const initialForm: TeacherFormInput = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    qualification: "",
    subjects: [],
    class_ids: [],
    password: ""
};

export function TeacherForm({
    onCreate,
    classOptions
}: {
    onCreate: (input: TeacherFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
}) {
    const [form, setForm] = useState<TeacherFormInput>(initialForm);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.first_name.trim()) newErrors.first_name = "First name is required";
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email address";
        }
        if (!form.phone.trim()) newErrors.phone = "Phone number is required";
        if (!form.password.trim()) newErrors.password = "Password is required";
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
                setForm(initialForm);
            }
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="Teacher Information" description="Add a new teacher to your school" columns={2}>
                <FormGroup label="Email" required error={errors.email}>
                    <Input
                        placeholder="teacher@school.edu"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Password" required error={errors.password}>
                    <Input
                        placeholder="Set teacher login password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="First Name" required error={errors.first_name}>
                    <Input
                        placeholder="Teacher's first name"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Last Name">
                    <Input
                        placeholder="Teacher's last name"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Phone Number" required error={errors.phone}>
                    <Input
                        placeholder="Teacher's contact number"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Qualification">
                    <Input
                        placeholder="e.g., MSc Mathematics"
                        value={form.qualification || ""}
                        onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Subject Specialization">
                    <Input
                        placeholder="e.g., Mathematics, English (comma-separated)"
                        value={form.subjects?.join(", ") || ""}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                subjects: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter((s) => s.length > 0)
                            })
                        }
                    />
                </FormGroup>

                <FormGroup label="Assign Class">
                    <select
                        value={form.class_ids[0] || ""}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                class_ids: event.target.value ? [event.target.value] : []
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
                        {classOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
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
                {saving ? "Creating..." : "Add Teacher"}
            </Button>
        </form>
    );
}
