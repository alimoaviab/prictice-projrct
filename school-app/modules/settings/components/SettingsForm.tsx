"use client";

import { FormEvent, useState } from "react";
import { Button, Input } from "../../../components/ui";
import { SettingsFormInput } from "../types/settings.types";

export function SettingsForm({
    initialValues,
    onSave
}: {
    initialValues: SettingsFormInput;
    onSave: (values: SettingsFormInput) => Promise<unknown>;
}) {
    const [form, setForm] = useState<SettingsFormInput>(initialValues);
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Institution Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="School Name"
                        placeholder="Eduplexo Academy"
                        value={form.academy_name}
                        onChange={(e) => setForm({ ...form, academy_name: e.target.value })}
                        required
                    />

                    <Input
                        label="Principal Name"
                        placeholder="Dr. John Doe"
                        value={form.principal_name || ""}
                        onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
                    />
                </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Official Email"
                        type="email"
                        placeholder="info@school.edu"
                        value={form.academy_email}
                        onChange={(e) => setForm({ ...form, academy_email: e.target.value })}
                        required
                    />

                    <Input
                        label="Phone Number"
                        type="tel"
                        placeholder="+1 234 567 890"
                        value={form.academy_phone || ""}
                        onChange={(e) => setForm({ ...form, academy_phone: e.target.value })}
                    />
                </div>

                <Input
                    label="School Address"
                    placeholder="123 Education St, Knowledge City"
                    value={form.academy_address || ""}
                    onChange={(e) => setForm({ ...form, academy_address: e.target.value })}
                />
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full md:w-auto min-w-[150px]"
                >
                    {saving ? "Saving..." : "Save Configuration"}
                </Button>
            </div>
        </form>
    );
}
