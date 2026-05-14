import { FormEvent, useState } from "react";
import { Button, Input, Select } from "@/components/ui";
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
    classOptions,
    showFooter = true
}: {
    onCreate: (input: TeacherFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    showFooter?: boolean;
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
        <form id="teacher-form-quick" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">Account Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Email Address"
                        placeholder="teacher@school.edu"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        error={errors.email}
                        required
                    />

                    <Input
                        label="Login Password"
                        placeholder="Set password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        error={errors.password}
                        required
                    />
                </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="First Name"
                        placeholder="e.g., John"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        error={errors.first_name}
                        required
                    />

                    <Input
                        label="Last Name"
                        placeholder="e.g., Doe"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Phone Number"
                        placeholder="+1 234 567 890"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        error={errors.phone}
                        required
                    />

                    <Input
                        label="Qualification"
                        placeholder="e.g., MSc Mathematics"
                        value={form.qualification || ""}
                        onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">Professional Assignment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Subject Specialization"
                        placeholder="e.g., Math, Science (comma-separated)"
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

                    <Select
                        label="Primary Class Assignment"
                        value={form.class_ids[0] || ""}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                class_ids: event.target.value ? [event.target.value] : []
                            })
                        }
                        options={[
                            { label: "Unassigned", value: "" },
                            ...classOptions.map(o => ({ label: o.label, value: o.id }))
                        ]}
                    />
                </div>
            </div>

            {showFooter && (
                <div className="flex justify-end pt-4 border-t border-border">
                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto min-w-[150px]"
                    >
                        {saving ? "Creating..." : "Add Teacher"}
                    </Button>
                </div>
            )}
        </form>
    );
}
