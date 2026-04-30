"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "../../../components/ui";
import { FormSection, FormGroup } from "../../../components/ui/FormSection";
import { spacing, colors } from "@edu/shared/design-system/tokens";
import { SettingsFormInput } from "../types/settings.types";

export function SettingsForm({
    initialValues,
    onSave
}: {
    initialValues: SettingsFormInput;
    onSave: (input: SettingsFormInput) => Promise<unknown>;
}) {
    const router = useRouter();
    const [form, setForm] = useState<SettingsFormInput>(initialValues);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm(initialValues);
    }, [initialValues]);

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("token");
        router.push("/auth/login");
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        await onSave(form);
        setSaving(false);
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: spacing.lg }}>
            <FormSection title="School Information" description="Update your school details" columns={2}>
                <FormGroup label="School Name">
                    <Input
                        placeholder="School name"
                        value={form.academy_name}
                        onChange={(e) => setForm({ ...form, academy_name: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Principal Name">
                    <Input
                        placeholder="Principal's name"
                        value={form.principal_name}
                        onChange={(e) => setForm({ ...form, principal_name: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Principal Email">
                    <Input
                        placeholder="principal@school.edu"
                        type="email"
                        value={form.principal_email}
                        onChange={(e) => setForm({ ...form, principal_email: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Principal Phone">
                    <Input
                        placeholder="Principal phone number"
                        type="tel"
                        value={form.principal_phone}
                        onChange={(e) => setForm({ ...form, principal_phone: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Email">
                    <Input
                        placeholder="school@example.com"
                        type="email"
                        value={form.academy_email}
                        onChange={(e) => setForm({ ...form, academy_email: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Phone">
                    <Input
                        placeholder="Phone number"
                        type="tel"
                        value={form.academy_phone}
                        onChange={(e) => setForm({ ...form, academy_phone: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Address">
                    <Input
                        placeholder="School address"
                        value={form.academy_address}
                        onChange={(e) => setForm({ ...form, academy_address: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Established Year">
                    <Input
                        type="number"
                        placeholder="Year established"
                        value={form.established_year}
                        onChange={(e) => setForm({ ...form, established_year: e.target.value })}
                    />
                </FormGroup>

                <FormGroup label="Logo URL">
                    <Input
                        placeholder="https://example.com/logo.png"
                        value={form.logo_url}
                        onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                    />
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
                {saving ? "Saving..." : "Save Settings"}
            </Button>

            <Button
                type="button"
                onClick={handleLogout}
                style={{
                    background: colors.error,
                    color: "white",
                    padding: `${spacing.md}px`,
                    alignSelf: "flex-start"
                }}
            >
                Logout
            </Button>
        </form>
    );
}
