/**
 * Shared teacher form. Used by both:
 *   - /admin/teachers/create  →  mode="create"
 *   - /admin/teachers/edit/:id → mode="edit" (with initialValues)
 *
 * In edit mode:
 *   - The password field is optional (leave blank to keep current)
 *   - The submit button reads "Update Teacher"
 *   - Validation skips the required-password check
 *
 * The visual layout, sections, spacing, and inputs are identical between
 * modes — the edit page is "the create page, but pre-filled".
 */

import { FormEvent, useEffect, useState } from "react";
import { AppIcon } from "shared/ui/AppIcon";
import { Button, Input, Select } from "@/components/ui";
import { TeacherFormInput, TeacherRow } from "../types/teacher.types";

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

export type TeacherFormMode = "create" | "edit";

interface TeacherFormProps {
    /** Submit handler. Should return a promise; if it resolves with `{ ok: false }` the form keeps its values. */
    onSubmit: (input: TeacherFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    /** Existing teacher record. When provided, the form runs in edit mode. */
    initialValues?: TeacherRow | null;
    mode?: TeacherFormMode;
    showFooter?: boolean;
    /** Optional cancel-button (rendered next to the submit) — used by the edit page. */
    onCancel?: () => void;
    saving?: boolean;
}

/** Backwards-compatible alias retained for older call sites. */
export interface LegacyTeacherFormProps {
    onCreate: (input: TeacherFormInput) => Promise<unknown>;
    classOptions: Array<{ id: string; label: string }>;
    showFooter?: boolean;
}

export function TeacherForm({
    onSubmit,
    classOptions,
    initialValues,
    mode,
    showFooter = true,
    onCancel,
    saving: savingProp,
}: TeacherFormProps) {
    const formMode: TeacherFormMode =
        mode ?? (initialValues ? "edit" : "create");

    const [form, setForm] = useState<TeacherFormInput>(() =>
        initialValues ? mapInitialValues(initialValues) : initialForm
    );
    const [internalSaving, setInternalSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Sync incoming initialValues — important when the edit page finishes
    // loading the teacher record after first paint.
    useEffect(() => {
        if (initialValues) {
            setForm(mapInitialValues(initialValues));
        }
    }, [initialValues]);

    const saving = savingProp ?? internalSaving;

    function validate() {
        const newErrors: Record<string, string> = {};
        if (!form.first_name.trim()) newErrors.first_name = "First name is required";
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email address";
        }
        if (!form.phone.trim()) newErrors.phone = "Phone number is required";
        if (formMode === "create" && !form.password.trim()) {
            newErrors.password = "Password is required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!validate()) return;
        if (savingProp === undefined) setInternalSaving(true);
        try {
            // In edit mode, drop the password field if it wasn't changed
            // so the backend doesn't overwrite the existing hash.
            const payload =
                formMode === "edit" && (!isChangingPassword || !form.password.trim())
                    ? { ...form, password: undefined as unknown as string }
                    : form;

            const result = (await onSubmit(payload)) as { ok?: boolean } | undefined;
            if (formMode === "create" && result?.ok !== false) {
                setForm(initialForm);
            }
        } finally {
            if (savingProp === undefined) setInternalSaving(false);
        }
    }

    return (
        <form id="teacher-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">
                    Account Credentials
                </h3>
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

                    {formMode === "edit" && !isChangingPassword ? (
                        <div className="flex items-end gap-3 w-full">
                            <Input
                                label="Login Password"
                                type="password"
                                value="••••••••"
                                disabled
                                className="h-11 rounded-xl bg-slate-50 border-slate-200 text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => setIsChangingPassword(true)}
                                className="h-11 px-4 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-xs transition-all tracking-wide normal-case active:scale-95 shrink-0"
                            >
                                Change Password
                            </button>
                        </div>
                    ) : (
                        <Input
                            label={
                                formMode === "edit"
                                    ? "New Password"
                                    : "Login Password"
                            }
                            placeholder={
                                formMode === "edit"
                                    ? "Enter new password"
                                    : "Set password"
                            }
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            error={errors.password}
                            required={formMode === "create"}
                            className="h-11 rounded-xl bg-white border-slate-200"
                            rightIcon={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <AppIcon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                                </button>
                            }
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">
                    Personal Details
                </h3>
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
                <h3 className="text-sm font-semibold text-gray-400 normal-case ">
                    Professional Assignment
                </h3>
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
                            ...classOptions.map((o) => ({ label: o.label, value: o.id })),
                        ]}
                    />
                </div>
            </div>

            {showFooter && (
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onCancel}
                            disabled={saving}
                            className="min-w-[120px]"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={saving}
                        className="w-full md:w-auto min-w-[150px]"
                    >
                        {saving
                            ? formMode === "edit"
                                ? "Updating..."
                                : "Creating..."
                            : formMode === "edit"
                                ? "Update Teacher"
                                : "Add Teacher"}
                    </Button>
                </div>
            )}
        </form>
    );
}

function mapInitialValues(t: TeacherRow): TeacherFormInput {
    return {
        first_name: t.first_name ?? "",
        last_name: t.last_name ?? "",
        email: t.email ?? "",
        phone: t.phone ?? "",
        qualification: t.qualification ?? "",
        subjects: t.subjects ?? [],
        class_ids: t.class_ids ?? [],
        password: "",
    };
}

/* ─────────────────────────────────────────────────────────────────────
   Backwards-compatible wrapper for any older call site that still uses
   `<TeacherForm onCreate={...} />`. New code should use `onSubmit`.
   ───────────────────────────────────────────────────────────────────── */
export function LegacyTeacherForm(props: LegacyTeacherFormProps) {
    return (
        <TeacherForm
            onSubmit={props.onCreate}
            classOptions={props.classOptions}
            showFooter={props.showFooter}
        />
    );
}
